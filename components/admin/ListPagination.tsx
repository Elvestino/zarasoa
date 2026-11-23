import { getTranslations } from "next-intl/server";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { totalPages } from "@/shared/domain/Page";

/** Pagination par liens (sans JavaScript) : conserve les filtres de l'URL et ne change que `page`. */
export async function ListPagination({
  basePath,
  params,
  page,
  total,
  pageSize,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  total: number;
  pageSize: number;
}) {
  const t = await getTranslations("App.pagination");
  const pages = totalPages({ total, pageSize });
  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") qs.set(k, v);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <p>{t("summary", { count: total, page, pages })}</p>
      {pages > 1 ? (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              {page > 1 ? <PaginationPrevious href={href(page - 1)} text={t("previous")} /> : null}
            </PaginationItem>
            <PaginationItem>
              {page < pages ? <PaginationNext href={href(page + 1)} text={t("next")} /> : null}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
