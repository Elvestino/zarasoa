"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, type FormEvent } from "react";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { notify } from "@/lib/notify";
import { useAuth } from "../hooks/useAuth";
import { useAuthError } from "../hooks/useAuthError";
import { Field, FieldInput, Honeypot, PillButton } from "./AuthFields";
import { AuthShell } from "./AuthShell";
import { PasswordInput } from "./PasswordInput";

export function LoginForm() {
  const t = useTranslations("Auth");
  const params = useSearchParams();
  const { login, pending } = useAuth();
  const errorMessage = useAuthError();
  // Erreur transmise par /auth/callback (lien invalide) ou /auth/continue (compte non autorisé : code AUTH_ERROR) : affichée en toast.
  const initialError = params.get("error");
  const shown = useRef(false);
  useEffect(() => {
    if (!initialError || shown.current) return;
    shown.current = true;
    notify.error(initialError === "lien_invalide" ? t("login.invalidLink") : (errorMessage(initialError) ?? t("errors.generic")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialError]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (form.get("website")) return notify.error(errorMessage("INVALID_CREDENTIALS") ?? t("errors.generic")); // piège à robots
    const result = await login({ email: String(form.get("email")), password: String(form.get("password")) });
    if (!result.ok) return notify.error(errorMessage(result.code) ?? t("errors.generic"));
    // Navigation complète : /auth/continue (route serveur) aiguille vers l'espace du rôle (admin, étudiant, professeur).
    window.location.assign(ROUTES.continue);
  }

  return (
    <AuthShell title={t("login.title")} subtitle1={t("login.subtitle1")} subtitle2={t("login.subtitle2")}>
      <form onSubmit={onSubmit} className="relative flex flex-col gap-5">
        <Honeypot />
        <Field id="email" label={t("fields.email")}>
          <FieldInput id="email" name="email" type="email" autoComplete="email" required maxLength={254} spellCheck={false} autoCapitalize="none" />
        </Field>
        <Field id="password" label={t("fields.password")}>
          <PasswordInput id="password" name="password" autoComplete="current-password" required maxLength={256} />
        </Field>
        <Link href={ROUTES.forgotPassword} className="text-xs text-primary underline-offset-4 hover:underline">
          {t("login.forgot")}
        </Link>
        <PillButton type="submit" disabled={pending}>
          {pending ? t("login.submitting") : t("login.submit")}
        </PillButton>
      </form>
      <p className="text-center text-xs text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link href={ROUTES.register} className="font-semibold text-primary underline-offset-4 hover:underline">
          {t("login.signUp")}
        </Link>
      </p>
    </AuthShell>
  );
}
