import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CtaSection() {
  const t = useTranslations("Cta");

  return (
    <section id="join" className="scroll-mt-16 px-4 py-24">
      <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl bg-brand-navy px-6 py-16 text-center text-white shadow-2xl sm:px-12">
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 0H30C22 25 18 60 24 100H0Z" fill="#fff" fillOpacity="0.06" />
          <path d="M100 55C92 66 88 84 90 100H100Z" className="fill-brand-gold" />
        </svg>
        <div className="relative">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/80">{t("text")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={ROUTES.register}
              className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-full bg-secondary px-6 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90")}
            >
              {t("register")}
            </Link>
            <Link
              href={ROUTES.login}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-full border-white/40 bg-transparent px-6 text-sm font-semibold text-white hover:bg-white/10 hover:text-white dark:border-white/40 dark:bg-transparent dark:hover:bg-white/10")}
            >
              {t("login")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
