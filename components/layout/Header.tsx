"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { useAuth } from "@/module/auth/presentation/hooks/useAuth";

export function Header() {
  const router = useRouter();
  const { user, loading, logout, pending } = useAuth();

  async function onLogout() {
    await logout();
    router.replace(ROUTES.login);
    router.refresh();
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href={ROUTES.home} className="font-semibold tracking-tight">
          {APP_NAME}
        </Link>
        <nav className="flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
              <Button variant="outline" onClick={onLogout} disabled={pending}>
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Link href={ROUTES.login} className={buttonVariants({ variant: "ghost" })}>
                Connexion
              </Link>
              <Link href={ROUTES.register} className={buttonVariants()}>
                S&apos;inscrire
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
