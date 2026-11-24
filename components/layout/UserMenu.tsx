"use client";

import { LogOut, UserCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/module/auth/presentation/hooks/useAuth";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";

const itemClass =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:bg-muted disabled:cursor-not-allowed disabled:opacity-50";

/** Menu du compte dans la barre supérieure : l'avatar s'affiche, un clic révèle nom, e-mail, « Mon compte » et « Se déconnecter ». */
export function UserMenu({ name, email, accountHref }: { name: string; email: string; accountHref: string }) {
  const t = useTranslations("App");
  const { logout, pending } = useAuth();
  const [open, setOpen] = useState(false);

  async function onLogout() {
    await logout();
    // Navigation complète : repart d'un état serveur propre (aucune donnée de l'espace quitté en cache).
    window.location.assign(ROUTES.login);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t("userMenu")}
        className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">{initials(name)}</AvatarFallback>
        </Avatar>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex items-center gap-3 px-3 py-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">{initials(name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <Separator className="my-1.5" />
        <Link href={accountHref} onClick={() => setOpen(false)} className={itemClass}>
          <UserCog className="size-4 shrink-0" aria-hidden="true" />
          {t("nav.account")}
        </Link>
        <button type="button" onClick={onLogout} disabled={pending} className={itemClass}>
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          {t("logout")}
        </button>
      </PopoverContent>
    </Popover>
  );
}
