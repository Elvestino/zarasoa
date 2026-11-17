import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ApiError } from "@/shared/errors/ApiError";
import { Endpoint } from "@/shared/infrastructure/api/Endpoint";
import { httpClient } from "@/shared/infrastructure/api/httpClient";
import type { Database } from "@/shared/infrastructure/supabase/database.types";
import type { AuthUser, Credentials } from "../../domain/entities/AuthUser";
import type { StudentRegistration } from "../../domain/entities/StudentRegistration";

export const toAuthUser = (user: User): AuthUser => ({ id: user.id, email: user.email ?? "" });

/**
 * Point d'accès à « l'API d'authentification ». Deux canaux :
 *  - routes Next.js `/api/auth/*` pour ce qui exige un secret serveur
 *    (comptage des échecs de connexion, création de la demande d'inscription) ;
 *  - Supabase Auth direct (navigateur ou serveur) pour le reste.
 */
export class AuthEndpoint extends Endpoint {
  constructor(private readonly supabase: SupabaseClient<Database>) {
    super("/api/auth");
  }

  login(credentials: Credentials): Promise<{ user: AuthUser }> {
    return httpClient.post(this.path("/login"), credentials);
  }

  register(registration: StudentRegistration): Promise<{ ok: true }> {
    return httpClient.post(this.path("/register"), registration);
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw new ApiError(error.message, error.status ?? 500, "SIGN_OUT_FAILED");
  }

  async requestPasswordReset(email: string, redirectTo: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new ApiError(error.message, error.status ?? 500, error.code ?? "RESET_FAILED");
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({ password });
    if (error) throw new ApiError(error.message, error.status ?? 500, error.code ?? "UPDATE_PASSWORD_FAILED");
  }

  /** getUser() revalide le jeton auprès de Supabase Auth (contrairement à getSession()). */
  async currentUser(): Promise<AuthUser | null> {
    const { data, error } = await this.supabase.auth.getUser();
    return error || !data.user ? null : toAuthUser(data.user);
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    const { data } = this.supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ? toAuthUser(session.user) : null);
    });
    return () => data.subscription.unsubscribe();
  }
}
