-- ZARASOA v2.1 — Supabase Storage : buckets privés et policies
-- Taille maximale et types MIME par bucket : À VALIDER (§11), donc non fixés ici.
-- Convention des chemins :
--   course-resources     {course_id}/{fichier}
--   homework-files       {homework_id}/{statement|correction}/{fichier}
--   homework-submissions {homework_id}/{student_id}/{fichier}
--   registry-imports     {import_id}/{fichier}

insert into storage.buckets (id, name, public) values
  ('course-resources',     'course-resources',     false),
  ('homework-files',       'homework-files',       false),
  ('homework-submissions', 'homework-submissions', false),
  ('registry-imports',     'registry-imports',     false)
on conflict (id) do nothing;

-- ───────── course-resources ─────────
create policy "course_resources_read" on storage.objects for select to authenticated
  using (bucket_id = 'course-resources' and (
    public.is_course_responsible(public.safe_uuid((storage.foldername(name))[1]))
    or exists (
      select 1 from public.course_resources r
      where r.storage_bucket = bucket_id and r.storage_path = name
        and r.resource_status = 'active' and public.student_can_see_course(r.course_id))
  ));
create policy "course_resources_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'course-resources'
    and public.professor_can_manage_course(public.safe_uuid((storage.foldername(name))[1])));
create policy "course_resources_update" on storage.objects for update to authenticated
  using (bucket_id = 'course-resources'
    and public.professor_can_manage_course(public.safe_uuid((storage.foldername(name))[1])));

-- ───────── homework-files (énoncés et corrections) ─────────
create policy "homework_files_read" on storage.objects for select to authenticated
  using (bucket_id = 'homework-files' and (
    public.is_homework_responsible(public.safe_uuid((storage.foldername(name))[1]))
    or exists (
      select 1 from public.homework_files f
      where f.storage_bucket = bucket_id and f.storage_path = name and f.file_status = 'active'
        and public.student_can_see_homework(f.homework_id)
        and (f.file_role = 'statement' or public.homework_correction_released(f.homework_id)))
  ));
create policy "homework_files_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'homework-files'
    and public.professor_can_manage_homework(public.safe_uuid((storage.foldername(name))[1])));
create policy "homework_files_update" on storage.objects for update to authenticated
  using (bucket_id = 'homework-files'
    and public.professor_can_manage_homework(public.safe_uuid((storage.foldername(name))[1])));

-- ───────── homework-submissions (remises) ─────────
create policy "submissions_read" on storage.objects for select to authenticated
  using (bucket_id = 'homework-submissions' and (
    public.safe_uuid((storage.foldername(name))[2]) = public.current_student_id()
    or public.is_homework_responsible(public.safe_uuid((storage.foldername(name))[1]))
  ));
create policy "submissions_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'homework-submissions'
    and public.safe_uuid((storage.foldername(name))[2]) = public.current_student_id()
    and public.student_can_see_homework(public.safe_uuid((storage.foldername(name))[1]))
    and public.homework_accepts_submission(public.safe_uuid((storage.foldername(name))[1])));

-- ───────── registry-imports ─────────
create policy "registry_imports_admin" on storage.objects for all to authenticated
  using (bucket_id = 'registry-imports' and public.is_super_admin())
  with check (bucket_id = 'registry-imports' and public.is_super_admin());
