"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "../hooks/useAuth";
import { useAuthError } from "../hooks/useAuthError";
import { Field, FieldInput, FormError, PillButton } from "./AuthFields";
import { AuthShell } from "./AuthShell";

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const { requestPasswordReset, pending } = useAuth();
  const errorMessage = useAuthError();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const result = await requestPasswordReset(String(new FormData(e.currentTarget).get("email")));
    if (!result.ok) return setError(errorMessage(result.code));
    setSent(true);
  }

  return (
    <AuthShell title={t("forgot.title")} subtitle1={t("forgot.subtitle1")} subtitle2={t("forgot.subtitle2")}>
      {sent ? (
        // Message volontairement identique que le compte existe ou non (pas d'énumération des comptes).
        <p className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">{t("forgot.sent")}</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <FormError message={error} />
          <Field id="email" label={t("fields.email")}>
            <FieldInput id="email" name="email" type="email" autoComplete="email" required />
          </Field>
          <PillButton type="submit" disabled={pending}>
            {pending ? t("forgot.submitting") : t("forgot.submit")}
          </PillButton>
        </form>
      )}
      <Link href={ROUTES.login} className="text-center text-xs font-semibold text-primary underline-offset-4 hover:underline">
        {t("forgot.back")}
      </Link>
    </AuthShell>
  );
}
