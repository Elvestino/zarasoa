import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

/** Filtres d'une liste : simple formulaire GET (l'état vit dans l'URL, donc partageable et sans JavaScript). */
export async function ListFilters({
  basePath,
  search,
  placeholder,
  children,
}: {
  basePath: string;
  search?: string;
  placeholder: string;
  children?: ReactNode;
}) {
  const t = await getTranslations("App");
  return (
    <form method="get" action={basePath} className="mb-4 flex flex-wrap items-end gap-2">
      <div className="min-w-48 flex-1 sm:max-w-xs">
        <Input type="search" name="q" defaultValue={search ?? ""} placeholder={placeholder} aria-label={placeholder} maxLength={80} />
      </div>
      {children}
      <Button type="submit">{t("search")}</Button>
      <Button variant="ghost" nativeButton={false} render={<Link href={basePath} />}>
        {t("reset")}
      </Button>
    </form>
  );
}
