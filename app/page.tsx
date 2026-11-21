import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CtaSection } from "@/components/sections/CtaSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { Hero } from "@/components/sections/Hero";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { LevelsSection } from "@/components/sections/LevelsSection";
import { RolesSection } from "@/components/sections/RolesSection";
import { ROUTES } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  const base = await pageMetadata({ title: t("homeTitle"), description: t("description"), path: ROUTES.home });
  // Page d'accueil : le titre complet est déjà « ZARASOA — … », on évite le suffixe en double.
  return { ...base, title: { absolute: t("homeTitle") }, openGraph: { ...base.openGraph, title: t("homeTitle") }, twitter: { ...base.twitter, title: t("homeTitle") } };
}

/** Landing page : accueil public (la session et la langue sont gérées par le layout et le proxy). */
export default function Home() {
  return (
    <>
      <Hero />
      <FeaturesSection />
      <HowItWorksSection />
      <RolesSection />
      <LevelsSection />
      <CtaSection />
    </>
  );
}
