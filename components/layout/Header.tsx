"use client";

import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/module/auth/presentation/hooks/useAuth";
import { LogoSmart } from "./Logo";

/** Ancres de la page d'accueil (id des sections de la landing page). */
const LANDING_LINKS = [
  { href: "/#features", key: "features" },
  { href: "/#how", key: "how" },
  { href: "/#roles", key: "roles" },
] as const;

export function Header() {
  const t = useTranslations("Header");
  const tc = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout, pending } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  async function onLogout() {
    setMenuOpen(false);
    await logout();
    router.replace(ROUTES.login);
    router.refresh();
  }

  const isHome = pathname === ROUTES.home;
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-primary text-white dark:bg-card">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Link href={ROUTES.home} aria-label="ZARASOA" className="shrink-0">
          <LogoSmart />
        </Link>

        {isHome ? (
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
          {/* Bureau : langue, thème et compte */}
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <ThemeToggle />
          <div className="hidden items-center gap-2 md:flex">
            {loading ? null : user ? (
              <>
                <span className="max-w-40 truncate text-sm text-white/80">{user.email}</span>
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
                <Link href={ROUTES.login} className="px-3 py-1.5 text-sm font-medium">
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

          {/* Mobile et tablette : menu burger */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("menu")}
                  className="rounded-full text-white/80 hover:bg-white/10 hover:text-white md:hidden dark:hover:bg-white/10"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              showCloseButton={false}
              className="w-4/5 max-w-xs gap-0 border-white/10 bg-primary p-0 text-white dark:bg-card"
            >
              <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
                <SheetTitle className="text-base font-semibold text-white">{t("menu")}</SheetTitle>
                <SheetClose
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={tc("close")}
                      className="rounded-full text-white/80 hover:bg-white/10 hover:text-white dark:hover:bg-white/10"
                    />
                  }
                >
                  <X className="size-5" />
                </SheetClose>
              </div>
              <SheetDescription className="sr-only">ZARASOA</SheetDescription>

              <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
                {isHome ? (
                  <nav aria-label="ZARASOA" className="flex flex-col gap-1">
                    {LANDING_LINKS.map((l) => (
                      <Link
                        key={l.key}
                        href={l.href}
                        onClick={closeMenu}
                        className="rounded-xl px-3 py-2.5 text-base font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        {t(l.key)}
                      </Link>
                    ))}
                  </nav>
                ) : null}

                <div className="flex flex-col items-start gap-2">
                  <span className="px-3 text-xs font-medium uppercase tracking-wide text-white/60">{t("language")}</span>
                  <LanguageSwitcher />
                </div>

                <div className="mt-auto flex flex-col gap-2">
                  {loading ? null : user ? (
                    <>
                      <span className="truncate px-3 text-sm text-white/70">{user.email}</span>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onLogout}
                        disabled={pending}
                        className="h-10 rounded-full border-white/30 bg-transparent px-4 text-white hover:bg-white/10 hover:text-white dark:border-white/30 dark:bg-transparent dark:hover:bg-white/10"
                      >
                        {t("logout")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link
                        href={ROUTES.register}
                        onClick={closeMenu}
                        className="rounded-full bg-secondary px-4 py-2.5 text-center text-sm font-semibold text-secondary-foreground transition hover:brightness-105"
                      >
                        {t("register")}
                      </Link>
                      <Link
                        href={ROUTES.login}
                        onClick={closeMenu}
                        className="rounded-full border border-white/30 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10"
                      >
                        {t("login")}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
