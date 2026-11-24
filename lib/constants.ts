export const APP_NAME = "ZARASOA";
export const APP_DESCRIPTION = "Plateforme universitaire : cours, ressources pédagogiques et devoirs.";

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  linkExpired: "/link-expired",
  authCallback: "/auth/callback",
  privacy: "/privacy",
  terms: "/terms",
  continue: "/auth/continue",
  admin: "/admin",
  student: "/etudiant",
  professor: "/professeur",
} as const;

/** Préfixes réservés aux comptes connectés (protégés par proxy.ts ; le contrôle par rôle viendra au sprint 1). */
export const PROTECTED_PREFIXES = ["/etudiant", "/professeur", "/admin"] as const;

/** Pages réservées aux visiteurs non connectés. */
export const GUEST_ONLY_ROUTES = [ROUTES.login, ROUTES.register, ROUTES.forgotPassword] as const;

/** Pages publiques indexables (sitemap). */
export const PUBLIC_ROUTES = [ROUTES.home, ROUTES.login, ROUTES.register, ROUTES.forgotPassword, ROUTES.privacy, ROUTES.terms] as const;
