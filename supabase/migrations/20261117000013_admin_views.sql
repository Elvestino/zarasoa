-- ZARASOA v2.1 — 0013 : vues d'administration + vérification des demandes d'inscription dans le registre officiel
-- Les vues sont en security_invoker : la RLS des tables d'origine s'applique à l'appelant
-- (un étudiant ne voit que sa propre ligne, le super administrateur voit tout).

-- ───────── Étudiants approuvés (liste admin + espace étudiant) ─────────
create or replace view public.v_students with (security_invoker = true) as
select sp.id, sp.user_id, sp.registration_number, sp.enrollment_status, sp.approved_at,
       p.first_name, p.last_name, p.email, p.phone_number, p.account_status,
       f.id as filiere_id, f.code as filiere_code, f.name as filiere_name,
       pa.id as parcours_id, pa.code as parcours_code, pa.name as parcours_name,
       l.id as level_id, l.code as level_code, l.label as level_label, l.sort_order as level_order
from public.student_profiles sp
join public.profiles p on p.id = sp.user_id
join public.filieres f on f.id = sp.current_filiere_id
left join public.parcours pa on pa.id = sp.current_parcours_id
join public.academic_levels l on l.id = sp.current_level_id;

-- ───────── Demandes d'inscription + fiche officielle correspondante (comparaison déclaré / officiel) ─────────
create or replace view public.v_registration_requests with (security_invoker = true) as
select r.id, r.user_id, r.registration_number, r.email, r.first_name, r.last_name, r.phone_number,
       r.declared_date_of_birth, r.email_confirmed_at, r.request_status, r.registry_match_status,
       r.matched_registry_id, r.reviewed_at, r.decision_reason, r.submitted_at,
       reg.last_name as official_last_name, reg.first_name as official_first_name,
       reg.date_of_birth as official_date_of_birth, reg.academic_status as official_academic_status,
       reg.filiere_id as official_filiere_id, reg.parcours_id as official_parcours_id, reg.level_id as official_level_id,
       f.name as official_filiere_name, pa.name as official_parcours_name, l.label as official_level_label
from public.student_registration_requests r
left join public.official_student_registry reg on reg.id = r.matched_registry_id
left join public.filieres f on f.id = reg.filiere_id
left join public.parcours pa on pa.id = reg.parcours_id
left join public.academic_levels l on l.id = reg.level_id;

-- ───────── Comptes (liste admin) ─────────
create or replace view public.v_accounts with (security_invoker = true) as
select p.id, p.email, p.first_name, p.last_name, p.pseudo, p.account_status, p.failed_login_count,
       p.locked_at, p.deactivated_at, p.deleted_at, p.last_seen_at, p.created_at,
       coalesce(array_agg(ur.role_code order by ur.role_code) filter (where ur.revoked_at is null), '{}') as roles
from public.profiles p
left join public.user_roles ur on ur.user_id = p.id
group by p.id;

revoke all on public.v_students, public.v_registration_requests, public.v_accounts from anon;

-- ───────── Comparaison de noms (sans accents ni majuscules) ─────────
create or replace function public.normalize_person_name(p text)
returns text language sql immutable set search_path = '' as $$
  select regexp_replace(
    translate(lower(btrim(coalesce(p, ''))), 'àâäãåáéèêëíìîïóòôöõúùûüçñýÿœ', 'aaaaaaeeeeiiiiooooouuuucnyyo'),
    '\s+', ' ', 'g');
$$;

-- ───────── Vérification d'UNE demande dans le registre officiel importé ─────────
-- Résultat : found (matricule + identité concordent), mismatch (matricule trouvé mais identité différente),
-- not_found (matricule absent du registre). La décision finale reste celle du super administrateur.
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
    return jsonb_build_object('status', coalesce(r.registry_match_status, 'unchecked'), 'differences', '[]'::jsonb);
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

  update public.student_registration_requests
     set registry_match_status = v_status,
         matched_registry_id = case when v_status = 'not_found' then null else reg.id end
   where id = r.id;
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
    select id from public.student_registration_requests
     where request_status in ('pending_email', 'pending_admin')
       and registry_match_status is distinct from 'found'
  loop
    perform public.check_registration_request(v_id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;
