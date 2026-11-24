import { ClipboardList, FileSpreadsheet, ShieldAlert, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { getContainer } from "@/lib/container";

export default async function AdminDashboardPage() {
  const t = await getTranslations("Admin.dashboard");
  const { students, registrationRequests, accounts, registryImports } = await getContainer();
  const [studentCount, byStatus, locked, registryCount, latest] = await Promise.all([
    students.count(),
    registrationRequests.countByStatus(),
    accounts.countByStatus("locked"),
    registryImports.countRegistry(),
    registrationRequests.list({ status: "pending_admin", page: 1, pageSize: 5 }),
  ]);

  const stats = [
    { key: "students", value: studentCount, icon: Users, href: `${ROUTES.admin}/etudiants` },
    { key: "pending", value: byStatus.pending_admin, icon: ClipboardList, href: `${ROUTES.admin}/demandes` },
    { key: "registry", value: registryCount, icon: FileSpreadsheet, href: `${ROUTES.admin}/registre` },
    { key: "locked", value: locked, icon: ShieldAlert, href: `${ROUTES.admin}/comptes?status=locked` },
  ] as const;

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ key, value, icon: Icon, href }) => (
          <Link key={key} href={href} className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardDescription>{t(`stats.${key}`)}</CardDescription>
                <Icon className="size-4 text-primary" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight">{value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("latestTitle")}</CardTitle>
          <CardDescription>{t("latestDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {latest.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noPending")}</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {latest.items.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span className="font-medium">
                    {r.lastName} {r.firstName}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{r.registrationNumber}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href={`${ROUTES.admin}/demandes`} className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
            {t("seeAll")}
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
