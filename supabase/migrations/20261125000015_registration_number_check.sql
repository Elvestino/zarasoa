-- ZARASOA v2.1 — Module 02 : préinscription et dossier étudiant (US-014 : empêcher les demandes en double)
--
-- Le matricule est déjà protégé par l'index unique `student_requests_matricule_active_key`, mais cet index ne parle
-- qu'après la création du compte Supabase Auth : l'e-mail de confirmation est alors déjà parti pour une demande
-- qui sera refusée. Cette fonction permet à l'action serveur de poser la question AVANT `signUp`.
-- L'index unique reste le filet de sécurité (deux inscriptions simultanées avec le même matricule).

create or replace function public.registration_number_in_use(p_number text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select
    -- demande en cours ou approuvée (les demandes refusées libèrent le matricule, comme l'index unique)
    exists (
      select 1
        from public.student_registration_requests r
       where public.normalize_registration_number(r.registration_number) = public.normalize_registration_number(p_number)
         and r.request_status <> 'rejected'
    )
    -- étudiant déjà approuvé avec ce matricule
    or exists (
      select 1
        from public.student_profiles sp
       where public.normalize_registration_number(sp.registration_number) = public.normalize_registration_number(p_number)
    );
$$;

-- Appelée uniquement par le serveur Next.js avec la clé secrète : jamais depuis le navigateur
-- (elle permettrait de tester quels matricules existent).
revoke execute on function public.registration_number_in_use(text) from public, anon, authenticated;
grant execute on function public.registration_number_in_use(text) to service_role;
