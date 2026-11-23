import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { getContainer } from "@/lib/container";
import { CatalogManager } from "@/module/catalog/presentation/components/CatalogManager";

export default async function CatalogPage() {
  const t = await getTranslations("Admin.catalog");
  const { filieres } = await getContainer();
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <CatalogManager filieres={await filieres.findAllWithParcours()} />
    </>
  );
}
