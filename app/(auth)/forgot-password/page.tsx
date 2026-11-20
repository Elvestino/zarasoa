import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/module/auth/presentation/components/ForgotPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("forgotTitle") };
}

export default function Page() {
  return (
    <ForgotPasswordForm />
  );
}
