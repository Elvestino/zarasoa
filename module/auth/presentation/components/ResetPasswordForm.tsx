"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { notify } from "@/lib/notify";
import { useAuth } from "../hooks/useAuth";
import { useAuthError } from "../hooks/useAuthError";
import { Field, PillButton } from "./AuthFields";
import { AuthShell } from "./AuthShell";
import { PasswordChecklist } from "./PasswordChecklist";
import { PasswordInput } from "./PasswordInput";

/** Durée de validité de la session de réinitialisation : 1 heure, comme le lien de l'e-mail. */
const RESET_SESSION_MS = 60 * 60 * 1000;

/** Codes renvoyés par Supabase quand la session de réinitialisation n'existe plus ou a expiré. */
const EXPIRED_CODES = ["session_expired", "session_not_found", "refresh_token_not_found", "bad_jwt", "not_authenticated", "SESSION_EXPIRED"];

export function ResetPasswordForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const { updatePassword, logout, pending, user, loading } = useAuth();
  const errorMessage = useAuthError();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Évite une double redirection (expiration + déconnexion volontaire après le succès).
  const finished = useRef(false);

  /** Session expirée : déconnexion immédiate, message, puis page « lien expiré ». */
  const expire = useCallback(async () => {
    if (finished.current) return;
    finished.current = true;
    await logout();
    notify.error(t("errors.SESSION_EXPIRED"));
    router.replace(`${ROUTES.linkExpired}?type=recovery`);
  }, [logout, router, t]);

  // Le lien de l'e-mail ouvre une session de récupération (voir app/auth/callback) : sans session, le lien est inutilisable.
  useEffect(() => {
    if (!loading && !user && !finished.current) {
      finished.current = true;
      router.replace(`${ROUTES.linkExpired}?type=recovery`);
    }
  }, [loading, user, router]);

  // Au bout d'1 h sur cette page, la session de réinitialisation est fermée.
  // `expire` change à chaque rendu (useAuth recrée `logout`) : on passe par une ref pour ne pas relancer le minuteur.
  const expireRef = useRef(expire);
  useEffect(() => {
    expireRef.current = expire;
  });
  const hasSession = Boolean(user);
  useEffect(() => {
    if (!hasSession) return;
    const timer = setTimeout(() => void expireRef.current(), RESET_SESSION_MS);
    return () => clearTimeout(timer);
  }, [hasSession]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("password") !== f.get("confirmPassword")) return notify.error(errorMessage("PASSWORD_MISMATCH") ?? t("errors.generic"));
    const result = await updatePassword(String(f.get("password")));
    if (!result.ok) {
      if (result.code && EXPIRED_CODES.includes(result.code)) return void expire();
      return notify.error(errorMessage(result.code) ?? t("errors.generic"));
    }
    finished.current = true;
    await logout(); // on repart d'une connexion propre avec le nouveau mot de passe
    notify.success(t("reset.success"), t("reset.successText"));
    router.replace(ROUTES.login);
  }

  if (!loading && !user) return null; // redirection vers /link-expired en cours

  return (
    <AuthShell title={t("reset.title")} subtitle1={t("reset.subtitle1")} subtitle2={t("reset.subtitle2")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
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
