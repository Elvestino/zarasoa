import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AppShell, type NavGroup } from "@/components/layout/AppShell";
import { ROUTES } from "@/lib/constants";
import { getContainer } from "@/lib/container";
import { displayName } from "@/module/user/domain/entities/Profile";
import { requireRole } from "@/module/user/infrastructure/server/guards";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const SIDEBAR_COURSES = 8;

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const profile = await requireRole("student");
  const t = await getTranslations("App");
  const ts = await getTranslations("Student");
  const { students, courses } = await getContainer();
  // La RLS limite déjà la liste aux cours publiés de la filière, du parcours et du niveau de l'étudiant.
  const [student, myCourses] = await Promise.all([students.findByUserId(profile.id), courses.listVisible()]);

  const groups: NavGroup[] = [
    {
      label: t("nav.groupStudy"),
      items: [
        { href: ROUTES.student, label: t("nav.dashboard"), icon: "dashboard", exact: true },
        { href: `${ROUTES.student}/cours`, label: t("nav.courses"), icon: "courses", exact: true },
      ],
    },
  ];
  if (myCourses.length > 0) {
    groups.push({
      label: ts("sidebarCourses"),
      items: myCourses.slice(0, SIDEBAR_COURSES).map((c) => ({ href: `${ROUTES.student}/cours/${c.id}`, label: c.title, icon: "course" as const })),
    });
  }

  const info = student
    ? [
        { label: ts("info.level"), value: student.level.label },
        { label: ts("info.filiere"), value: student.filiere.name },
        { label: ts("info.parcours"), value: student.parcours?.name ?? ts("info.noParcours") },
      ]
    : [];

  return (
    <AppShell
      groups={groups}
      accountHref={`${ROUTES.student}/compte`}
      user={{ name: displayName(profile), email: profile.email, roleLabel: t("roles.student") }}
      sidebarTop={
        info.length ? (
          <dl className="mx-2 mt-2 grid gap-2 rounded-lg bg-sidebar-accent p-3 text-xs">
            {info.map((i) => (
              <div key={i.label}>
                <dt className="text-[10px] uppercase tracking-wide opacity-70">{i.label}</dt>
                <dd className="font-medium leading-snug">{i.value}</dd>
              </div>
            ))}
          </dl>
        ) : null
      }
    >
      {children}
    </AppShell>
  );
}
