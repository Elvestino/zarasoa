import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { ROUTES } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return pageMetadata({ title: t("Legal.privacy.title"), description: t("Metadata.privacyDescription"), path: ROUTES.privacy });
}

export default function Page() {
  return <LegalPage doc="privacy" />;
}
