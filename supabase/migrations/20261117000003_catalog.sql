-- ZARASOA v2.1 — Module 05 : filières, parcours, niveaux, matières

create table public.filieres (
  id           uuid primary key default gen_random_uuid(),
  code         varchar(30) not null unique,
  name         varchar(150) not null,
  description  text,
  faculty_name varchar(150),
  is_active    boolean not null default true,
  created_by   uuid references public.profiles (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.parcours (
  id          uuid primary key default gen_random_uuid(),
  filiere_id  uuid not null references public.filieres (id) on delete restrict,
  code        varchar(30) not null,
  name        varchar(150) not null,
  description text,
  is_active   boolean not null default true,
  created_by  uuid references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint parcours_filiere_code_key unique (filiere_id, code),
  -- Permet les clés étrangères composites (parcours, filière) : cohérence parcours/filière garantie en base.
  constraint parcours_id_filiere_key unique (id, filiere_id)
);

create table public.academic_levels (
  id         uuid primary key default gen_random_uuid(),
  code       varchar(10) not null unique check (code in ('L1','L2','L3','M1','M2')),
  label      varchar(50) not null,
  cycle      varchar(30) not null check (cycle in ('licence','master')),
  sort_order smallint not null unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.academic_levels (code, label, cycle, sort_order) values
  ('L1', 'Licence 1', 'licence', 1),
  ('L2', 'Licence 2', 'licence', 2),
  ('L3', 'Licence 3', 'licence', 3),
  ('M1', 'Master 1',  'master',  4),
  ('M2', 'Master 2',  'master',  5);

create table public.subjects (
  id          uuid primary key default gen_random_uuid(),
  code        varchar(40) not null,
  name        varchar(180) not null,
  description text,
  filiere_id  uuid not null references public.filieres (id),
  level_id    uuid not null references public.academic_levels (id),
  parcours_id uuid,                       -- NULL = matière commune à tous les parcours de la filière/niveau
  coefficient numeric(5,2) check (coefficient > 0),
  credits     numeric(5,2) check (credits >= 0),
  is_active   boolean not null default true,
  created_by  uuid references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint subjects_filiere_level_code_key unique (filiere_id, level_id, code),
  -- MATCH SIMPLE : non vérifiée quand parcours_id est NULL.
  constraint subjects_parcours_filiere_fk foreign key (parcours_id, filiere_id)
    references public.parcours (id, filiere_id)
);
create index subjects_scope_idx on public.subjects (filiere_id, level_id, parcours_id);
