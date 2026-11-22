import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";
import { ResetPasswordForm } from "@/module/auth/presentation/components/ResetPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return pageMetadata({ title: t("resetTitle"), description: t("resetDescription"), path: ROUTES.resetPassword, noindex: true });
}

export default function Page() {
  return (
    <ResetPasswordForm />
  );
}
