import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";
import { ForgotPasswordForm } from "@/module/auth/presentation/components/ForgotPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return pageMetadata({ title: t("forgotTitle"), description: t("forgotDescription"), path: ROUTES.forgotPassword });
}

export default function Page() {
  return (
    <ForgotPasswordForm />
  );
}
