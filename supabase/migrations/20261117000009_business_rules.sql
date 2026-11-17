-- ZARASOA v2.1 — Règles métier appliquées en base (appels directs à l'API compris)
-- auth.uid() IS NULL = service_role / SQL Editor / migrations : les gardes utilisateur ne s'appliquent pas.

-- updated_at automatique sur toutes les tables concernées
do $$
declare t text;
begin
  for t in
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'updated_at'
  loop
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ───────── profiles : colonnes de sécurité non modifiables par l'utilisateur ─────────
create or replace function public.profiles_guard_security_columns()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null
     or coalesce(current_setting('app.bypass_profile_guard', true), '') = 'on'
     or public.is_super_admin() then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.email is distinct from old.email
     or new.account_status is distinct from old.account_status
     or new.failed_login_count is distinct from old.failed_login_count
     or new.locked_at is distinct from old.locked_at
     or new.deactivated_at is distinct from old.deactivated_at
     or new.deleted_at is distinct from old.deleted_at then
    raise exception 'Colonnes de sécurité du profil non modifiables' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger trg_profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard_security_columns();

-- ───────── courses ─────────
create or replace function public.courses_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null then
    if tg_op = 'UPDATE' then
      if new.responsible_professor_id <> old.responsible_professor_id or new.subject_id <> old.subject_id then
        raise exception 'Le responsable et la matière d''un cours ne sont pas modifiables' using errcode = '42501';
      end if;
      if old.course_status = 'archived' and new.course_status <> 'archived' then
        raise exception 'Réactivation d''un cours archivé : décision administrative requise' using errcode = '42501';
      end if;
    end if;
    if tg_op = 'INSERT' or (new.course_status = 'published' and old.course_status <> 'published') then
      if not public.professor_has_active_assignment(new.responsible_professor_id, new.subject_id) then
        raise exception 'Aucune affectation active pour cette matière' using errcode = '42501';
      end if;
    end if;
  end if;
  if new.course_status = 'published' and new.published_at is null then new.published_at := now(); end if;
  if new.course_status = 'archived' and new.archived_at is null then
    new.archived_at := now();
    new.archived_by := coalesce(new.archived_by, auth.uid());
  end if;
  return new;
end $$;
create trigger trg_courses_guard before insert or update on public.courses
  for each row execute function public.courses_guard();

-- Historique des transitions + archivage en cascade des devoirs
create or replace function public.courses_after_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.course_status is distinct from old.course_status then
    insert into public.course_status_events (course_id, previous_status, new_status, changed_by, change_reason, related_assignment_id)
    values (
      new.id,
      case when tg_op = 'UPDATE' then old.course_status end,
      new.course_status,
      auth.uid(),
      case when new.course_status = 'archived' then new.archive_reason end,
      public.safe_uuid(nullif(current_setting('app.related_assignment_id', true), ''))
    );
  end if;
  if tg_op = 'UPDATE' and new.course_status = 'archived' and old.course_status <> 'archived' then
    update public.homeworks
       set homework_status = 'archived', archived_at = now(), archived_by = auth.uid(),
           archive_reason = coalesce(new.archive_reason, 'Cours archivé')
     where course_id = new.id and homework_status <> 'archived';
  end if;
  return null;
end $$;
create trigger trg_courses_after after insert or update on public.courses
  for each row execute function public.courses_after_change();

-- ───────── affectations : archivage des cours à la désactivation ─────────
create or replace function public.assignments_before_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.assignment_status = 'active' and new.assignment_status = 'inactive' then
    new.deactivated_at := coalesce(new.deactivated_at, now());
    new.deactivated_by := coalesce(new.deactivated_by, auth.uid());
  elsif old.assignment_status = 'inactive' and new.assignment_status = 'active' then
    new.deactivated_at := null; new.deactivated_by := null; new.deactivation_reason := null;
  end if;
  return new;
end $$;
create trigger trg_assignments_before_update before update on public.professor_subject_assignments
  for each row execute function public.assignments_before_update();

create or replace function public.assignments_after_deactivation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.assignment_status = 'active' and new.assignment_status = 'inactive' then
    perform set_config('app.related_assignment_id', new.id::text, true);
    update public.courses
       set course_status = 'archived', archived_at = now(), archived_by = auth.uid(),
           archive_reason = coalesce(new.deactivation_reason, 'Affectation désactivée')
     where subject_id = new.subject_id
       and responsible_professor_id = new.professor_id
       and course_status <> 'archived';        -- les devoirs suivent via courses_after_change
    perform set_config('app.related_assignment_id', '', true);
    perform public.log_admin_action('assignment_disabled', 'professor_subject_assignments', new.id,
      jsonb_build_object('assignment_status', old.assignment_status),
      jsonb_build_object('assignment_status', new.assignment_status), new.deactivation_reason);
  end if;
  return null;
end $$;
create trigger trg_assignments_after_update after update on public.professor_subject_assignments
  for each row execute function public.assignments_after_deactivation();

-- ───────── homeworks ─────────
create or replace function public.homeworks_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_prof uuid; v_subject uuid;
begin
  if auth.uid() is not null then
    select c.responsible_professor_id, c.subject_id into v_prof, v_subject
      from public.courses c where c.id = new.course_id;
    if tg_op = 'UPDATE' then
      if new.course_id <> old.course_id then
        raise exception 'Le cours d''un devoir n''est pas modifiable' using errcode = '42501';
      end if;
      if old.homework_status = 'archived' and new.homework_status <> 'archived' then
        raise exception 'Réactivation d''un devoir archivé : décision administrative requise' using errcode = '42501';
      end if;
    end if;
    if tg_op = 'INSERT'
       or (new.homework_status = 'published' and old.homework_status <> 'published')
       or (tg_op = 'UPDATE' and new.correction_released_at is not null and old.correction_released_at is null) then
      if not public.professor_has_active_assignment(v_prof, v_subject) then
        raise exception 'Aucune affectation active pour cette matière' using errcode = '42501';
      end if;
    end if;
    if new.homework_status = 'published' and (tg_op = 'INSERT' or old.homework_status <> 'published') then
      if new.due_at is null or new.due_at <= now() then
        raise exception 'Une date limite postérieure à l''heure du serveur est obligatoire pour publier' using errcode = '23514';
      end if;
    end if;
  end if;
  if new.homework_status = 'published' and new.published_at is null then new.published_at := now(); end if;
  if new.homework_status = 'archived' and new.archived_at is null then
    new.archived_at := now(); new.archived_by := coalesce(new.archived_by, auth.uid());
  end if;
  if new.correction_released_at is not null and new.correction_released_by is null then
    new.correction_released_by := auth.uid();
  end if;
  return new;
end $$;
create trigger trg_homeworks_guard before insert or update on public.homeworks
  for each row execute function public.homeworks_guard();

-- ───────── remises : date limite contrôlée avec now() du serveur ─────────
create or replace function public.submissions_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare hw record;
begin
  select h.homework_status, h.due_at, h.allow_late_submission into hw
    from public.homeworks h where h.id = new.homework_id;
  if auth.uid() is not null then
    if tg_op = 'UPDATE' and (new.homework_id <> old.homework_id or new.student_id <> old.student_id) then
      raise exception 'Remise non transférable' using errcode = '42501';
    end if;
    if new.student_id is distinct from public.current_student_id() then
      raise exception 'Remise réservée à l''étudiant concerné' using errcode = '42501';
    end if;
    if hw.homework_status <> 'published' or not public.student_can_see_homework(new.homework_id) then
      raise exception 'Devoir inaccessible' using errcode = '42501';
    end if;
    if now() > hw.due_at and not hw.allow_late_submission then
      raise exception 'Date limite dépassée' using errcode = '42501';
    end if;
  end if;
  new.is_late := (hw.due_at is not null and now() > hw.due_at);
  if new.submission_status = 'submitted' then new.submitted_at := now(); end if;
  return new;
end $$;
create trigger trg_submissions_guard before insert or update on public.homework_submissions
  for each row execute function public.submissions_guard();

create or replace function public.submission_files_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare s record; v_count integer;
begin
  select hs.homework_id, hs.student_id, h.max_submission_files into s
    from public.homework_submissions hs
    join public.homeworks h on h.id = hs.homework_id
   where hs.id = new.submission_id;
  if auth.uid() is not null then
    if s.student_id is distinct from public.current_student_id() then
      raise exception 'Fichier réservé à l''étudiant concerné' using errcode = '42501';
    end if;
    if not public.homework_accepts_submission(s.homework_id) or not public.student_can_see_homework(s.homework_id) then
      raise exception 'Dépôt refusé : date limite dépassée ou devoir inaccessible' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and (new.storage_path <> old.storage_path or new.submission_id <> old.submission_id) then
      raise exception 'Seul le statut is_current est modifiable' using errcode = '42501';
    end if;
    if new.is_current and (tg_op = 'INSERT' or not old.is_current) then
      select count(*) into v_count from public.homework_submission_files f
       where f.submission_id = new.submission_id and f.is_current;
      if v_count >= s.max_submission_files then
        raise exception 'Nombre maximal de fichiers atteint (%)', s.max_submission_files using errcode = '23514';
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger trg_submission_files_guard before insert or update on public.homework_submission_files
  for each row execute function public.submission_files_guard();
