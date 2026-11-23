import { getFormatter, getTranslations } from "next-intl/server";
import { ListFilters } from "@/components/admin/ListFilters";
import { ListPagination } from "@/components/admin/ListPagination";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge, accountTone } from "@/components/admin/StatusBadge";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROUTES } from "@/lib/constants";
import { getContainer } from "@/lib/container";
import { ACCOUNT_STATUSES } from "@/module/user/domain/value-object/AccountStatus";
import { ROLE_CODES } from "@/module/user/domain/value-object/Role";
import { UnlockAccountButton } from "@/module/user/presentation/components/UnlockAccountButton";
import { DEFAULT_PAGE_SIZE, parsePage } from "@/shared/domain/Page";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function AccountsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const t = await getTranslations("Admin.accounts");
  const ta = await getTranslations("App");
  const tr = await getTranslations("App.roles");
  const format = await getFormatter();
  const { accounts } = await getContainer();

  const q = one(sp.q);
  const status = (ACCOUNT_STATUSES as readonly string[]).includes(one(sp.status) ?? "") ? one(sp.status) : undefined;
  const role = (ROLE_CODES as readonly string[]).includes(one(sp.role) ?? "") ? one(sp.role) : undefined;
  const list = await accounts.list({ search: q, status, role, page: parsePage(sp.page), pageSize: DEFAULT_PAGE_SIZE });
  const base = `${ROUTES.admin}/comptes`;

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <ListFilters basePath={base} search={q} placeholder={t("searchPlaceholder")}>
        <div className="w-48">
          <NativeSelect name="status" defaultValue={status ?? ""} aria-label={t("columns.status")}>
            <NativeSelectOption value="">{t("allStatuses")}</NativeSelectOption>
            {ACCOUNT_STATUSES.map((s) => (
              <NativeSelectOption key={s} value={s}>{t(`status.${s}`)}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="w-44">
          <NativeSelect name="role" defaultValue={role ?? ""} aria-label={t("columns.roles")}>
            <NativeSelectOption value="">{t("allRoles")}</NativeSelectOption>
            {ROLE_CODES.map((r) => (
              <NativeSelectOption key={r} value={r}>{tr(r)}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </ListFilters>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("columns.email")}</TableHead>
              <TableHead>{t("columns.roles")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead className="hidden xl:table-cell">{t("columns.lastSeen")}</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">{ta("empty")}</TableCell>
              </TableRow>
            ) : (
              list.items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.lastName} {a.firstName}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{a.email}</TableCell>
                  <TableCell>{a.roles.length ? a.roles.map((r) => tr(r)).join(", ") : "—"}</TableCell>
                  <TableCell>
                    <StatusBadge tone={accountTone(a.accountStatus)}>{t(`status.${a.accountStatus}`)}</StatusBadge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground xl:table-cell">
                    {a.lastSeenAt ? format.dateTime(a.lastSeenAt, { dateStyle: "medium" }) : "—"}
                  </TableCell>
                  <TableCell>
                    {a.accountStatus === "locked" ? <UnlockAccountButton userId={a.id} name={`${a.firstName} ${a.lastName}`} /> : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <ListPagination basePath={base} params={{ q, status, role }} page={list.page} total={list.total} pageSize={list.pageSize} />
    </>
  );
}
