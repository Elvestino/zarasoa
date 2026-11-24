import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { getContainer } from "@/lib/container";

export default async function StudentCoursesPage() {
  const t = await getTranslations("Student.courses");
  const { courses } = await getContainer();
  const list = await courses.listVisible();

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <li key={c.id}>
              <Link href={`${ROUTES.student}/cours/${c.id}`} className="block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardHeader>
                    <CardDescription>
                      <span className="font-mono">{c.subjectCode}</span> · {c.subjectName}
                    </CardDescription>
                    <CardTitle>{c.title}</CardTitle>
                    {c.summary ? <p className="text-sm text-muted-foreground">{c.summary}</p> : null}
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
