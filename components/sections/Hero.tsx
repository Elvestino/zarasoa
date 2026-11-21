import { ArrowRight, BookOpen, Check, ClipboardCheck, Clock, FileText, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LEVEL_CODES = ["L1", "L2", "L3", "M1", "M2"] as const;
const PREVIEW_ICONS = [BookOpen, FileText, ClipboardCheck];
const PREVIEW_PROGRESS = ["82%", "58%", "34%"];

export function Hero() {
  const t = useTranslations("Hero");
  const tc = useTranslations("Common");
  const tf = useTranslations("Features");
  const points = t.raw("points") as string[];
  const features = tf.raw("items") as { title: string }[];

  return (
    <section className="relative isolate overflow-hidden bg-hero text-white">
      {/* Décor : la vague du logo (même motif que les pages de connexion) */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden size-full lg:block" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M54 0C44 18 36 40 40 62C44 82 54 92 50 100H0V0Z" fill="#fff" fillOpacity="0.05" />
        <path d="M66 0C56 18 47 40 50 62C53 82 62 92 59 100H100V0Z" className="fill-brand-gold" />
        <path d="M67.2 0C57.2 18 48.2 40 51.2 62C54.2 82 63.2 92 60.2 100H100V0Z" className="fill-hero" />
      </svg>

      {/* Mode sombre : halos bleu et doré discrets pour donner du relief au fond nuit */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden dark:block"
        style={{
          backgroundImage:
            "radial-gradient(60% 50% at 85% 10%, rgb(68 102 255 / 0.22), transparent 70%), radial-gradient(45% 40% at 10% 90%, rgb(238 175 46 / 0.08), transparent 70%)",
        }}
      />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pb-28 pt-14 md:pt-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-sm font-medium text-white/90 ring-1 ring-white/20">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-secondary" />
            {t("badge")}
          </span>

          <h1 className="font-heading text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl xl:text-6xl">
            {t("titleLead")}
            <span className="mt-1 block text-brand-gold">{t("titleAccent")}</span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-white/80">{t("description")}</p>

          <div className="flex flex-wrap gap-3">
            <Link
              href={ROUTES.register}
              className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-full bg-secondary px-6 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90")}
            >
              {t("register")}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href={ROUTES.login}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-full border-white/40 bg-transparent px-6 text-sm font-semibold text-white hover:bg-white/10 hover:text-white dark:border-white/40 dark:bg-transparent dark:hover:bg-white/10")}
            >
              {t("login")}
            </Link>
          </div>

          <ul className="mt-2 space-y-2.5 text-sm text-white/80">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-brand-gold" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Aperçu de la plateforme : seul moment animé de la page (apparition des lignes au chargement). */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="rounded-3xl bg-card p-5 text-card-foreground shadow-2xl ring-1 ring-black/5 dark:shadow-black/50 dark:ring-white/15 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-navy dark:ring-1 dark:ring-white/20">
                <Image src="/assets/img/logo-light-icon.png" alt="" width={520} height={300} className="h-4 w-auto" />
              </span>
              <div>
                <p className="font-heading text-sm font-semibold">ZARASOA</p>
                <p className="text-xs text-muted-foreground">{tc("tagline")}</p>
              </div>
            </div>

            <ul className="space-y-3">
              {features.slice(0, 3).map((f, i) => {
                const Icon = PREVIEW_ICONS[i];
                return (
                  <li
                    key={f.title}
                    className="flex animate-in items-center gap-3 rounded-xl bg-muted p-3 duration-500 fade-in slide-in-from-bottom-3 motion-reduce:animate-none"
                    style={{ animationDelay: `${150 + i * 130}ms`, animationFillMode: "backwards" }}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{f.title}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                        <div className="h-full rounded-full bg-primary" style={{ width: PREVIEW_PROGRESS[i] }} />
                      </div>
                    </div>
                    {i === 2 ? <Clock className="size-4 shrink-0 text-gold-text" /> : <Check className="size-4 shrink-0 text-primary" />}
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {LEVEL_CODES.map((c) => (
                <span key={c} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {features[3] ? (
            <div className="absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground shadow-lg sm:flex">
              <ShieldCheck className="size-4" />
              {features[3].title}
            </div>
          ) : null}
        </div>
      </div>

      {/* Bord inférieur courbe vers la page */}
      <svg aria-hidden="true" className="absolute inset-x-0 bottom-0 h-10 w-full fill-background" viewBox="0 0 1440 64" preserveAspectRatio="none">
        <path d="M0 64V30C240 0 480 2 720 26S1200 58 1440 14V64Z" />
      </svg>
    </section>
  );
}
