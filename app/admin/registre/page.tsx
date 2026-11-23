import { getFormatter, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge, type Tone } from "@/components/admin/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getContainer } from "@/lib/container";
import { RegistryImportPanel } from "@/module/registry/presentation/components/RegistryImportPanel";

const TONE: Record<string, Tone> = { completed: "success", completed_with_errors: "warning", failed: "danger", processing: "info" };

export default async function RegistryPage() {
  const t = await getTranslations("Admin.registry");
  const format = await getFormatter();
  const { registryImports } = await getContainer();
  const [history, count] = await Promise.all([registryImports.listImports(), registryImports.countRegistry()]);

  return (
    <>
      <PageHeader title={t("title")} description={t("description", { count })} />
      <div className="grid gap-6">
        <RegistryImportPanel />
        <Card>
          <CardHeader>
            <CardTitle>{t("historyTitle")}</CardTitle>
            <CardDescription>{t("historyDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("history.file")}</TableHead>
                    <TableHead>{t("history.date")}</TableHead>
                    <TableHead>{t("history.status")}</TableHead>
                    <TableHead className="text-right">{t("stats.total")}</TableHead>
                    <TableHead className="text-right">{t("history.inserted")}</TableHead>
                    <TableHead className="text-right">{t("history.updated")}</TableHead>
                    <TableHead className="text-right">{t("stats.duplicate")}</TableHead>
                    <TableHead className="text-right">{t("stats.invalid")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-6 text-center text-muted-foreground">{t("historyEmpty")}</TableCell>
                    </TableRow>
                  ) : (
                    history.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="max-w-56 truncate font-medium">{h.fileName}</TableCell>
                        <TableCell className="text-muted-foreground">{format.dateTime(h.createdAt, { dateStyle: "medium", timeStyle: "short" })}</TableCell>
                        <TableCell>
                          <StatusBadge tone={TONE[h.status] ?? "neutral"}>{t(`importStatus.${h.status}`)}</StatusBadge>
                        </TableCell>
                        <TableCell className="text-right">{h.total}</TableCell>
                        <TableCell className="text-right">{h.inserted}</TableCell>
                        <TableCell className="text-right">{h.updated}</TableCell>
                        <TableCell className="text-right">{h.duplicate}</TableCell>
                        <TableCell className="text-right">{h.invalid}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
