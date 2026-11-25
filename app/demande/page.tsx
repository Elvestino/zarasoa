import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { getContainer } from "@/lib/container";
import { RequestTracker } from "@/module/student/presentation/components/RequestTracker";
import { getSessionProfile } from "@/module/user/infrastructure/server/guards";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Request");
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

// Dépend de la session : jamais mise en cache.
export const dynamic = "force-dynamic";

/**
 * US-013 : suivi de la demande d'inscription de l'étudiant (attente e-mail, attente administration, approuvée, refusée + motif).
 * Cette page ne donne accès qu'à SA demande (la RLS limite la lecture à `user_id = auth.uid()`) ; aucun espace n'est ouvert
 * tant que le compte n'est pas approuvé.
 */
export default async function RequestPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect(ROUTES.login);

  const { registrationRequests } = await getContainer();
  const request = await registrationRequests.findMine(profile.id);
  // Sans demande (administrateur, professeur…) ou compte bloqué/désactivé : /auth/continue aiguille ou ferme la session.
  if (!request || profile.deletedAt || ["locked", "suspended", "deactivated"].includes(profile.accountStatus)) {
    redirect(ROUTES.continue);
  }

  const t = await getTranslations("Request");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:py-12">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-primary">{t("greeting", { name: request.firstName })}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </header>
      <RequestTracker request={request} />
    </div>
  );
}
