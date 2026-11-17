/** Identité authentifiée (Supabase Auth). Le profil métier est dans le module `user`. */
export interface AuthUser {
  id: string;
  email: string;
}

export interface Credentials {
  email: string;
  password: string;
}
