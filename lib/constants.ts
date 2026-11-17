export const APP_NAME = "ZARASOA";
export const APP_DESCRIPTION = "Plateforme universitaire : cours, ressources pédagogiques et devoirs.";

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  authCallback: "/auth/callback",
} as const;

/** Préfixes réservés aux comptes connectés (protégés par proxy.ts ; le contrôle par rôle viendra au sprint 1). */
export const PROTECTED_PREFIXES = ["/etudiant", "/professeur", "/admin"] as const;

/** Pages réservées aux visiteurs non connectés. */
export const GUEST_ONLY_ROUTES = [ROUTES.login, ROUTES.register, ROUTES.forgotPassword] as const;
