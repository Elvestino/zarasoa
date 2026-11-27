-- ZARASOA v2.1 — Durcissement sécurité (modules 02 à 04)
--
-- 1. Le résultat du rapprochement avec le registre officiel ne doit JAMAIS être lisible par l'étudiant.
--    La RLS filtre des lignes, pas des colonnes : tant que `registry_match_status` et `matched_registry_id`
--    étaient sur `student_registration_requests`, l'étudiant les lisait sur sa propre demande via l'API.
--    Elles passent dans une table réservée au super administrateur.
-- 2. L'historique visible par l'étudiant n'inclut plus les événements internes `registry_checked`.
-- 3. L'approbation exige, côté base, que le matricule soit dans le registre (décision métier) :
--    la règle n'existait que dans le code TypeScript.
-- 4. Suppression de la policy d'insertion directe des demandes : l'inscription passe par le serveur (clé secrète).

-- ───────── 1. Table réservée à l'administration ─────────
create table public.student_request_registry_checks (
  registration_request_id uuid primary key references public.student_registration_requests (id) on delete cascade,
  match_status            varchar(20) not null check (match_status in ('found', 'not_found', 'mismatch')),
  matched_registry_id     uuid references public.official_student_registry (id),
  checked_at              timestamptz not null default now(),
  checked_by              uuid references public.profiles (id)
);

alter table public.student_request_registry_checks enable row level security;
create policy request_checks_admin on public.student_request_registry_checks for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
revoke all on public.student_request_registry_checks from anon;

