-- ZARASOA v2.1 — Module 13 : fonctions d'autorisation utilisées par RLS et Storage
-- SECURITY DEFINER + search_path vide : elles lisent les tables sans déclencher de récursion RLS.

create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.account_status = 'approved' and p.deleted_at is null
  );
$$;

create or replace function public.has_role(_role text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_active_member() and exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role_code = _role and ur.revoked_at is null
  );
$$;

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = '' as $$ select public.has_role('super_admin'); $$;

create or replace function public.is_professor() returns boolean
language sql stable security definer set search_path = '' as $$ select public.has_role('professor'); $$;

create or replace function public.current_student_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select sp.id from public.student_profiles sp
  where sp.user_id = auth.uid() and sp.enrollment_status = 'active' and public.has_role('student');
$$;

create or replace function public.current_professor_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select pp.id from public.professor_profiles pp
  where pp.user_id = auth.uid() and pp.is_active and public.is_professor();
$$;

create or replace function public.professor_has_active_assignment(_professor uuid, _subject uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.professor_subject_assignments a
    where a.professor_id = _professor and a.subject_id = _subject and a.assignment_status = 'active'
  );
$$;

-- Périmètre étudiant : filière + niveau, et parcours si la matière est propre à un parcours.
create or replace function public.student_in_scope_of_subject(_subject uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.student_profiles sp
    join public.subjects s on s.id = _subject
    where sp.id = public.current_student_id()
      and s.is_active
      and s.filiere_id = sp.current_filiere_id
      and s.level_id = sp.current_level_id
      and (s.parcours_id is null or s.parcours_id = sp.current_parcours_id)
  );
$$;

create or replace function public.student_can_see_course(_course uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.courses c
    where c.id = _course and c.course_status = 'published'
      and public.student_in_scope_of_subject(c.subject_id)
  );
$$;

create or replace function public.student_can_see_homework(_hw uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.homeworks h
    join public.courses c on c.id = h.course_id
    where h.id = _hw and h.homework_status = 'published' and c.course_status = 'published'
      and public.student_in_scope_of_subject(c.subject_id)
  );
$$;

create or replace function public.homework_correction_released(_hw uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.homeworks h where h.id = _hw and h.correction_released_at is not null);
$$;

create or replace function public.homework_accepts_submission(_hw uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.homeworks h
    where h.id = _hw and h.homework_status = 'published'
      and (now() <= h.due_at or h.allow_late_submission)
  );
$$;

create or replace function public.is_course_responsible(_course uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_professor() and exists (
    select 1 from public.courses c
    join public.professor_profiles pp on pp.id = c.responsible_professor_id
    where c.id = _course and pp.user_id = auth.uid()
  );
$$;

create or replace function public.is_homework_responsible(_hw uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_professor() and exists (
    select 1 from public.homeworks h
    join public.courses c on c.id = h.course_id
    join public.professor_profiles pp on pp.id = c.responsible_professor_id
    where h.id = _hw and pp.user_id = auth.uid()
  );
$$;

-- Responsable + affectation active + cours non archivé : droit de modifier le cours et ses ressources.
create or replace function public.professor_can_manage_course(_course uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_professor() and exists (
    select 1 from public.courses c
    join public.professor_profiles pp on pp.id = c.responsible_professor_id
    join public.professor_subject_assignments a
      on a.professor_id = pp.id and a.subject_id = c.subject_id and a.assignment_status = 'active'
    where c.id = _course and pp.user_id = auth.uid() and c.course_status <> 'archived'
  );
$$;

create or replace function public.professor_can_manage_homework(_hw uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.homeworks h
    where h.id = _hw and h.homework_status <> 'archived' and public.professor_can_manage_course(h.course_id)
  );
$$;

-- Un professeur voit les étudiants du périmètre de ses cours.
create or replace function public.professor_can_view_student(_student uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_professor() and exists (
    select 1
    from public.student_profiles sp
    join public.courses c on true
    join public.professor_profiles pp on pp.id = c.responsible_professor_id and pp.user_id = auth.uid()
    join public.subjects s on s.id = c.subject_id
    where sp.id = _student
      and s.filiere_id = sp.current_filiere_id
      and s.level_id = sp.current_level_id
      and (s.parcours_id is null or s.parcours_id = sp.current_parcours_id)
  );
$$;

create or replace function public.can_view_profile(_uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select _uid = auth.uid()
    or public.is_super_admin()
    or exists (select 1 from public.student_profiles sp
               where sp.user_id = _uid and public.professor_can_view_student(sp.id))
    or exists (select 1 from public.professor_profiles pp
               join public.courses c on c.responsible_professor_id = pp.id
               where pp.user_id = _uid and public.student_can_see_course(c.id));
$$;
