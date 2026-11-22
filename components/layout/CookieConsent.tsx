"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { onOpenCookieSettings, saveConsent, useConsent, type Consent } from "@/lib/consent";
import { ROUTES } from "@/lib/constants";

/** Bandeau de consentement : refuser est aussi simple qu'accepter ; sans choix, aucun cookie de mesure n'est déposé. */
export function CookieConsent() {
  const t = useTranslations("Cookies");
  const consent = useConsent();
  const [reopened, setReopened] = useState(false);

  useEffect(() => onOpenCookieSettings(() => setReopened(true)), []);

  if (consent === "pending" || (consent !== "none" && !reopened)) return null;

  function choose(value: Consent) {
    saveConsent(value);
    setReopened(false);
  }

  const buttonBase =
    "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <section
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl sm:flex-row sm:items-center sm:p-5">
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-sm font-semibold">{t("title")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {t("text")}{" "}
            <Link href={ROUTES.privacy} className="font-medium text-primary underline underline-offset-4">
              {t("more")}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => choose("refused")} className={`${buttonBase} border border-border bg-background hover:bg-muted`}>
            {t("refuse")}
          </button>
          <button type="button" onClick={() => choose("accepted")} className={`${buttonBase} bg-primary text-primary-foreground hover:brightness-110`}>
            {t("accept")}
          </button>
        </div>
      </div>
    </section>
  );
}
