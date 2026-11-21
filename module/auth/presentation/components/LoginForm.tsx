"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "../hooks/useAuth";
import { useAuthError } from "../hooks/useAuthError";
import { Field, FieldInput, FormError, Honeypot, PillButton } from "./AuthFields";
import { AuthShell } from "./AuthShell";

export function LoginForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const params = useSearchParams();
  const { login, pending } = useAuth();
  const errorMessage = useAuthError();
  const [error, setError] = useState<string | null>(
    params.get("error") === "lien_invalide" ? t("login.invalidLink") : null,
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    if (form.get("website")) return setError(errorMessage("INVALID_CREDENTIALS")); // piège à robots
    const result = await login({ email: String(form.get("email")), password: String(form.get("password")) });
    if (!result.ok) return setError(errorMessage(result.code));
    router.replace(ROUTES.home);
    router.refresh();
  }

  return (
    <AuthShell title={t("login.title")} subtitle1={t("login.subtitle1")} subtitle2={t("login.subtitle2")}>
      <form onSubmit={onSubmit} className="relative flex flex-col gap-5">
        <Honeypot />
        <FormError message={error} />
        <Field id="email" label={t("fields.email")}>
          <FieldInput id="email" name="email" type="email" autoComplete="email" required maxLength={254} spellCheck={false} autoCapitalize="none" />
        </Field>
        <Field id="password" label={t("fields.password")}>
          <FieldInput id="password" name="password" type="password" autoComplete="current-password" required maxLength={256} />
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
