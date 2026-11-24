-- ZARASOA v2.1 — 0014 : réactivation, suspension et gestion des rôles par le super administrateur
-- Chaque action : contrôle du rôle, motif tracé, événement de sécurité (ou audit) avec l'acteur et la date.
-- Les erreurs métier portent un `hint` (code applicatif) que la couche serveur traduit en message.

-- ───────── Nouveaux types d'événements de sécurité ─────────
alter table public.account_security_events drop constraint account_security_events_event_type_check;
alter table public.account_security_events add constraint account_security_events_event_type_check
  check (event_type in (
    'login_failed','account_locked','account_unlocked','account_deactivated','account_reactivated','account_deleted',
    'account_suspended','account_suspension_lifted'));

-- ───────── Outils internes ─────────
-- Statut retrouvé après réactivation / levée de suspension : approuvé si le compte a au moins un rôle actif.
create or replace function public.restored_account_status(p_user_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select case when exists (select 1 from public.user_roles where user_id = p_user_id and revoked_at is null)
              then 'approved' else 'pending_admin' end;
$$;

-- Motif obligatoire (3 à 500 caractères), nettoyé.
create or replace function public.require_reason(p_reason text)
returns text language plpgsql immutable set search_path = '' as $$
declare v text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if v is null or char_length(v) < 3 or char_length(v) > 500 then
    raise exception 'Motif obligatoire (3 à 500 caractères)' using errcode = 'P0001', hint = 'REASON_REQUIRED';
  end if;
  return v;
end $$;

-- ───────── Réactivation d'un compte désactivé ─────────
create or replace function public.reactivate_account(p_user_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare p public.profiles%rowtype; v_reason text; v_new text;
begin
  if not public.is_super_admin() then
    raise exception 'Réservé au super administrateur' using errcode = '42501';
  end if;
  v_reason := public.require_reason(p_reason);
  select * into p from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'Compte introuvable' using errcode = 'P0001', hint = 'ACCOUNT_NOT_FOUND';
  end if;
  if p.deleted_at is not null then
    raise exception 'Un compte supprimé ne peut pas être réactivé' using errcode = 'P0001', hint = 'ACCOUNT_DELETED';
  end if;
  if p.account_status <> 'deactivated' then
    raise exception 'Ce compte n''est pas désactivé' using errcode = 'P0001', hint = 'ACCOUNT_NOT_DEACTIVATED';
  end if;

  v_new := public.restored_account_status(p_user_id);
  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles
     set account_status = v_new, deactivated_at = null, failed_login_count = 0, locked_at = null
   where id = p_user_id;

  insert into public.account_security_events (user_id, event_type, actor_user_id, event_reason)
  values (p_user_id, 'account_reactivated', auth.uid(), v_reason);
  perform public.log_admin_action('account_reactivated', 'profiles', p_user_id,
    jsonb_build_object('account_status', p.account_status), jsonb_build_object('account_status', v_new), v_reason);
end $$;

-- ───────── Suspension / levée de suspension ─────────
-- Effet immédiat : un compte non « approved » perd l'accès aux données (RLS) et à tous les espaces (gardes serveur).
create or replace function public.suspend_account(p_user_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare p public.profiles%rowtype; v_reason text;
begin
  if not public.is_super_admin() then
    raise exception 'Réservé au super administrateur' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Action interdite sur son propre compte' using errcode = 'P0001', hint = 'SELF_ACTION_FORBIDDEN';
  end if;
  v_reason := public.require_reason(p_reason);
  select * into p from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'Compte introuvable' using errcode = 'P0001', hint = 'ACCOUNT_NOT_FOUND';
  end if;
  if p.deleted_at is not null or p.account_status <> 'approved' then
    raise exception 'Seul un compte actif peut être suspendu' using errcode = 'P0001', hint = 'ACCOUNT_NOT_APPROVED';
  end if;

  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles set account_status = 'suspended' where id = p_user_id;

  insert into public.account_security_events (user_id, event_type, actor_user_id, event_reason)
  values (p_user_id, 'account_suspended', auth.uid(), v_reason);
  perform public.log_admin_action('account_suspended', 'profiles', p_user_id,
    jsonb_build_object('account_status', 'approved'), jsonb_build_object('account_status', 'suspended'), v_reason);
end $$;

create or replace function public.lift_account_suspension(p_user_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare p public.profiles%rowtype; v_reason text; v_new text;
begin
  if not public.is_super_admin() then
    raise exception 'Réservé au super administrateur' using errcode = '42501';
  end if;
  v_reason := public.require_reason(p_reason);
  select * into p from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'Compte introuvable' using errcode = 'P0001', hint = 'ACCOUNT_NOT_FOUND';
  end if;
  if p.deleted_at is not null or p.account_status <> 'suspended' then
    raise exception 'Ce compte n''est pas suspendu' using errcode = 'P0001', hint = 'ACCOUNT_NOT_SUSPENDED';
  end if;

  v_new := public.restored_account_status(p_user_id);
  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles set account_status = v_new where id = p_user_id;

  insert into public.account_security_events (user_id, event_type, actor_user_id, event_reason)
  values (p_user_id, 'account_suspension_lifted', auth.uid(), v_reason);
  perform public.log_admin_action('account_suspension_lifted', 'profiles', p_user_id,
    jsonb_build_object('account_status', 'suspended'), jsonb_build_object('account_status', v_new), v_reason);
end $$;

-- ───────── Gestion des rôles ─────────
-- Seuls « professor » et « super_admin » se gèrent ici. Le rôle « student » ne s'obtient que par la
-- validation d'une demande d'inscription (il suppose une fiche étudiant + matricule du registre officiel).
create or replace function public.assert_manageable_role(p_role text)
returns void language plpgsql immutable set search_path = '' as $$
begin
  if p_role is null or p_role not in ('professor', 'super_admin') then
    raise exception 'Rôle non gérable ici' using errcode = 'P0001', hint = 'ROLE_NOT_MANAGEABLE';
  end if;
end $$;

create or replace function public.assign_role(p_user_id uuid, p_role text, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare p public.profiles%rowtype; v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if not public.is_super_admin() then
    raise exception 'Réservé au super administrateur' using errcode = '42501';
  end if;
  perform public.assert_manageable_role(p_role);
  if p_user_id = auth.uid() then
    raise exception 'Action interdite sur son propre compte' using errcode = 'P0001', hint = 'SELF_ACTION_FORBIDDEN';
  end if;
  if v_reason is not null and char_length(v_reason) > 500 then
    raise exception 'Motif trop long' using errcode = 'P0001', hint = 'REASON_REQUIRED';
  end if;
  select * into p from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'Compte introuvable' using errcode = 'P0001', hint = 'ACCOUNT_NOT_FOUND';
  end if;
  if p.deleted_at is not null or p.account_status <> 'approved' then
    raise exception 'Seul un compte actif peut recevoir un rôle' using errcode = 'P0001', hint = 'ACCOUNT_NOT_APPROVED';
  end if;
  if exists (select 1 from public.user_roles where user_id = p_user_id and role_code = p_role and revoked_at is null) then
    raise exception 'Rôle déjà attribué' using errcode = 'P0001', hint = 'ROLE_ALREADY_ASSIGNED';
  end if;

  insert into public.user_roles (user_id, role_code, assigned_by) values (p_user_id, p_role, auth.uid());
  -- Un professeur a besoin de sa fiche (current_professor_id) ; on ne touche pas à une fiche existante.
  if p_role = 'professor' then
    insert into public.professor_profiles (user_id) values (p_user_id) on conflict (user_id) do nothing;
  end if;

  perform public.log_admin_action('role_assigned', 'user_roles', p_user_id, null,
    jsonb_build_object('role_code', p_role), v_reason);
end $$;

create or replace function public.revoke_role(p_user_id uuid, p_role text, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_reason text; v_updated integer;
begin
  if not public.is_super_admin() then
    raise exception 'Réservé au super administrateur' using errcode = '42501';
  end if;
  perform public.assert_manageable_role(p_role);
  if p_user_id = auth.uid() then
    raise exception 'Action interdite sur son propre compte' using errcode = 'P0001', hint = 'SELF_ACTION_FORBIDDEN';
  end if;
  v_reason := public.require_reason(p_reason);
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Compte introuvable' using errcode = 'P0001', hint = 'ACCOUNT_NOT_FOUND';
  end if;

  update public.user_roles
     set revoked_at = now(), revoked_by = auth.uid(), revocation_reason = v_reason
   where user_id = p_user_id and role_code = p_role and revoked_at is null;
  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Rôle non attribué' using errcode = 'P0001', hint = 'ROLE_NOT_ASSIGNED';
  end if;

  perform public.log_admin_action('role_revoked', 'user_roles', p_user_id,
    jsonb_build_object('role_code', p_role), null, v_reason);
end $$;

-- Droits : réservé aux utilisateurs connectés (le contrôle du rôle est fait dans chaque fonction).
revoke execute on function public.restored_account_status(uuid) from public, anon, authenticated;
revoke execute on function public.require_reason(text) from public, anon, authenticated;
revoke execute on function public.assert_manageable_role(text) from public, anon, authenticated;
revoke execute on function public.reactivate_account(uuid, text) from public, anon;
revoke execute on function public.suspend_account(uuid, text) from public, anon;
revoke execute on function public.lift_account_suspension(uuid, text) from public, anon;
revoke execute on function public.assign_role(uuid, text, text) from public, anon;
revoke execute on function public.revoke_role(uuid, text, text) from public, anon;
