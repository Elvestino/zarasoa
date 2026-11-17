-- ZARASOA v2.1 — Module 09 : devoirs, corrections et remises

create table public.homeworks (
  id                      uuid primary key default gen_random_uuid(),
  course_id               uuid not null references public.courses (id) on delete restrict,
  title                   varchar(200) not null,
  instructions            text,
  homework_status         varchar(20) not null default 'draft' check (homework_status in ('draft','published','archived')),
  due_at                  timestamptz,
  allow_late_submission   boolean not null default false,
  max_submission_files    smallint not null default 1 check (max_submission_files >= 1),
  correction_text         text,
  correction_released_at  timestamptz,
  correction_released_by  uuid references public.profiles (id),
  published_at            timestamptz,
  archived_at             timestamptz,
  archived_by             uuid references public.profiles (id),
  archive_reason          text,
  created_by              uuid not null references public.profiles (id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  -- Le cahier des charges écrit « draft OR due_at IS NOT NULL » ; cette forme équivalente pour
  -- published évite de bloquer l'archivage d'un brouillon sans date limite.
  constraint homeworks_due_at_when_published check (homework_status <> 'published' or due_at is not null)
);
create index homeworks_course_idx on public.homeworks (course_id, homework_status);

create table public.homework_files (
  id                 uuid primary key default gen_random_uuid(),
  homework_id        uuid not null references public.homeworks (id) on delete restrict,
  file_role          varchar(20) not null check (file_role in ('statement','correction')),
  title              varchar(200),
  original_file_name varchar(255) not null,
  storage_bucket     varchar(100) not null,
  storage_path       text not null unique,
  mime_type          varchar(150) not null,
  file_size_bytes    bigint not null check (file_size_bytes > 0),
  checksum_sha256    char(64),
  display_order      integer not null default 0,
  file_status        varchar(20) not null default 'active' check (file_status in ('active','disabled')),
  uploaded_by        uuid not null references public.profiles (id),
  uploaded_at        timestamptz not null default now(),
  disabled_by        uuid references public.profiles (id),
  disabled_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index homework_files_homework_idx on public.homework_files (homework_id, file_role);

create table public.homework_submissions (
  id                uuid primary key default gen_random_uuid(),
  homework_id       uuid not null references public.homeworks (id) on delete restrict,
  student_id        uuid not null references public.student_profiles (id),
  submission_status varchar(20) not null default 'draft' check (submission_status in ('draft','submitted')),
  submitted_at      timestamptz,
  is_late           boolean not null default false,
  student_comment   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint homework_submissions_one_per_student unique (homework_id, student_id)
);
create index homework_submissions_student_idx on public.homework_submissions (student_id);

create table public.homework_submission_files (
  id                 uuid primary key default gen_random_uuid(),
  submission_id      uuid not null references public.homework_submissions (id) on delete restrict,
  original_file_name varchar(255) not null,
  storage_bucket     varchar(100) not null,
  storage_path       text not null unique,
  mime_type          varchar(150) not null,
  file_size_bytes    bigint not null check (file_size_bytes > 0),
  checksum_sha256    char(64),
  is_current         boolean not null default true,
  uploaded_by        uuid not null references public.profiles (id),
  uploaded_at        timestamptz not null default now(),
  created_at         timestamptz not null default now()
);
create index homework_submission_files_submission_idx on public.homework_submission_files (submission_id);
