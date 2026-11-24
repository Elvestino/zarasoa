import { getFormatter, getTranslations } from "next-intl/server";
import { ListFilters } from "@/components/admin/ListFilters";
import { ListPagination } from "@/components/admin/ListPagination";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROUTES } from "@/lib/constants";
import { getContainer } from "@/lib/container";
import { REQUEST_STATUSES, type RequestStatus } from "@/module/student/domain/entities/RegistrationRequest";
import { CheckAllButton } from "@/module/student/presentation/components/CheckAllButton";
import { MATCH_TONE, RequestReviewDialog } from "@/module/student/presentation/components/RequestReviewDialog";
import { DEFAULT_PAGE_SIZE, parsePage } from "@/shared/domain/Page";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const STATUS_TONE = { pending_email: "warning", pending_admin: "info", approved: "success", rejected: "danger" } as const;

export default async function RequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const t = await getTranslations("Admin.requests");
  const ta = await getTranslations("App");
  const format = await getFormatter();
  const { registrationRequests, filieres, academicLevels } = await getContainer();

  const rawStatus = one(sp.status);
  // Par défaut : les demandes à traiter. « all » = toutes.
  const status: RequestStatus | undefined =
    rawStatus === "all" ? undefined : (REQUEST_STATUSES as readonly string[]).includes(rawStatus ?? "") ? (rawStatus as RequestStatus) : "pending_admin";
  const q = one(sp.q);
  const page = parsePage(sp.page);

  const [list, counts, allFilieres, levels] = await Promise.all([
    registrationRequests.list({ status, search: q, page, pageSize: DEFAULT_PAGE_SIZE }),
    registrationRequests.countByStatus(),
    filieres.findAllWithParcours(),
    academicLevels.findAll(),
  ]);
  const base = `${ROUTES.admin}/demandes`;
  const current = status ?? "all";

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} actions={<CheckAllButton />} />
      <ListFilters basePath={base} search={q} placeholder={t("searchPlaceholder")}>
        <div className="w-56">
          <NativeSelect name="status" defaultValue={current} aria-label={t("columns.status")}>
            <NativeSelectOption value="all">{t("allStatuses")}</NativeSelectOption>
            {REQUEST_STATUSES.map((s) => (
              <NativeSelectOption key={s} value={s}>{t(`status.${s}`)} ({counts[s]})</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </ListFilters>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.applicant")}</TableHead>
              <TableHead>{t("matricule")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("columns.email")}</TableHead>
              <TableHead>{t("columns.registry")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead className="hidden xl:table-cell">{t("columns.submittedAt")}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">{ta("empty")}</TableCell>
              </TableRow>
            ) : (
              list.items.map((r) => {
                const match = r.matchStatus ?? "unchecked";
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.lastName} {r.firstName}</TableCell>
                    <TableCell className="font-mono text-xs">{r.registrationNumber}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{r.email}</TableCell>
                    <TableCell>
                      <StatusBadge tone={MATCH_TONE[match] ?? "neutral"}>{t(`match.${match}`)}</StatusBadge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={STATUS_TONE[r.status]}>{t(`status.${r.status}`)}</StatusBadge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground xl:table-cell">{format.dateTime(r.submittedAt, { dateStyle: "medium" })}</TableCell>
                    <TableCell>
                      <RequestReviewDialog request={r} filieres={allFilieres} levels={levels} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <ListPagination basePath={base} params={{ q, status: rawStatus }} page={list.page} total={list.total} pageSize={list.pageSize} />
    </>
  );
}
