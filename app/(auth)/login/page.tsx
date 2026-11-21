import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";
import { Suspense } from "react";
import { LoginForm } from "@/module/auth/presentation/components/LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return pageMetadata({ title: t("loginTitle"), description: t("loginDescription"), path: ROUTES.login });
}

export default function Page() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
