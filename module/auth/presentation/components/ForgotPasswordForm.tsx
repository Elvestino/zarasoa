"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "../hooks/useAuth";
import { AuthCard, Field } from "./AuthCard";

export function ForgotPasswordForm() {
  const { requestPasswordReset, pending } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const result = await requestPasswordReset(String(new FormData(e.currentTarget).get("email")));
    if (!result.ok) return setError(result.error ?? null);
    setSent(true);
  }

  return (
    <AuthCard title="Mot de passe oublié" description="Nous vous envoyons un lien pour en choisir un nouveau.">
      {sent ? (
        // Message volontairement identique que le compte existe ou non (pas d'énumération des comptes).
        <Alert>
          <AlertDescription>
            Si cette adresse correspond à un compte, un e-mail de réinitialisation vient d&apos;être envoyé.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Field id="email" label="Adresse e-mail">
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Envoi…" : "Envoyer le lien"}
          </Button>
        </form>
      )}
      <Link href={ROUTES.login} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        Retour à la connexion
      </Link>
    </AuthCard>
  );
}
