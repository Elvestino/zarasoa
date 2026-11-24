import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { getContainer } from "@/lib/container";
import { isUuid } from "@/shared/domain/validation";

export default async function StudentCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const t = await getTranslations("Student.courses");
  const format = await getFormatter();
  const { courses } = await getContainer();
  // La RLS ne renvoie le cours que s'il est publié et dans le périmètre de l'étudiant : sinon 404 (pas de fuite d'existence).
  const course = await courses.findVisibleById(id);
  if (!course) notFound();

  return (
    <>
      <PageHeader title={course.title} description={`${course.subjectCode} · ${course.subjectName}`} />
      <Card className="max-w-3xl">
        <CardContent className="grid gap-3 text-sm">
          {course.summary ? <p className="font-medium">{course.summary}</p> : null}
          {course.description ? <p className="whitespace-pre-line text-muted-foreground">{course.description}</p> : null}
          <p className="text-xs text-muted-foreground">
            {course.professorName ? t("by", { name: course.professorName }) : null}
            {course.professorName && course.publishedAt ? " · " : null}
            {course.publishedAt ? t("publishedOn", { date: format.dateTime(course.publishedAt, { dateStyle: "long" }) }) : null}
          </p>
        </CardContent>
      </Card>
    </>
  );
}
