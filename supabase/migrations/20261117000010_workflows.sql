-- ZARASOA v2.1 — Fonctions contrôlées (RPC) : e-mail confirmé, blocage de compte, approbation étudiants

-- ───────── Confirmation d'e-mail Supabase Auth → demande étudiante passe en attente admin ─────────
create or replace function public.handle_auth_user_updated()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_request uuid;
begin
  perform set_config('app.bypass_profile_guard', 'on', true);
  if new.email is distinct from old.email then
    update public.profiles set email = coalesce(new.email, email) where id = new.id;
  end if;
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.student_registration_requests
       set email_confirmed_at = new.email_confirmed_at, request_status = 'pending_admin'
     where user_id = new.id and request_status = 'pending_email'
    returning id into v_request;
    if v_request is not null then
      update public.profiles set account_status = 'pending_admin'
       where id = new.id and account_status = 'pending_email';
      insert into public.student_validation_events (registration_request_id, event_type, previous_status, new_status)
      values (v_request, 'email_confirmed', 'pending_email', 'pending_admin');
    end if;
  end if;
  return null;
end $$;
create trigger on_auth_user_updated
  after update of email, email_confirmed_at on auth.users
  for each row execute function public.handle_auth_user_updated();

create or replace function public.log_registration_submitted()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.student_validation_events (registration_request_id, event_type, new_status, actor_user_id)
  values (new.id, 'submitted', new.request_status, new.user_id);
  return null;
end $$;
create trigger trg_requests_submitted after insert on public.student_registration_requests
  for each row execute function public.log_registration_submitted();

