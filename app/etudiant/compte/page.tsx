import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireRole } from "@/module/user/infrastructure/server/guards";
import { AccountPanel } from "@/module/user/presentation/components/AccountPanel";

export default async function StudentAccountPage() {
  const profile = await requireRole("student");
  const t = await getTranslations("Account");
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <AccountPanel
        email={profile.email}
        firstName={profile.firstName}
        lastName={profile.lastName}
        pseudo={profile.pseudo}
        phoneNumber={profile.phoneNumber}
        preferredLocale={profile.preferredLocale}
      />
    </>
  );
}
