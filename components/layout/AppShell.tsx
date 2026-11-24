"use client";

import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  Library,
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
import { UserMenu } from "@/components/layout/UserMenu";
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
  /** Page « Mon compte » de l'espace (ouverte depuis le menu de l'avatar). */
  accountHref: string;
  /** Bloc affiché sous le logo (ex. filière / parcours / niveau de l'étudiant). */
  sidebarTop?: ReactNode;
  children: ReactNode;
}

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
      <SidebarMenuButton onClick={toggle} isActive={hasActive && !open} tooltip={entry.label} aria-expanded={open} className="h-9">
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
        <SidebarMenuSub className="my-1.5 gap-1.5 py-1">
          {entry.items.map((item) => (
            <SidebarMenuSubItem key={item.href}>
              <SidebarMenuSubButton render={<Link href={item.href} />} isActive={isActive(item)} className="h-8">
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
export function AppShell({ groups, user, accountHref, sidebarTop, children }: AppShellProps) {
  const t = useTranslations("App");
  const tf = useTranslations("Footer");
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
        <SidebarHeader className="border-b border-sidebar-border py-3 group-data-[collapsible=icon]:px-1">
          {/* Logo + bouton d'ouverture/fermeture côte à côte ; barre réduite : l'un sous l'autre. */}
          <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:justify-center">
            <Link href="/" aria-label="ZARASOA" className="flex h-10 min-w-0 items-center px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
              {/* Barre ouverte : icône + nom ; barre réduite : icône seule, à ses proportions d'origine. */}
              <span className="group-data-[collapsible=icon]:hidden">
                <LogoSmart />
              </span>
              <span className="hidden group-data-[collapsible=icon]:block">
                <LogoIcon />
              </span>
            </Link>
            <SidebarTrigger aria-label={t("toggleSidebar")} className="shrink-0" />
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-2 py-3 group-data-[collapsible=icon]:py-2">
          {sidebarTop ? <div className="group-data-[collapsible=icon]:hidden">{sidebarTop}</div> : null}
          {groups.map((group, i) => (
            <SidebarGroup key={group.label ?? i} className="px-3 py-3 group-data-[collapsible=icon]:p-2">
              {group.label ? <SidebarGroupLabel className="mb-1.5">{group.label}</SidebarGroupLabel> : null}
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {group.items.map((entry) => {
                    if (isDropdown(entry)) return <NavDropdownEntry key={entry.label} entry={entry} isActive={isActive} />;
                    const Icon = ICONS[entry.icon];
                    return (
                      <SidebarMenuItem key={entry.href}>
                        <SidebarMenuButton render={<Link href={entry.href} />} isActive={isActive(entry)} tooltip={entry.label} className="h-9">
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

        <SidebarFooter className="border-t border-sidebar-border px-4 py-4 group-data-[collapsible=icon]:hidden">
          <p className="text-xs leading-snug text-sidebar-foreground/70">{tf("text")}</p>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-white/10 bg-primary px-3 text-white dark:bg-card sm:px-4">
          {/* Sur ordinateur le bouton est dans la sidebar ; sur mobile la sidebar est fermée, il reste donc ici. */}
          <SidebarTrigger
            aria-label={t("toggleSidebar")}
            className="text-white hover:bg-white/10 hover:text-white md:hidden dark:hover:bg-white/10"
          />
          <span className="truncate text-sm font-medium text-white/80">{user.roleLabel}</span>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu name={user.name} email={user.email} accountHref={accountHref} />
          </div>
        </header>
        <div id="main" tabIndex={-1} className="flex-1 p-4 outline-none sm:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
