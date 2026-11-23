"use client";

import {
  BookOpen,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { LogoSmart } from "@/components/layout/Logo";
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
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
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

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

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

/** Coque commune des espaces connectés : sidebar shadcn (logo, navigation, compte) + barre supérieure. */
export function AppShell({ groups, user, sidebarTop, children }: AppShellProps) {
  const t = useTranslations("App");
  const pathname = usePathname();
  const { logout, pending } = useAuth();

  async function onLogout() {
    await logout();
    // Navigation complète : repart d'un état serveur propre (aucune donnée de l'espace quitté en cache).
    window.location.assign(ROUTES.login);
  }

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <Link href="/" aria-label="ZARASOA" className="flex h-10 items-center px-1 group-data-[collapsible=icon]:justify-center">
            <LogoSmart />
          </Link>
        </SidebarHeader>

        <SidebarContent>
          {sidebarTop ? <div className="group-data-[collapsible=icon]:hidden">{sidebarTop}</div> : null}
          {groups.map((group, i) => (
            <SidebarGroup key={group.label ?? i}>
              {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = ICONS[item.icon];
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton render={<Link href={item.href} />} isActive={isActive(item)} tooltip={item.label}>
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                        {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
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
