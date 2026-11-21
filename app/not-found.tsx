import type { Metadata } from "next";
import { Home } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("notFoundTitle") };
}

/** Page 404 personnalisée : message clair, et des liens pour repartir (accueil, connexion, inscription). */
export default async function NotFound() {
  const t = await getTranslations("NotFound");
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-24 text-center">
      <p aria-hidden="true" className="font-heading text-8xl font-bold leading-none text-primary sm:text-9xl">
        404
      </p>
      <span aria-hidden="true" className="h-1.5 w-16 rounded-full bg-secondary" />
      <h1 className="font-heading text-2xl font-semibold sm:text-3xl">{t("title")}</h1>
      <p className="max-w-md text-base text-muted-foreground">{t("text")}</p>
      <p className="max-w-md text-sm text-muted-foreground">{t("hint")}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href={ROUTES.home}
          className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90")}
        >
          <Home aria-hidden="true" className="size-4" />
          {t("back")}
        </Link>
        <Link href={ROUTES.login} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-full px-6 text-sm font-semibold")}>
          {t("login")}
        </Link>
        <Link href={ROUTES.register} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-full px-6 text-sm font-semibold")}>
          {t("register")}
        </Link>
      </div>
    </section>
  );
}
