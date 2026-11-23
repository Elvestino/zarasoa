import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AppShell, type NavGroup } from "@/components/layout/AppShell";
import { ROUTES } from "@/lib/constants";
import { displayName } from "@/module/user/domain/entities/Profile";
import { requireRole } from "@/module/user/infrastructure/server/guards";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ProfessorLayout({ children }: { children: ReactNode }) {
  const profile = await requireRole("professor");
  const t = await getTranslations("App");
  const groups: NavGroup[] = [
    {
      items: [
        { href: ROUTES.professor, label: t("nav.dashboard"), icon: "dashboard", exact: true },
        { href: `${ROUTES.professor}/compte`, label: t("nav.account"), icon: "account" },
      ],
    },
  ];
  return (
    <AppShell groups={groups} user={{ name: displayName(profile), email: profile.email, roleLabel: t("roles.professor") }}>
      {children}
    </AppShell>
  );
}
