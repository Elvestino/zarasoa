-- ZARASOA v2.1 — Module 01 : authentification, comptes et rôles

create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  email              text not null,
  first_name         varchar(100) not null,
  last_name          varchar(100) not null,
  pseudo             varchar(200),
  phone_number       varchar(25),
  avatar_path        text,
  account_status     varchar(30) not null default 'pending_email'
    check (account_status in ('pending_email','pending_admin','approved','rejected','suspended','locked','deactivated')),
  preferred_locale   varchar(10) not null default 'fr',
  last_seen_at       timestamptz,
  failed_login_count smallint not null default 0 check (failed_login_count >= 0),
  locked_at          timestamptz,
  deactivated_at     timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);
create unique index profiles_email_normalized_key on public.profiles (lower(btrim(email)));

create table public.user_roles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id),
  role_code         varchar(30) not null check (role_code in ('student','professor','super_admin')),
  assigned_by       uuid references public.profiles (id),
  assigned_at       timestamptz not null default now(),
  revoked_at        timestamptz,
  revoked_by        uuid references public.profiles (id),
  revocation_reason text,
  created_at        timestamptz not null default now()
);
create unique index user_roles_active_key on public.user_roles (user_id, role_code) where revoked_at is null;

create table public.account_security_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id),
  event_type    varchar(30) not null check (event_type in
    ('login_failed','account_locked','account_unlocked','account_deactivated','account_reactivated','account_deleted')),
  actor_user_id uuid references public.profiles (id),
  event_reason  text,
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz not null default now()
);
create index account_security_events_user_idx on public.account_security_events (user_id, created_at desc);

-- Création automatique du profil à l'inscription Supabase Auth (cohérence 1:1 avec auth.users).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, first_name, last_name, pseudo, phone_number)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    nullif(new.raw_user_meta_data ->> 'pseudo', ''),
    nullif(new.raw_user_meta_data ->> 'phone_number', '')
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
