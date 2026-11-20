import { CtaSection } from "@/components/sections/CtaSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { Hero } from "@/components/sections/Hero";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { LevelsSection } from "@/components/sections/LevelsSection";
import { RolesSection } from "@/components/sections/RolesSection";

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
