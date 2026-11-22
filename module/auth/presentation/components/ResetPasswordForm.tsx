"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "../hooks/useAuth";
import { useAuthError } from "../hooks/useAuthError";
import { Field, FormError, PillButton } from "./AuthFields";
import { AuthShell } from "./AuthShell";
import { PasswordChecklist } from "./PasswordChecklist";
import { PasswordInput } from "./PasswordInput";

export function ResetPasswordForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const { updatePassword, logout, pending, user, loading } = useAuth();
  const errorMessage = useAuthError();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    if (f.get("password") !== f.get("confirmPassword")) return setError(errorMessage("PASSWORD_MISMATCH"));
    const result = await updatePassword(String(f.get("password")));
    if (!result.ok) return setError(errorMessage(result.code));
    await logout(); // on repart d'une connexion propre avec le nouveau mot de passe
    router.replace(ROUTES.login);
  }

  // Le lien de l'e-mail ouvre une session de récupération (voir app/auth/callback).
  if (!loading && !user) {
    return (
      <AuthShell title={t("reset.expiredTitle")}>
        <FormError message={t("reset.expired")} />
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("reset.title")} subtitle1={t("reset.subtitle1")} subtitle2={t("reset.subtitle2")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <FormError message={error} />
        <Field id="password" label={t("fields.newPassword")}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            maxLength={128}
            aria-describedby="password-rules"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            visible={showPassword}
            onVisibleChange={setShowPassword}
          />
          <PasswordChecklist id="password-rules" password={password} />
        </Field>
        <Field id="confirmPassword" label={t("fields.confirmPassword")}>
          <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required maxLength={128} visible={showPassword} showToggle={false} />
        </Field>
        <PillButton type="submit" disabled={pending || loading}>
          {pending ? t("reset.submitting") : t("reset.submit")}
        </PillButton>
      </form>
    </AuthShell>
  );
}
