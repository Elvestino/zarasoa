"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "../hooks/useAuth";
import { AuthCard, Field } from "./AuthCard";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, pending } = useAuth();
  const [error, setError] = useState<string | null>(
    params.get("error") === "lien_invalide" ? "Ce lien n'est plus valide. Recommencez la demande." : null,
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const result = await login({ email: String(form.get("email")), password: String(form.get("password")) });
    if (!result.ok) return setError(result.error ?? null);
    router.replace(ROUTES.home);
    router.refresh();
  }

  return (
    <AuthCard title="Connexion" description="Accédez à vos cours et à vos devoirs.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Field id="email" label="Adresse e-mail">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field id="password" label="Mot de passe">
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        <Link href={ROUTES.forgotPassword} className="underline-offset-4 hover:underline">
          Mot de passe oublié ?
        </Link>
        <span>
          Pas encore de compte ?{" "}
          <Link href={ROUTES.register} className="text-foreground underline-offset-4 hover:underline">
            S&apos;inscrire
          </Link>
        </span>
      </div>
    </AuthCard>
  );
}
