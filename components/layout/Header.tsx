"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/module/auth/presentation/hooks/useAuth";

/** Logo : version blanche (mode clair, bandeau bleu) ou version couleur (mode sombre). */
function Logo() {
  return (
    <span className="flex items-center gap-2">
      <Image src="/assets/img/logo-light-icon.png" alt="" width={520} height={300} className="h-8 w-auto dark:hidden" priority />
      <Image src="/assets/img/logo-dark-icon.png" alt="" width={520} height={307} className="hidden h-8 w-auto dark:block" priority />
      <Image src="/assets/img/logo-light-wordmark.png" alt="ZARASOA" width={620} height={138} className="h-6 w-auto dark:hidden" priority />
      <Image src="/assets/img/logo-dark-wordmark.png" alt="ZARASOA" width={620} height={143} className="hidden h-6 w-auto dark:block" priority />
    </span>
  );
}

/** Ancres de la page d'accueil (id des sections de la landing page). */
const LANDING_LINKS = [
  { href: "/#features", key: "features" },
  { href: "/#how", key: "how" },
  { href: "/#roles", key: "roles" },
] as const;

export function Header() {
  const t = useTranslations("Header");
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout, pending } = useAuth();

  async function onLogout() {
    await logout();
    router.replace(ROUTES.login);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-primary text-white dark:bg-card">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Link href={ROUTES.home} aria-label="ZARASOA">
          <Logo />
        </Link>

        {pathname === ROUTES.home ? (
          <nav aria-label="ZARASOA" className="hidden items-center gap-1 md:flex">
            {LANDING_LINKS.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {t(l.key)}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {loading ? null : user ? (
            <>
              <span className="hidden max-w-40 truncate text-sm text-white/80 md:inline">{user.email}</span>
              <Button
                type="button"
                variant="outline"
                onClick={onLogout}
                disabled={pending}
                className="h-8 rounded-full border-white/30 bg-transparent px-4 text-white hover:bg-white/10 hover:text-white dark:border-white/30 dark:bg-transparent dark:hover:bg-white/10"
              >
                {t("logout")}
              </Button>
            </>
          ) : (
            <>
              <Link href={ROUTES.login} className="hidden px-3 py-1.5 text-sm font-medium sm:inline">
                {t("login")}
              </Link>
              <Link
                href={ROUTES.register}
                className="rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground transition hover:brightness-105"
              >
                {t("register")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
