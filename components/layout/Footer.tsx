
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { CookieSettingsButton } from "@/components/layout/CookieSettingsButton";
import { ROUTES } from "@/lib/constants";

// Courbe du bord supérieur : un liseré doré, puis le fond du pied de page décalé de 12 unités vers le bas.
const WAVE = "M0 84C240 112 480 100 720 58S1200 6 1440 10V120H0Z";

const linkClass = "text-sm text-white/70 underline-offset-4 transition-colors hover:text-brand-gold hover:underline";

export function Footer() {
  const t = useTranslations("Footer");
  const th = useTranslations("Header");
  const tc = useTranslations("Common");
  const tf = useTranslations("Features");
  const tl = useTranslations("Levels");
  const features = tf.raw("items") as { title: string }[];

  const discover = [
    { href: "/#features", label: th("features") },
    { href: "/#how", label: th("how") },
    { href: "/#roles", label: th("roles") },
  ];
  const space = [
    { href: ROUTES.login, label: th("login") },
    { href: ROUTES.register, label: t("registerStudent") },
  ];
  // Faits clés du projet, repris des textes de la landing page (donc déjà traduits).
  const facts = [tl("title"),features[1]?.title ,features[4]?.title, features[5]?.title].filter((f): f is string => Boolean(f));

  return (
    <footer className="relative mt-8">
      <svg aria-hidden="true" className="block h-14 w-full sm:h-24" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path d={WAVE} className="fill-brand-gold" />
        <path d={WAVE} transform="translate(0 12)" className="fill-brand-navy dark:fill-card" />
      </svg>

      <div className="-mt-px bg-brand-navy text-white dark:bg-card">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-10 pt-2 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href={ROUTES.home} aria-label="ZARASOA">
              <Image src="/assets/img/logo-light-wordmark.png" alt="ZARASOA" width={620} height={138} className="h-auto w-44" />
            </Link>
            <p className="mt-3 text-sm font-medium text-brand-gold">{tc("tagline")}</p>
            <p className="mt-4 text-sm leading-relaxed text-white/70">{t("about")}</p>
          </div>

          <nav aria-label={t("discover")}>
            <h2 className="font-heading text-base font-semibold">{t("discover")}</h2>
            <ul className="mt-4 space-y-3">
              {discover.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t("space")}>
            <h2 className="font-heading text-base font-semibold">{t("space")}</h2>
            <ul className="mt-4 space-y-3">
              {space.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-heading text-base font-semibold">{t("project")}</h2>
            <ul className="mt-4 space-y-3">
              {facts.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                  <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-gold" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>


        <div className="border-t border-white/10 px-4 py-5 text-sm text-white/70">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
            <p>{t("text")}</p>
            <nav aria-label={t("legal")} className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link href={ROUTES.privacy} className={linkClass}>
                {t("privacy")}
              </Link>
              <Link href={ROUTES.terms} className={linkClass}>
                {t("terms")}
              </Link>
              <CookieSettingsButton className={linkClass} />
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
