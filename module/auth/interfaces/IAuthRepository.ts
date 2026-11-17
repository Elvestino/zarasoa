import type { AuthUser, Credentials } from "../domain/entities/AuthUser";
import type { StudentRegistration } from "../domain/entities/StudentRegistration";

/** Port d'authentification : le domaine ignore que l'implémentation repose sur Supabase Auth. */
export interface IAuthRepository {
  signIn(credentials: Credentials): Promise<AuthUser>;
  signUpStudent(registration: StudentRegistration): Promise<void>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  /** Retourne la fonction de désabonnement. */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void;
}
