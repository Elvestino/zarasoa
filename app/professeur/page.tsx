import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/module/user/infrastructure/server/guards";

export default async function ProfessorDashboardPage() {
  const profile = await requireRole("professor");
  const t = await getTranslations("App.comingSoon");
  return (
    <>
      <PageHeader title={t("professorTitle", { name: profile.firstName })} />
      <Card className="max-w-2xl">
        <CardContent className="text-sm text-muted-foreground">{t("professorText")}</CardContent>
      </Card>
    </>
  );
}
