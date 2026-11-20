import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/module/auth/presentation/components/ResetPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("resetTitle") };
}

export default function Page() {
  return (
    <ResetPasswordForm />
  );
}
