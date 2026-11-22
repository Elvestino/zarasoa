import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { Logo } from "@/components/layout/Logo";

interface AuthShellProps {
  title: string;
  subtitle1?: string;
  subtitle2?: string;
  children: ReactNode;
}



export function AuthShell({ title, subtitle1, subtitle2, children }: AuthShellProps) {
  const t = useTranslations("Auth.panel");
  const tc = useTranslations("Common");

  return (
    <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <rect width="100" height="100" className="fill-brand-navy" />
        <path d="M0 0H52C41 16 29 38 29 58C29 78 37 90 34 100H0Z" fill="#fff" fillOpacity="0.07" />
        <path d="M56 0C44 16 33 38 33 58C33 78 41 90 38 100H100V0Z" className="fill-brand-gold" />
        <path d="M59.5 0C48 16 37 38 37 58C37 78 45 90 42 100H100V0Z" className="fill-card" />
      </svg>

      <Link
        href={ROUTES.home}
        aria-label={tc("close")}
        className="absolute right-4 top-4 z-10 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground max-md:text-white/80 max-md:hover:text-white"
      >
        <X className="size-5" />
      </Link>

      <div className="relative grid md:min-h-144 md:grid-cols-[46%_54%]">
        {/* Bandeau mobile */}
        <div className="flex items-center bg-brand-navy px-6 py-5 md:hidden">
          {/* <Image src="/assets/img/logo-light-wordmark.png" alt="ZARASOA" width={620} height={138} className="h-9 w-auto" priority /> */}
        <Logo />
        </div>

        {/* Panneau d'accueil (bureau) */}
        <aside className="hidden flex-col justify-between p-9 text-white md:flex">
          <div className="max-w-[68%]">
            <p className="text-2xl font-light leading-none">{t("hello")}</p>
            <Logo />
            <p className="mt-3 text-xs font-medium tracking-wide text-brand-gold">{tc("tagline")}</p>
          </div>
          <div className="max-w-[62%] space-y-4 text-xs leading-relaxed text-white/80">
            <p>{t("p1")}</p>
            <p>{t("p2")}</p>
          </div>
        </aside>

        {/* Formulaire */}
        <section className="flex flex-col gap-5 p-6 pb-8 sm:p-10 md:py-10 md:pl-6 md:pr-12">
          <header className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-primary">{title}</h1>
            {subtitle1 ? <p className="mt-2 text-xs text-muted-foreground">{subtitle1}</p> : null}
            {subtitle2 ? <p className="text-xs font-medium text-primary">{subtitle2}</p> : null}
          </header>
          {children}
        </section>
      </div>
    </div>
  );
}
