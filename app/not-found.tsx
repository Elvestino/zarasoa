import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";

export default async function NotFound() {
  const t = await getTranslations("NotFound");
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{t("text")}</p>
      <Link
        href={ROUTES.home}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:brightness-110"
      >
        {t("back")}
      </Link>
    </div>
  );
}
