"use client";

import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  ShieldCheck,
  UserCog,
  UserRoundCog,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { LogoIcon, LogoSmart } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/module/auth/presentation/hooks/useAuth";

/** Les icônes sont désignées par un nom (une fonction ne peut pas passer d'un Server Component à un Client Component). */
const ICONS = {
  dashboard: LayoutDashboard,
  students: Users,
  requests: ClipboardList,
  registry: FileSpreadsheet,
  accounts: ShieldCheck,
  catalog: Library,
  courses: BookOpen,
  course: GraduationCap,
  account: UserCog,
  professors: UserRoundCog,
} as const;

export type NavIconName = keyof typeof ICONS;

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconName;
  /** Petit compteur à droite (ex. demandes en attente). */
  badge?: number;
  /** true = actif uniquement sur l'URL exacte (ex. tableau de bord). */
  exact?: boolean;
}

/** Menu déroulant : regroupe plusieurs liens sous une seule entrée (ex. « Étudiants », « Professeurs »). */
export interface NavDropdown {
  label: string;
  icon: NavIconName;
  items: NavItem[];
}

export type NavEntry = NavItem | NavDropdown;

export interface NavGroup {
  label?: string;
  items: NavEntry[];
}

const isDropdown = (entry: NavEntry): entry is NavDropdown => "items" in entry;

interface AppShellProps {
  groups: NavGroup[];
  user: { name: string; email: string; roleLabel: string };
  /** Bloc affiché sous le logo (ex. filière / parcours / niveau de l'étudiant). */
  sidebarTop?: ReactNode;
  children: ReactNode;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";

const splitHref = (href: string) => {
  const [path = "", query = ""] = href.split("?");
  return { path, params: new URLSearchParams(query) };
};
const hasQuery = (item: NavItem) => item.href.includes("?");

/** Entrée de menu déroulante : un clic ouvre / ferme la liste ; elle s'ouvre seule quand un de ses liens est actif. */
function NavDropdownEntry({ entry, isActive }: { entry: NavDropdown; isActive: (item: NavItem) => boolean }) {
  const Icon = ICONS[entry.icon];
  const { state, isMobile, setOpen: setSidebarOpen } = useSidebar();
  const hasActive = entry.items.some(isActive);
  // null = pas de choix manuel : on suit le lien actif.
  const [manual, setManual] = useState<boolean | null>(null);
  const open = manual ?? hasActive;
  const total = entry.items.reduce((sum, i) => sum + (i.badge ?? 0), 0);

  function toggle() {
    // Sidebar réduite : les sous-liens sont masqués, on déploie d'abord la barre.
    if (state === "collapsed" && !isMobile) {
      setSidebarOpen(true);
      setManual(true);
      return;
    }
    setManual(!open);
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={toggle} isActive={hasActive && !open} tooltip={entry.label} aria-expanded={open}>
        <Icon />
        <span>{entry.label}</span>
        {total > 0 && !open ? (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums group-data-[collapsible=icon]:hidden">
            {total}
          </span>
        ) : null}
        <ChevronRight
          aria-hidden="true"
          className={`${total > 0 && !open ? "" : "ml-auto"} size-4 shrink-0 transition-transform group-data-[collapsible=icon]:hidden ${open ? "rotate-90" : ""}`}
        />
      </SidebarMenuButton>
      {open ? (
        <SidebarMenuSub>
          {entry.items.map((item) => (
            <SidebarMenuSubItem key={item.href}>
              <SidebarMenuSubButton render={<Link href={item.href} />} isActive={isActive(item)}>
                <span>{item.label}</span>
                {item.badge ? <span className="ml-auto text-xs font-medium tabular-nums">{item.badge}</span> : null}
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  );
}

/** Coque commune des espaces connectés : sidebar shadcn (logo, navigation, compte) + barre supérieure. */
export function AppShell({ groups, user, sidebarTop, children }: AppShellProps) {
  const t = useTranslations("App");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { logout, pending } = useAuth();

  async function onLogout() {
    await logout();
    // Navigation complète : repart d'un état serveur propre (aucune donnée de l'espace quitté en cache).
    window.location.assign(ROUTES.login);
  }

  const allItems = groups.flatMap((g) => g.items.flatMap((e) => (isDropdown(e) ? e.items : [e])));
  const onPath = (item: NavItem) => {
    const { path } = splitHref(item.href);
    return item.exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
  };
  const queryMatches = (item: NavItem) => {
    for (const [key, value] of splitHref(item.href).params) if (searchParams.get(key) !== value) return false;
    return true;
  };
  const isActive = (item: NavItem): boolean => {
    if (!onPath(item)) return false;
    if (hasQuery(item)) return queryMatches(item);
    // Lien sans filtre : il s'efface au profit d'un lien « filtré » de la même page (ex. Comptes / Professeurs).
    const { path } = splitHref(item.href);
    return !allItems.some((o) => o !== item && hasQuery(o) && splitHref(o.href).path === path && onPath(o) && queryMatches(o));
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border group-data-[collapsible=icon]:px-1">
          <Link href="/" aria-label="ZARASOA" className="flex h-10 items-center px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            {/* Barre ouverte : icône + nom ; barre réduite : icône seule, à ses proportions d'origine. */}
            <span className="group-data-[collapsible=icon]:hidden">
              <LogoSmart />
            </span>
            <span className="hidden group-data-[collapsible=icon]:block">
              <LogoIcon />
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          {sidebarTop ? <div className="group-data-[collapsible=icon]:hidden">{sidebarTop}</div> : null}
          {groups.map((group, i) => (
            <SidebarGroup key={group.label ?? i}>
              {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((entry) => {
                    if (isDropdown(entry)) return <NavDropdownEntry key={entry.label} entry={entry} isActive={isActive} />;
                    const Icon = ICONS[entry.icon];
                    return (
                      <SidebarMenuItem key={entry.href}>
                        <SidebarMenuButton render={<Link href={entry.href} />} isActive={isActive(entry)} tooltip={entry.label}>
                          <Icon />
                          <span>{entry.label}</span>
                        </SidebarMenuButton>
                        {entry.badge ? <SidebarMenuBadge>{entry.badge}</SidebarMenuBadge> : null}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-1 py-1 group-data-[collapsible=icon]:justify-center">
            <Avatar className="size-8">
              <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-xs leading-tight group-data-[collapsible=icon]:hidden">
              <p className="truncate font-medium">{user.name}</p>
              <p className="truncate opacity-70">{user.email}</p>
            </div>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onLogout} disabled={pending} tooltip={t("logout")}>
                <LogOut />
                <span>{t("logout")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-white/10 bg-primary px-3 text-white dark:bg-card sm:px-4">
          <SidebarTrigger
            aria-label={t("toggleSidebar")}
            className="text-white hover:bg-white/10 hover:text-white dark:hover:bg-white/10"
          />
          <span className="truncate text-sm font-medium text-white/80">{user.roleLabel}</span>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>
        <div id="main" tabIndex={-1} className="flex-1 p-4 outline-none sm:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
