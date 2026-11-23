import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AppShell, type NavGroup } from "@/components/layout/AppShell";
import { ROUTES } from "@/lib/constants";
import { getContainer } from "@/lib/container";
import { displayName } from "@/module/user/domain/entities/Profile";
import { requireRole } from "@/module/user/infrastructure/server/guards";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const profile = await requireRole("super_admin");
  const t = await getTranslations("App");
  const { registrationRequests } = await getContainer();
  const pending = (await registrationRequests.countByStatus()).pending_admin;

  const groups: NavGroup[] = [
    {
      label: t("nav.groupManage"),
      items: [
        { href: ROUTES.admin, label: t("nav.dashboard"), icon: "dashboard", exact: true },
        { href: `${ROUTES.admin}/etudiants`, label: t("nav.students"), icon: "students" },
        { href: `${ROUTES.admin}/demandes`, label: t("nav.requests"), icon: "requests", badge: pending },
        { href: `${ROUTES.admin}/registre`, label: t("nav.registry"), icon: "registry" },
        { href: `${ROUTES.admin}/catalogue`, label: t("nav.catalog"), icon: "catalog" },
        { href: `${ROUTES.admin}/comptes`, label: t("nav.accounts"), icon: "accounts" },
      ],
    },
    { label: t("nav.groupAccount"), items: [{ href: `${ROUTES.admin}/compte`, label: t("nav.account"), icon: "account" }] },
  ];

  return (
    <AppShell groups={groups} user={{ name: displayName(profile), email: profile.email, roleLabel: t("roles.super_admin") }}>
      {children}
    </AppShell>
  );
}
