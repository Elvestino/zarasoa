import { BookOpen, GraduationCap, Layers, Library } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { getContainer } from "@/lib/container";
import { requireRole } from "@/module/user/infrastructure/server/guards";

export default async function StudentDashboardPage() {
  const profile = await requireRole("student");
  const t = await getTranslations("Student");
  const { students, courses } = await getContainer();
  const [student, myCourses] = await Promise.all([students.findByUserId(profile.id), courses.listVisible()]);

  const cards = student
    ? [
        { key: "level", value: student.level.label, icon: GraduationCap },
        { key: "filiere", value: student.filiere.name, icon: Library },
        { key: "parcours", value: student.parcours?.name ?? t("info.noParcours"), icon: Layers },
        { key: "courses", value: String(myCourses.length), icon: BookOpen },
      ]
    : [];

  return (
    <>
      <PageHeader
        title={t("dashboard.title", { name: profile.firstName })}
        description={student ? t("dashboard.registration", { number: student.registrationNumber }) : t("dashboard.noRecord")}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, value, icon: Icon }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardDescription>{t(`info.${key}`)}</CardDescription>
              <Icon className="size-4 text-primary" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold leading-snug">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("courses.title")}</CardTitle>
          <CardDescription>{t("courses.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {myCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("courses.empty")}</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {myCourses.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={`${ROUTES.student}/cours/${c.id}`} className="block rounded-lg border p-3 transition-colors hover:bg-muted/40">
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.subjectName}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {myCourses.length > 6 ? (
            <Link href={`${ROUTES.student}/cours`} className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
              {t("courses.seeAll")}
            </Link>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
