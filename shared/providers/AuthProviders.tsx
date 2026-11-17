"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser } from "@/module/auth/domain/entities/AuthUser";
import { AuthEndpoint } from "@/module/auth/infrastructure/api/AuthEndpoint";
import { AuthRepository } from "@/module/auth/infrastructure/repository/AuthRepository";
import type { IAuthRepository } from "@/module/auth/interfaces/IAuthRepository";
import { createSupabaseBrowserClient } from "../infrastructure/supabase/client";

interface AuthContextValue {
  repository: IAuthRepository;
  user: AuthUser | null;
  /** true tant que la session initiale n'a pas été lue. */
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Composition root NAVIGATEUR : branche AuthRepository sur le client Supabase du navigateur. */
export function AuthProviders({ children }: { children: ReactNode }) {
  const repository = useMemo<IAuthRepository>(
    () => new AuthRepository(new AuthEndpoint(createSupabaseBrowserClient())),
    [],
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    repository.getCurrentUser().then((u) => {
      if (!active) return;
      setUser(u);
      setLoading(false);
    });
    const unsubscribe = repository.onAuthStateChange((u) => active && setUser(u));
    return () => {
      active = false;
      unsubscribe();
    };
  }, [repository]);

  const value = useMemo(() => ({ repository, user, loading, setUser }), [repository, user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProviders>.");
  return ctx;
}
