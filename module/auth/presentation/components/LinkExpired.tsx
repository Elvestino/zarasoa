import { MailWarning } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { AuthShell } from "./AuthShell";

const pillLink =
  "mx-auto mt-2 inline-flex h-11 w-full max-w-xs cursor-pointer items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-md transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40";

/** Lien expiré (validité 1 h) : explique la situation et propose de recommencer. */
export function LinkExpired({ kind }: { kind: "recovery" | "signup" }) {
  const t = useTranslations("Auth.linkExpired");

  return (
    <AuthShell title={t("title")}>
      <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-center">
        <MailWarning className="size-8 text-destructive" aria-hidden="true" />
        <p className="text-sm font-semibold">{t(kind === "recovery" ? "recoveryHeading" : "signupHeading")}</p>
        <p className="text-sm text-muted-foreground">{t(kind === "recovery" ? "recoveryText" : "signupText")}</p>
      </div>
      {kind === "recovery" ? (
        <Link href={ROUTES.forgotPassword} className={pillLink}>
          {t("requestNew")}
        </Link>
      ) : (
        <Link href={ROUTES.register} className={pillLink}>
          {t("registerAgain")}
        </Link>
      )}
      <Link href={ROUTES.login} className="text-center text-xs font-semibold text-primary underline-offset-4 hover:underline">
        {t("backToLogin")}
      </Link>
    </AuthShell>
  );
}
