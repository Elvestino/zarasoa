-- ZARASOA v2.1 — Modules 06, 07, 08 : professeurs, affectations, cours, ressources

create table public.professor_profiles (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references public.profiles (id),
  employee_number    varchar(50) unique,
  professional_title varchar(100),
  department_name    varchar(150),
  bio                text,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.professor_subject_assignments (
  id                  uuid primary key default gen_random_uuid(),
  professor_id        uuid not null references public.professor_profiles (id),
  subject_id          uuid not null references public.subjects (id),
  assignment_status   varchar(20) not null default 'active' check (assignment_status in ('active','inactive')),
  assigned_by         uuid not null references public.profiles (id),
  assigned_at         timestamptz not null default now(),
  deactivated_by      uuid references public.profiles (id),
  deactivated_at      timestamptz,
  deactivation_reason text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create unique index assignments_active_key
  on public.professor_subject_assignments (professor_id, subject_id) where assignment_status = 'active';

create table public.courses (
  id                       uuid primary key default gen_random_uuid(),
  subject_id               uuid not null references public.subjects (id) on delete restrict,
  responsible_professor_id uuid not null references public.professor_profiles (id),
  title                    varchar(200) not null,
  slug                     varchar(220),
  summary                  varchar(500),
  description              text,
  course_status            varchar(20) not null default 'draft' check (course_status in ('draft','published','archived')),
  published_at             timestamptz,
  archived_at              timestamptz,
  archived_by              uuid references public.profiles (id),
  archive_reason           text,
  created_by               uuid not null references public.profiles (id),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint courses_subject_slug_key unique (subject_id, slug)
);
create index courses_subject_idx on public.courses (subject_id, course_status);
create index courses_professor_idx on public.courses (responsible_professor_id);

create table public.course_status_events (
  id                    uuid primary key default gen_random_uuid(),
  course_id             uuid not null references public.courses (id),
  previous_status       varchar(20),
  new_status            varchar(20) not null,
  changed_by            uuid references public.profiles (id),
  change_reason         text,
  related_assignment_id uuid references public.professor_subject_assignments (id),
  created_at            timestamptz not null default now()
);

create table public.course_resources (
  id                 uuid primary key default gen_random_uuid(),
  course_id          uuid not null references public.courses (id) on delete restrict,
  resource_type      varchar(20) not null check (resource_type in ('pdf','video','document','other')),
  title              varchar(200) not null,
  description        text,
  original_file_name varchar(255) not null,
  storage_bucket     varchar(100) not null,
  storage_path       text not null unique,
  mime_type          varchar(150) not null,
  file_extension     varchar(15),
  file_size_bytes    bigint not null check (file_size_bytes > 0),
  checksum_sha256    char(64),
  duration_seconds   integer check (duration_seconds >= 0),
  display_order      integer not null default 0,
  resource_status    varchar(20) not null default 'active' check (resource_status in ('active','disabled')),
  uploaded_by        uuid not null references public.profiles (id),
  uploaded_at        timestamptz not null default now(),
  disabled_by        uuid references public.profiles (id),
  disabled_at        timestamptz,
  disabled_reason    text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index course_resources_course_idx on public.course_resources (course_id);
