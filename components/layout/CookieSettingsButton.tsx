"use client";

import { useTranslations } from "next-intl";
import { openCookieSettings } from "@/lib/consent";

/** Rouvre le bandeau de cookies (lien du pied de page). */
export function CookieSettingsButton({ className }: { className?: string }) {
  const t = useTranslations("Footer");
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      {t("cookies")}
    </button>
  );
}
