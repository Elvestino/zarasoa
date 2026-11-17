-- ZARASOA — Création du PREMIER super administrateur (à exécuter UNE fois, dans le SQL Editor Supabase).
-- 1) Créez d'abord l'utilisateur dans Supabase → Authentication → Users (cochez « Auto Confirm User »).
-- 2) Remplacez l'e-mail ci-dessous, puis exécutez ce script.
-- Le SQL Editor s'exécute sans JWT (auth.uid() IS NULL) : les gardes utilisateur ne s'appliquent pas.

do $$
declare v_id uuid;
begin
  select id into v_id from public.profiles where lower(email) = lower('votre-email@exemple.com');
  if v_id is null then raise exception 'Profil introuvable : créez d''abord l''utilisateur dans Authentication'; end if;

  update public.profiles
     set account_status = 'approved',
         first_name = case when first_name = '' then 'Admin' else first_name end,
         last_name  = case when last_name  = '' then 'Zarasoa' else last_name end
   where id = v_id;

  insert into public.user_roles (user_id, role_code, assigned_by)
  values (v_id, 'super_admin', null)
  on conflict (user_id, role_code) where revoked_at is null do nothing;
end $$;
