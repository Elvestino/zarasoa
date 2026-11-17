-- ZARASOA v2.1 — Modules 02, 03, 04 : préinscription, registre officiel, validation

create table public.registry_imports (
  id                uuid primary key default gen_random_uuid(),
  source_file_name  varchar(255) not null,
  storage_path      text not null,
  file_mime_type    varchar(150) not null,
  file_size_bytes   bigint not null check (file_size_bytes > 0),
  file_sha256       char(64) unique,
  import_status     varchar(30) not null check (import_status in
    ('uploaded','validating','ready','processing','completed','completed_with_errors','failed')),
  total_rows        integer not null default 0 check (total_rows >= 0),
  inserted_rows     integer not null default 0 check (inserted_rows >= 0),
  updated_rows      integer not null default 0 check (updated_rows >= 0),
  duplicate_rows    integer not null default 0 check (duplicate_rows >= 0),
  invalid_rows      integer not null default 0 check (invalid_rows >= 0),
  error_summary     jsonb,
  started_at        timestamptz,
  finished_at       timestamptz,
  imported_by       uuid not null references public.profiles (id),
  created_at        timestamptz not null default now()
);

create table public.official_student_registry (
  id                  uuid primary key default gen_random_uuid(),
  registration_number varchar(50) not null unique,
  last_name           varchar(100),
  first_name          varchar(100),
  date_of_birth       date,
  filiere_id          uuid references public.filieres (id),
  parcours_id         uuid,
  level_id            uuid references public.academic_levels (id),
  academic_status     varchar(30),
  source_import_id    uuid not null references public.registry_imports (id),
  is_current          boolean not null default true,
  last_verified_at    timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint registry_parcours_filiere_fk foreign key (parcours_id, filiere_id)
    references public.parcours (id, filiere_id)
);

create table public.registry_import_rows (
  id                             uuid primary key default gen_random_uuid(),
  import_id                      uuid not null references public.registry_imports (id) on delete cascade,
  row_number                     integer not null check (row_number > 0),
  raw_data                       jsonb not null,
  normalized_registration_number varchar(50),
  row_status                     varchar(20) not null check (row_status in
    ('valid','duplicate','invalid','inserted','updated','skipped')),
  error_code                     varchar(50),
  error_message                  text,
  registry_record_id             uuid references public.official_student_registry (id),
  processed_at                   timestamptz,
  created_at                     timestamptz not null default now(),
  constraint registry_import_rows_unique unique (import_id, row_number)
);

create table public.student_registration_requests (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null unique references public.profiles (id),
  registration_number     varchar(50) not null,
  email                   text not null,
  first_name              varchar(100) not null,
  last_name               varchar(100) not null,
  phone_number            varchar(25),
  declared_date_of_birth  date,
  email_confirmed_at      timestamptz,
  request_status          varchar(30) not null default 'pending_email'
    check (request_status in ('pending_email','pending_admin','approved','rejected')),
  registry_match_status   varchar(20)
    check (registry_match_status in ('found','not_found','mismatch','unchecked')),
  matched_registry_id     uuid references public.official_student_registry (id),
  reviewed_by             uuid references public.profiles (id),
  reviewed_at             timestamptz,
  decision_reason         text,
  submitted_at            timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
-- Un même matricule ne peut pas avoir deux demandes actives (les demandes refusées sont exclues).
create unique index student_requests_matricule_active_key
  on public.student_registration_requests (public.normalize_registration_number(registration_number))
  where request_status <> 'rejected';

create table public.student_profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references public.profiles (id),
  registration_number varchar(50) not null unique,
  current_filiere_id  uuid not null references public.filieres (id),
  current_parcours_id uuid,
  current_level_id    uuid not null references public.academic_levels (id),
  enrollment_status   varchar(20) not null default 'active' check (enrollment_status in ('active','inactive')), -- valeurs à confirmer
  approved_at         timestamptz not null,
  approved_by         uuid not null references public.profiles (id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint student_parcours_filiere_fk foreign key (current_parcours_id, current_filiere_id)
    references public.parcours (id, filiere_id)
);
create index student_profiles_scope_idx on public.student_profiles (current_filiere_id, current_level_id, current_parcours_id);

create table public.student_validation_events (
  id                      uuid primary key default gen_random_uuid(),
  registration_request_id uuid not null references public.student_registration_requests (id),
  event_type              varchar(30) not null check (event_type in
    ('submitted','email_confirmed','registry_checked','approved','rejected','reopened')),
  previous_status         varchar(30),
  new_status              varchar(30),
  actor_user_id           uuid references public.profiles (id),
  event_details           jsonb,
  event_reason            text,
  created_at              timestamptz not null default now()
);
