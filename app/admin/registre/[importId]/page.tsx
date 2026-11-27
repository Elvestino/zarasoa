import { ArrowLeft } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge, type Tone } from "@/components/admin/StatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getContainer } from "@/lib/container";
import { ResumeImportButton } from "@/module/registry/presentation/components/ResumeImportButton";

const STATUS_TONE: Record<string, Tone> = { completed: "success", completed_with_errors: "warning", failed: "danger", processing: "info" };
const ROW_TONE: Record<string, Tone> = { duplicate: "warning", invalid: "danger", skipped: "neutral" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** US-018 : rapport d'un import — lignes lues, ajoutées, mises à jour, doublons, invalides, et chaque erreur avec son numéro de ligne. */
export default async function RegistryReportPage({ params }: { params: Promise<{ importId: string }> }) {
  const { importId } = await params;
  if (!UUID.test(importId)) notFound();

  const t = await getTranslations("Admin.registry");
  const format = await getFormatter();
  const { registryImports } = await getContainer();
  const report = await registryImports.getReport(importId);
  if (!report) notFound();

  const stats = [
    ["total", report.total, "neutral"],
    ["history.inserted", report.inserted, "success"],
    ["history.updated", report.updated, "neutral"],
    ["stats.duplicate", report.duplicate, "warning"],
    ["stats.invalid", report.invalid, "danger"],
    ["stats.warnings", report.warnings, "warning"],
  ] as const;
  const BAR: Record<string, string> = { neutral: "bg-muted-foreground/40", success: "bg-green-600", warning: "bg-secondary", danger: "bg-destructive" };

  return (
    <>
      <PageHeader
        title={t("report.title")}
        description={report.fileName}
        actions={
          <>
            {report.status === "failed" ? <ResumeImportButton importId={report.id} /> : null}
            <Button nativeButton={false} render={<Link href="/admin/registre" />} variant="outline" size="sm" className="cursor-pointer">
              <ArrowLeft data-icon="inline-start" />
              {t("report.back")}
            </Button>
          </>
        }
      />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={STATUS_TONE[report.status] ?? "neutral"}>{t(`importStatus.${report.status}`)}</StatusBadge>
              <CardDescription>
                {format.dateTime(report.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                {report.finishedAt ? ` → ${format.dateTime(report.finishedAt, { dateStyle: "medium", timeStyle: "short" })}` : ""}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {stats.map(([key, value, tone]) => (
                <div key={key} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{key === "total" ? t("stats.total") : t(key)}</p>
                  <p className="mt-1 text-xl font-semibold">{value}</p>
                  <span aria-hidden="true" className={`mt-1 block h-1 w-8 rounded-full ${BAR[tone]}`} />
                </div>
              ))}
            </div>
            {report.status === "failed" ? (
              <Alert variant="destructive">
                <AlertDescription>{t("report.failedNote", { inserted: report.inserted })}</AlertDescription>
              </Alert>
            ) : null}
            {report.excludedFields.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("report.excluded", { fields: report.excludedFields.map((f) => t(`fields.${f}`)).join(", ") })}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("report.issuesTitle")}</CardTitle>
            <CardDescription>{report.issuesTruncated ? t("report.issuesTruncated", { shown: report.issues.length }) : t("report.issuesHelp")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[32rem] overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead className="w-20">{t("row")}</TableHead>
                    <TableHead>{t("registration")}</TableHead>
                    <TableHead>{t("problem")}</TableHead>
                    <TableHead>{t("report.detail")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.issues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                        {t("report.noIssues")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.issues.map((i) => (
                      <TableRow key={i.rowNumber}>
                        <TableCell className="text-muted-foreground">{i.rowNumber}</TableCell>
                        <TableCell className="font-mono text-xs">{i.registrationNumber ?? "—"}</TableCell>
                        <TableCell>
                          <StatusBadge tone={ROW_TONE[i.status] ?? "warning"}>{i.errorCode ? t(`issues.${i.errorCode}`) : t(`report.rowStatus.${i.status}`)}</StatusBadge>
                        </TableCell>
                        <TableCell className="max-w-72 text-xs text-muted-foreground">{i.message ?? "—"}</TableCell>
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
