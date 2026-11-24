import { getFormatter, getTranslations } from "next-intl/server";
import { ListFilters } from "@/components/admin/ListFilters";
import { ListPagination } from "@/components/admin/ListPagination";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge, accountTone } from "@/components/admin/StatusBadge";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROUTES } from "@/lib/constants";
import { getContainer } from "@/lib/container";
import { DEFAULT_PAGE_SIZE, parsePage } from "@/shared/domain/Page";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function StudentsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const t = await getTranslations("Admin.students");
  const ta = await getTranslations("App");
  const tAcc = await getTranslations("Admin.accounts.status");
  const format = await getFormatter();
  const { students, filieres, academicLevels } = await getContainer();

  const q = one(sp.q);
  const filiere = one(sp.filiere);
  const level = one(sp.niveau);
  const page = parsePage(sp.page);
  const [list, allFilieres, levels] = await Promise.all([
    students.list({ search: q, filiereId: filiere, levelId: level, page, pageSize: DEFAULT_PAGE_SIZE }),
    filieres.findAllWithParcours(),
    academicLevels.findAll(),
  ]);
  const base = `${ROUTES.admin}/etudiants`;

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <ListFilters basePath={base} search={q} placeholder={t("searchPlaceholder")}>
        <div className="w-44">
          <NativeSelect name="filiere" defaultValue={filiere ?? ""} aria-label={t("columns.filiere")}>
            <NativeSelectOption value="">{t("allFilieres")}</NativeSelectOption>
            {allFilieres.map((f) => (
              <NativeSelectOption key={f.id} value={f.id}>{f.name}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="w-36">
          <NativeSelect name="niveau" defaultValue={level ?? ""} aria-label={t("columns.level")}>
            <NativeSelectOption value="">{t("allLevels")}</NativeSelectOption>
            {levels.map((l) => (
              <NativeSelectOption key={l.id} value={l.id}>{l.label}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </ListFilters>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.registration")}</TableHead>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("columns.email")}</TableHead>
              <TableHead>{t("columns.filiere")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("columns.parcours")}</TableHead>
              <TableHead>{t("columns.level")}</TableHead>
              <TableHead className="hidden xl:table-cell">{t("columns.approvedAt")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">{ta("empty")}</TableCell>
              </TableRow>
            ) : (
              list.items.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.registrationNumber}</TableCell>
                  <TableCell className="font-medium">{s.lastName} {s.firstName}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{s.email}</TableCell>
                  <TableCell>{s.filiere.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{s.parcours?.name ?? "—"}</TableCell>
                  <TableCell>{s.level.code}</TableCell>
                  <TableCell className="hidden text-muted-foreground xl:table-cell">{format.dateTime(s.approvedAt, { dateStyle: "medium" })}</TableCell>
                  <TableCell>
                    <StatusBadge tone={accountTone(s.accountStatus)}>{tAcc(s.accountStatus)}</StatusBadge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <ListPagination basePath={base} params={{ q, filiere, niveau: level }} page={list.page} total={list.total} pageSize={list.pageSize} />
    </>
  );
}
