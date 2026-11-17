-- ZARASOA v2.1 — Module 13 : journal d'audit administratif

create table public.administrative_audit_logs (
  id            uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles (id),
  action_code   varchar(80) not null,
  entity_table  varchar(80) not null,
  entity_id     uuid,
  before_data   jsonb,
  after_data    jsonb,
  reason        text,
  request_id    uuid,
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz not null default now()
);
create index audit_logs_entity_idx on public.administrative_audit_logs (entity_table, entity_id);
create index audit_logs_created_idx on public.administrative_audit_logs (created_at desc);

-- Écriture réservée aux fonctions contrôlées (EXECUTE retiré aux clients dans la migration RLS).
create or replace function public.log_admin_action(
  p_action_code  text,
  p_entity_table text,
  p_entity_id    uuid,
  p_before       jsonb default null,
  p_after        jsonb default null,
  p_reason       text default null
) returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.administrative_audit_logs
    (actor_user_id, action_code, entity_table, entity_id, before_data, after_data, reason)
  values (auth.uid(), p_action_code, p_entity_table, p_entity_id, p_before, p_after, p_reason);
end $$;
