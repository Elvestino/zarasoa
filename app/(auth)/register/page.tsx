import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";
import { RegisterForm } from "@/module/auth/presentation/components/RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return pageMetadata({ title: t("registerTitle"), description: t("registerDescription"), path: ROUTES.register });
}

export default function Page() {
  return (
    <RegisterForm />
  );
}