-- ───────── Blocage après 5 échecs (appelées par une action serveur Next.js avec la clé secrète) ─────────
create or replace function public.register_login_failure(
  p_email text, p_ip inet default null, p_user_agent text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.profiles%rowtype; v_count smallint; v_locked boolean := false;
begin
  select * into p from public.profiles
   where lower(btrim(email)) = lower(btrim(p_email)) for update;
  if not found then
    return jsonb_build_object('found', false);        -- ne rien révéler sur l'existence du compte
  end if;
  if p.account_status = 'locked' then
    return jsonb_build_object('found', true, 'locked', true, 'failed_count', p.failed_login_count);
  end if;

  v_count := p.failed_login_count + 1;
  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles set failed_login_count = v_count where id = p.id;
  insert into public.account_security_events (user_id, event_type, ip_address, user_agent)
  values (p.id, 'login_failed', p_ip, p_user_agent);

  if v_count >= 5 and p.account_status in ('approved','pending_email','pending_admin') then
    update public.profiles set account_status = 'locked', locked_at = now() where id = p.id;
    insert into public.account_security_events (user_id, event_type, ip_address, user_agent, event_reason)
    values (p.id, 'account_locked', p_ip, p_user_agent, '5 échecs de connexion consécutifs');
    v_locked := true;
  end if;
  return jsonb_build_object('found', true, 'locked', v_locked, 'failed_count', v_count, 'user_id', p.id);
end $$;

create or replace function public.register_login_success(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles set failed_login_count = 0, last_seen_at = now()
   where id = p_user_id and account_status <> 'locked';
end $$;

create or replace function public.unlock_account(p_user_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_new_status text;
begin
  if not public.is_super_admin() then
    raise exception 'Réservé au super administrateur' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id and account_status = 'locked') then
    raise exception 'Ce compte n''est pas bloqué';
  end if;
  select case when exists (select 1 from public.user_roles where user_id = p_user_id and revoked_at is null)
              then 'approved' else 'pending_admin' end into v_new_status;
  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles
     set account_status = v_new_status, failed_login_count = 0, locked_at = null
   where id = p_user_id;
  insert into public.account_security_events (user_id, event_type, actor_user_id, event_reason)
  values (p_user_id, 'account_unlocked', auth.uid(), p_reason);
  perform public.log_admin_action('account_unlocked', 'profiles', p_user_id, null, null, p_reason);
end $$;

-- ───────── Désactivation / suppression de son propre compte ─────────
create or replace function public.assert_not_last_super_admin()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if public.is_super_admin() and (
    select count(*) from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    where ur.role_code = 'super_admin' and ur.revoked_at is null
      and p.account_status = 'approved' and p.deleted_at is null
  ) <= 1 then
    raise exception 'Le dernier super administrateur actif ne peut pas quitter la plateforme' using errcode = '42501';
  end if;
end $$;

-- NB : la ré-authentification et la révocation des sessions se font côté serveur Next.js.
create or replace function public.deactivate_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Non authentifié' using errcode = '42501'; end if;
  perform public.assert_not_last_super_admin();
  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles set account_status = 'deactivated', deactivated_at = now() where id = auth.uid();
  insert into public.account_security_events (user_id, event_type, actor_user_id)
  values (auth.uid(), 'account_deactivated', auth.uid());
  -- Règle d'archivage des cours d'un professeur désactivé : À VALIDER (§11).
end $$;

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Non authentifié' using errcode = '42501'; end if;
  perform public.assert_not_last_super_admin();
  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles
     set account_status = 'deactivated', deactivated_at = coalesce(deactivated_at, now()), deleted_at = now()
   where id = auth.uid();
  insert into public.account_security_events (user_id, event_type, actor_user_id)
  values (auth.uid(), 'account_deleted', auth.uid());
end $$;

-- ───────── Validation administrative des étudiants ─────────
create or replace function public.approve_student_request(
  p_request_id uuid, p_filiere_id uuid, p_parcours_id uuid, p_level_id uuid
) returns uuid language plpgsql security definer set search_path = '' as $$
declare r public.student_registration_requests%rowtype; v_student uuid;
begin
  if not public.is_super_admin() then
    raise exception 'Réservé au super administrateur' using errcode = '42501';
  end if;
  select * into r from public.student_registration_requests where id = p_request_id for update;
  if not found then raise exception 'Demande introuvable'; end if;
  if r.request_status <> 'pending_admin' then
    raise exception 'Demande non traitable (statut : %)', r.request_status;
  end if;

  insert into public.student_profiles
    (user_id, registration_number, current_filiere_id, current_parcours_id, current_level_id, approved_at, approved_by)
  values
    (r.user_id, public.normalize_registration_number(r.registration_number),
     p_filiere_id, p_parcours_id, p_level_id, now(), auth.uid())
  returning id into v_student;

  update public.student_registration_requests
     set request_status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
   where id = r.id;

  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles set account_status = 'approved' where id = r.user_id;

  insert into public.user_roles (user_id, role_code, assigned_by)
  values (r.user_id, 'student', auth.uid())
  on conflict (user_id, role_code) where revoked_at is null do nothing;

  insert into public.student_validation_events
    (registration_request_id, event_type, previous_status, new_status, actor_user_id)
  values (r.id, 'approved', r.request_status, 'approved', auth.uid());

  perform public.log_admin_action('student_approved', 'student_profiles', v_student, null,
    jsonb_build_object('filiere_id', p_filiere_id, 'parcours_id', p_parcours_id, 'level_id', p_level_id), null);
  return v_student;
end $$;

create or replace function public.reject_student_request(p_request_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.student_registration_requests%rowtype;
begin
  if not public.is_super_admin() then
    raise exception 'Réservé au super administrateur' using errcode = '42501';
  end if;
  select * into r from public.student_registration_requests where id = p_request_id for update;
  if not found then raise exception 'Demande introuvable'; end if;
  if r.request_status not in ('pending_admin','pending_email') then
    raise exception 'Demande non traitable (statut : %)', r.request_status;
  end if;

  update public.student_registration_requests
     set request_status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), decision_reason = p_reason
   where id = r.id;
  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles set account_status = 'rejected' where id = r.user_id;

  insert into public.student_validation_events
    (registration_request_id, event_type, previous_status, new_status, actor_user_id, event_reason)
  values (r.id, 'rejected', r.request_status, 'rejected', auth.uid(), p_reason);
  perform public.log_admin_action('student_rejected', 'student_registration_requests', r.id, null, null, p_reason);
end $$;