-- Reprise des résultats existants (l'absence de ligne signifie « non vérifiée »).
insert into public.student_request_registry_checks (registration_request_id, match_status, matched_registry_id)
select id, registry_match_status, matched_registry_id
  from public.student_registration_requests
 where registry_match_status in ('found', 'not_found', 'mismatch');

-- ───────── 4. Plus d'insertion directe par un utilisateur connecté ─────────
-- (elle référençait les colonnes supprimées ci-dessous ; `RegisterService` insère avec la clé secrète, qui ignore la RLS)
drop policy if exists requests_insert on public.student_registration_requests;

-- La vue d'administration dépend des colonnes : on la recrée après leur suppression.
drop view public.v_registration_requests;

alter table public.student_registration_requests
  drop column registry_match_status,
  drop column matched_registry_id;

create view public.v_registration_requests with (security_invoker = true) as
select r.id, r.user_id, r.registration_number, r.email, r.first_name, r.last_name, r.phone_number,
       r.declared_date_of_birth, r.email_confirmed_at, r.request_status,
       c.match_status as registry_match_status,
       c.matched_registry_id,
       r.reviewed_at, r.decision_reason, r.submitted_at,
       reg.last_name as official_last_name, reg.first_name as official_first_name,
       reg.date_of_birth as official_date_of_birth, reg.academic_status as official_academic_status,
       reg.filiere_id as official_filiere_id, reg.parcours_id as official_parcours_id, reg.level_id as official_level_id,
       f.name as official_filiere_name, pa.name as official_parcours_name, l.label as official_level_label
from public.student_registration_requests r
left join public.student_request_registry_checks c on c.registration_request_id = r.id
left join public.official_student_registry reg on reg.id = c.matched_registry_id
left join public.filieres f on f.id = reg.filiere_id
left join public.parcours pa on pa.id = reg.parcours_id
left join public.academic_levels l on l.id = reg.level_id;

revoke all on public.v_registration_requests from anon;

-- ───────── Vérification d'une demande : écrit dans la nouvelle table ─────────
create or replace function public.check_registration_request(p_request_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  r public.student_registration_requests%rowtype;
  reg public.official_student_registry%rowtype;
  v_status text;
  v_diff text[] := '{}';
  v_first_reg text; v_first_req text;
begin
  if not public.is_super_admin() then
    raise exception 'Réservé au super administrateur' using errcode = '42501';
  end if;
  select * into r from public.student_registration_requests where id = p_request_id for update;
  if not found then raise exception 'Demande introuvable'; end if;
  if r.request_status not in ('pending_email', 'pending_admin') then
    return jsonb_build_object(
      'status', coalesce((select c.match_status from public.student_request_registry_checks c
                           where c.registration_request_id = r.id), 'unchecked'),
      'differences', '[]'::jsonb);
  end if;

  select * into reg from public.official_student_registry
   where registration_number = public.normalize_registration_number(r.registration_number) and is_current
   limit 1;

  if not found then
    v_status := 'not_found';
  else
    if reg.last_name is not null
       and public.normalize_person_name(reg.last_name) <> public.normalize_person_name(r.last_name) then
      v_diff := v_diff || 'last_name';
    end if;
    v_first_reg := public.normalize_person_name(reg.first_name);
    v_first_req := public.normalize_person_name(r.first_name);
    if reg.first_name is not null and v_first_req <> '' and not (
         v_first_reg = v_first_req
         or position(v_first_req in v_first_reg) > 0
         or position(v_first_reg in v_first_req) > 0) then
      v_diff := v_diff || 'first_name';
    end if;
    if reg.date_of_birth is not null and r.declared_date_of_birth is not null
       and reg.date_of_birth <> r.declared_date_of_birth then
      v_diff := v_diff || 'date_of_birth';
    end if;
    v_status := case when coalesce(array_length(v_diff, 1), 0) = 0 then 'found' else 'mismatch' end;
  end if;

  insert into public.student_request_registry_checks
    (registration_request_id, match_status, matched_registry_id, checked_at, checked_by)
  values
    (r.id, v_status, case when v_status = 'not_found' then null else reg.id end, now(), auth.uid())
  on conflict (registration_request_id) do update
    set match_status = excluded.match_status,
        matched_registry_id = excluded.matched_registry_id,
        checked_at = excluded.checked_at,
        checked_by = excluded.checked_by;

  if v_status <> 'not_found' then
    update public.official_student_registry set last_verified_at = now() where id = reg.id;
  end if;

  insert into public.student_validation_events
    (registration_request_id, event_type, previous_status, new_status, actor_user_id, event_details)
  values (r.id, 'registry_checked', r.request_status, r.request_status, auth.uid(),
          jsonb_build_object('match', v_status, 'differences', to_jsonb(v_diff)));

  return jsonb_build_object('status', v_status, 'differences', to_jsonb(v_diff));
end $$;

-- Vérifie toutes les demandes en attente pas encore confirmées « found » (appelée après chaque import).
create or replace function public.check_pending_requests()
returns integer language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_count integer := 0;
begin
  if not public.is_super_admin() then
    raise exception 'Réservé au super administrateur' using errcode = '42501';
  end if;
  for v_id in
    select r.id from public.student_registration_requests r
     where r.request_status in ('pending_email', 'pending_admin')
       and not exists (select 1 from public.student_request_registry_checks c
                        where c.registration_request_id = r.id and c.match_status = 'found')
  loop
    perform public.check_registration_request(v_id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

-- ───────── 2. Historique visible par l'étudiant : sans les vérifications internes du registre ─────────
drop policy if exists validation_events_select on public.student_validation_events;
create policy validation_events_select on public.student_validation_events for select to authenticated
  using (
    public.is_super_admin()
    or (event_type <> 'registry_checked' and exists (
          select 1 from public.student_registration_requests r
           where r.id = registration_request_id and r.user_id = auth.uid()))
  );

-- ───────── 3. Approbation : matricule présent dans le registre, vérifié par la base ─────────
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
  -- Concordance totale (found) ou partielle examinée par l'administrateur (mismatch) ; jamais not_found / non vérifiée.
  if not exists (
       select 1 from public.student_request_registry_checks c
        where c.registration_request_id = r.id and c.match_status in ('found', 'mismatch')) then
    raise exception 'Matricule absent du registre officiel : approbation impossible' using errcode = 'P0001';
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
