-- ZARASOA v2.1 — RLS sur toutes les tables + droits d'accès API
-- Choix conservateur : le super administrateur ne lit PAS les remises des étudiants ni les fichiers
-- (« droit de contrôle à confirmer » §6). Il lit les métadonnées des cours, ressources et devoirs.

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ───────── profiles / rôles / sécurité ─────────
create policy profiles_select on public.profiles for select to authenticated
  using (public.can_view_profile(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());

create policy user_roles_select on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());
create policy user_roles_admin_write on public.user_roles for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy security_events_select on public.account_security_events for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

-- ───────── catalogue ─────────
create policy filieres_select on public.filieres for select to authenticated using (true);
create policy filieres_admin on public.filieres for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
create policy parcours_select on public.parcours for select to authenticated using (true);
create policy parcours_admin on public.parcours for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
create policy levels_select on public.academic_levels for select to authenticated using (true);
create policy levels_admin on public.academic_levels for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy subjects_select on public.subjects for select to authenticated
  using (
    public.is_super_admin()
    or public.student_in_scope_of_subject(id)
    or (public.is_professor() and exists (
          select 1 from public.professor_subject_assignments a
          where a.subject_id = subjects.id and a.professor_id = public.current_professor_id()))
  );
create policy subjects_admin on public.subjects for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ───────── registre officiel et imports : super administrateur uniquement ─────────
create policy registry_imports_admin on public.registry_imports for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
create policy registry_admin on public.official_student_registry for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
create policy registry_rows_admin on public.registry_import_rows for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ───────── demandes et profils étudiants ─────────
create policy requests_select on public.student_registration_requests for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());
create policy requests_insert on public.student_registration_requests for insert to authenticated
  with check (
    user_id = auth.uid() and request_status = 'pending_email' and email_confirmed_at is null
    and registry_match_status is null and matched_registry_id is null
    and reviewed_by is null and reviewed_at is null and decision_reason is null
  );
create policy requests_admin_update on public.student_registration_requests for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy validation_events_select on public.student_validation_events for select to authenticated
  using (public.is_super_admin() or exists (
    select 1 from public.student_registration_requests r
    where r.id = registration_request_id and r.user_id = auth.uid()));

create policy student_profiles_select on public.student_profiles for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin() or public.professor_can_view_student(id));
create policy student_profiles_admin on public.student_profiles for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ───────── professeurs et affectations ─────────
create policy professor_profiles_select on public.professor_profiles for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());
create policy professor_profiles_admin on public.professor_profiles for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy assignments_select on public.professor_subject_assignments for select to authenticated
  using (public.is_super_admin() or professor_id = public.current_professor_id());
create policy assignments_admin on public.professor_subject_assignments for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ───────── cours ─────────
create policy courses_select on public.courses for select to authenticated
  using (public.is_super_admin() or public.is_course_responsible(id) or public.student_can_see_course(id));
create policy courses_insert on public.courses for insert to authenticated
  with check (
    public.is_professor()
    and responsible_professor_id = public.current_professor_id()
    and created_by = auth.uid()
    and course_status in ('draft','published')
  );
create policy courses_update on public.courses for update to authenticated
  using (public.professor_can_manage_course(id))
  with check (responsible_professor_id = public.current_professor_id());

create policy course_events_select on public.course_status_events for select to authenticated
  using (public.is_super_admin() or public.is_course_responsible(course_id));

create policy resources_select on public.course_resources for select to authenticated
  using (
    public.is_super_admin() or public.is_course_responsible(course_id)
    or (resource_status = 'active' and public.student_can_see_course(course_id))
  );
create policy resources_insert on public.course_resources for insert to authenticated
  with check (public.professor_can_manage_course(course_id) and uploaded_by = auth.uid());
create policy resources_update on public.course_resources for update to authenticated
  using (public.professor_can_manage_course(course_id))
  with check (public.professor_can_manage_course(course_id));

-- ───────── devoirs ─────────
-- Les étudiants NE lisent PAS la table homeworks (correction_text y est stocké) :
-- ils passent par la vue student_homeworks, qui masque la correction tant qu'elle n'est pas diffusée.
create policy homeworks_select on public.homeworks for select to authenticated
  using (public.is_super_admin() or public.is_homework_responsible(id));
create policy homeworks_insert on public.homeworks for insert to authenticated
  with check (
    public.professor_can_manage_course(course_id)
    and created_by = auth.uid()
    and homework_status in ('draft','published')
  );
create policy homeworks_update on public.homeworks for update to authenticated
  using (public.professor_can_manage_homework(id))
  with check (public.is_homework_responsible(id));

create view public.student_homeworks with (security_invoker = false) as
  select h.id, h.course_id, h.title, h.instructions, h.homework_status, h.due_at,
         h.allow_late_submission, h.max_submission_files, h.published_at,
         h.correction_released_at,
         case when h.correction_released_at is not null then h.correction_text end as correction_text,
         h.created_at, h.updated_at
  from public.homeworks h
  where public.student_can_see_homework(h.id);

create policy homework_files_select on public.homework_files for select to authenticated
  using (
    public.is_super_admin() or public.is_homework_responsible(homework_id)
    or (file_status = 'active' and public.student_can_see_homework(homework_id)
        and (file_role = 'statement' or public.homework_correction_released(homework_id)))
  );
create policy homework_files_insert on public.homework_files for insert to authenticated
  with check (public.professor_can_manage_homework(homework_id) and uploaded_by = auth.uid());
create policy homework_files_update on public.homework_files for update to authenticated
  using (public.professor_can_manage_homework(homework_id))
  with check (public.professor_can_manage_homework(homework_id));

create policy submissions_select on public.homework_submissions for select to authenticated
  using (student_id = public.current_student_id() or public.is_homework_responsible(homework_id));
create policy submissions_insert on public.homework_submissions for insert to authenticated
  with check (student_id = public.current_student_id() and public.student_can_see_homework(homework_id));
create policy submissions_update on public.homework_submissions for update to authenticated
  using (student_id = public.current_student_id())
  with check (student_id = public.current_student_id());

create policy submission_files_select on public.homework_submission_files for select to authenticated
  using (exists (
    select 1 from public.homework_submissions s
    where s.id = submission_id
      and (s.student_id = public.current_student_id() or public.is_homework_responsible(s.homework_id))));
create policy submission_files_insert on public.homework_submission_files for insert to authenticated
  with check (uploaded_by = auth.uid() and exists (
    select 1 from public.homework_submissions s
    where s.id = submission_id and s.student_id = public.current_student_id()));
create policy submission_files_update on public.homework_submission_files for update to authenticated
  using (exists (
    select 1 from public.homework_submissions s
    where s.id = submission_id and s.student_id = public.current_student_id()))
  with check (exists (
    select 1 from public.homework_submissions s
    where s.id = submission_id and s.student_id = public.current_student_id()));

-- ───────── audit ─────────
create policy audit_select on public.administrative_audit_logs for select to authenticated
  using (public.is_super_admin());

-- ───────── droits d'accès API (RLS reste la barrière réelle) ─────────
grant usage on schema public to anon, authenticated, service_role;
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated, service_role;

revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
alter default privileges in schema public revoke execute on functions from public, anon;
alter default privileges in schema public grant execute on functions to authenticated, service_role;

-- Fonctions internes : jamais appelables depuis le navigateur.
revoke execute on function public.log_admin_action(text, text, uuid, jsonb, jsonb, text) from authenticated;
revoke execute on function public.register_login_failure(text, inet, text) from authenticated;
revoke execute on function public.register_login_success(uuid) from authenticated;
