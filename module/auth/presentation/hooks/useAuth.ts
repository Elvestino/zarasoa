"use client";

import { useCallback, useState } from "react";
import { useAuthContext } from "@/shared/providers/AuthProviders";
import type { Credentials } from "../../domain/entities/AuthUser";
import type { StudentRegistration } from "../../domain/entities/StudentRegistration";

/** Résultat d'une action d'authentification : `error` est un message prêt à afficher. */
export interface ActionResult {
  ok: boolean;
  error?: string;
}

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : "Une erreur est survenue.";
}

export function useAuth() {
  const { repository, user, loading, setUser } = useAuthContext();
  const [pending, setPending] = useState(false);

  const run = useCallback(async (action: () => Promise<void>): Promise<ActionResult> => {
    setPending(true);
    try {
      await action();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: messageOf(e) };
    } finally {
      setPending(false);
    }
  }, []);

  return {
    user,
    isAuthenticated: user !== null,
    /** Lecture de la session initiale en cours. */
    loading,
    /** Une action (login, inscription…) est en cours. */
    pending,
    login: (credentials: Credentials) =>
      run(async () => {
        // La connexion se fait côté serveur : le navigateur n'est pas prévenu, on met l'état à jour ici.
        setUser(await repository.signIn(credentials));
      }),
    register: (registration: StudentRegistration) => run(() => repository.signUpStudent(registration)),
    logout: () =>
      run(async () => {
        await repository.signOut();
        setUser(null);
      }),
    requestPasswordReset: (email: string) => run(() => repository.requestPasswordReset(email)),
    updatePassword: (password: string) => run(() => repository.updatePassword(password)),
  };
}
