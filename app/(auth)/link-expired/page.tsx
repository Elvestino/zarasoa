import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";
import { LinkExpired } from "@/module/auth/presentation/components/LinkExpired";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return pageMetadata({ title: t("expiredTitle"), description: t("expiredDescription"), path: ROUTES.linkExpired, noindex: true });
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Page d'arrivée quand un lien e-mail (réinitialisation, confirmation) ou la session de réinitialisation a expiré. */
export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const { type } = await searchParams;
  return <LinkExpired kind={type === "signup" ? "signup" : "recovery"} />;
}
