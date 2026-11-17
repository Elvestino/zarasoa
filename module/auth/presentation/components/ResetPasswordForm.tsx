"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/constants";
import { PASSWORD_MIN_LENGTH } from "../../domain/value-object/Password";
import { useAuth } from "../hooks/useAuth";
import { AuthCard, Field } from "./AuthCard";

export function ResetPasswordForm() {
  const router = useRouter();
  const { updatePassword, logout, pending, user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    if (f.get("password") !== f.get("confirmPassword")) {
      return setError("Les deux mots de passe ne correspondent pas.");
    }
    const result = await updatePassword(String(f.get("password")));
    if (!result.ok) return setError(result.error ?? null);
    await logout(); // on repart d'une connexion propre avec le nouveau mot de passe
    router.replace(ROUTES.login);
  }

  // Le lien de l'e-mail ouvre une session de récupération (voir app/auth/callback).
  if (!loading && !user) {
    return (
      <AuthCard title="Lien expiré">
        <Alert variant="destructive">
          <AlertDescription>Ce lien n&apos;est plus valide. Refaites une demande de réinitialisation.</AlertDescription>
        </Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Nouveau mot de passe">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Field
          id="password"
          label="Nouveau mot de passe"
          hint={`${PASSWORD_MIN_LENGTH} caractères minimum, avec au moins une lettre et un chiffre.`}
        >
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </Field>
        <Field id="confirmPassword" label="Confirmer le mot de passe">
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
        </Field>
        <Button type="submit" disabled={pending || loading}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </AuthCard>
  );
}
