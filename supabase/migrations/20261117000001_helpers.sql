-- ZARASOA v2.1 — 0001 : fonctions utilitaires

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Cast UUID tolérant (utilisé par les policies Storage sur les chemins de fichiers).
create or replace function public.safe_uuid(p text)
returns uuid language plpgsql immutable set search_path = '' as $$
begin
  return p::uuid;
exception when others then
  return null;
end $$;

-- Normalisation du matricule — règle À VALIDER avec l'administration (§11 du cahier des charges).
create or replace function public.normalize_registration_number(p text)
returns text language sql immutable set search_path = '' as $$
  select upper(btrim(p));
$$;
