import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { CONTACT_EMAIL } from "@/lib/site";

interface LegalSection {
  title: string;
  paragraphs: string[];
}

/** Page de texte légal (politique de confidentialité ou conditions d'utilisation), contenu dans messages/*.json (Legal). */
export async function LegalPage({ doc }: { doc: "privacy" | "terms" }) {
  const t = await getTranslations("Legal");
  const title = doc === "privacy" ? t("privacy.title") : t("terms.title");
  const intro = doc === "privacy" ? t("privacy.intro") : t("terms.intro");
  const sections = (doc === "privacy" ? t.raw("privacy.sections") : t.raw("terms.sections")) as LegalSection[];
  const other = doc === "privacy" ? { href: ROUTES.terms, label: t("terms.title") } : { href: ROUTES.privacy, label: t("privacy.title") };

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-sm text-muted-foreground">{t("updated")}</p>
      <h1 className="mt-2 font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">{intro}</p>

      <div className="mt-10 space-y-9">
        {sections.map((section, i) => (
          <section key={section.title} aria-labelledby={`legal-${i}`}>
            <h2 id={`legal-${i}`} className="font-heading text-xl font-semibold">
              {i + 1}. {section.title}
            </h2>
            <div className="mt-3 space-y-3 text-[0.95rem] leading-relaxed">
              {section.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-muted p-5 text-sm">
        {CONTACT_EMAIL ? (
          <p>
            <span className="font-semibold">{t("contactLead")}</span>{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
          </p>
        ) : (
          <p>{t("contactFallback")}</p>
        )}
      </div>

      <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
        <Link href={other.href} className="text-primary underline-offset-4 hover:underline">
          {other.label}
        </Link>
        <Link href={ROUTES.home} className="text-primary underline-offset-4 hover:underline">
          {t("backHome")}
        </Link>
      </nav>
    </article>
  );
}
