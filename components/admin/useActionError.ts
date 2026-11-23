"use client";

import { useTranslations } from "next-intl";

/** Code d'erreur renvoyé par une Server Action / route → message dans la langue courante (jamais de détail technique). */
export function useActionError() {
  const t = useTranslations("Errors");
  return (code?: string | null): string => (code && t.has(code) ? t(code) : t("GENERIC"));
}
