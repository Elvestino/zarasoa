import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/module/auth/presentation/components/RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("registerTitle") };
}

export default function Page() {
  return (
    <RegisterForm />
  );
}
