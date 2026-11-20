"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { setLocale } from "@/i18n/locale";
import { LOCALE_LABELS, routing, type Locale } from "@/i18n/routing";

/** Change la langue en mémorisant le cookie NEXT_LOCALE (Server Action), puis rafraîchit la page courante. */
export function LanguageSwitcher() {
  const t = useTranslations("Header");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t("language")}
      aria-busy={pending}
      className="flex items-center rounded-full bg-white/10 p-0.5 text-xs font-semibold"
    >
      {routing.locales.map((l: Locale) => (
        <Button
          key={l}
          type="button"
          variant="ghost"
          size="sm"
          lang={l}
          title={LOCALE_LABELS[l]}
          aria-pressed={l === locale}
          disabled={pending}
          onClick={() => change(l)}
          className={cn(
            "h-6 rounded-full px-2.5 text-xs font-semibold uppercase",
            l === locale
              ? "bg-secondary text-secondary-foreground hover:bg-secondary dark:hover:bg-secondary"
              : "text-white/80 hover:bg-transparent hover:text-white dark:hover:bg-transparent",
          )}
        >
          {l}
        </Button>
      ))}
    </div>
  );
}
