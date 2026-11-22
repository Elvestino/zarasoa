import type { Metadata } from "next";
import { ArrowRight, BookOpen, ClipboardCheck, Compass, Home, SearchX, UserPlus, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("notFoundTitle") };
}

/**
 * Page 404 : même univers que le Hero (fond bleu du logo, vague dorée, halos en mode sombre, carte d'aperçu),
 * avec des raccourcis pour repartir vers les parties du site.
 */
export default async function NotFound() {
  const t = await getTranslations("NotFound");
  const th = await getTranslations("Header");
  const tf = await getTranslations("Footer");
  const tc = await getTranslations("Common");

  const shortcuts = [
    { href: "/#features", label: th("features"), Icon: BookOpen },
    { href: "/#how", label: th("how"), Icon: ClipboardCheck },
    { href: "/#roles", label: th("roles"), Icon: Users },
    { href: ROUTES.register, label: tf("registerStudent"), Icon: UserPlus },
  ];

  return (
    <section className="relative isolate flex flex-1 overflow-hidden bg-hero text-white">
      {/* Décor : la vague du logo (même motif que le Hero) */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden size-full lg:block" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M54 0C44 18 36 40 40 62C44 82 54 92 50 100H0V0Z" fill="#fff" fillOpacity="0.05" />
        <path d="M66 0C56 18 47 40 50 62C53 82 62 92 59 100H100V0Z" className="fill-brand-gold" />
        <path d="M67.2 0C57.2 18 48.2 40 51.2 62C54.2 82 63.2 92 60.2 100H100V0Z" className="fill-hero" />
      </svg>

      {/* Mode sombre : halos bleu et doré discrets */}
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

          <p aria-hidden="true" className="font-heading text-8xl font-bold leading-none tracking-tight sm:text-9xl">
            4<span className="text-brand-gold">0</span>4
          </p>
          <span aria-hidden="true" className="-mt-2 h-1.5 w-20 rounded-full bg-secondary" />

          <h1 className="font-heading text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl xl:text-5xl">{t("title")}</h1>
          <p className="max-w-xl text-lg leading-relaxed text-white/80">{t("text")}</p>

          <div className="flex flex-wrap gap-3">
            <Link
              href={ROUTES.home}
              className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-full bg-secondary px-6 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90")}
            >
              <Home aria-hidden="true" className="size-4" />
              {t("back")}
            </Link>
            <Link
              href={ROUTES.login}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-full border-white/40 bg-transparent px-6 text-sm font-semibold text-white hover:bg-white/10 hover:text-white dark:border-white/40 dark:bg-transparent dark:hover:bg-white/10")}
            >
              {t("login")}
            </Link>
          </div>
        </div>

        {/* Carte « page perdue » : fenêtre de navigateur et raccourcis, comme l'aperçu du Hero */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="overflow-hidden rounded-3xl bg-card text-card-foreground shadow-2xl ring-1 ring-black/5 dark:shadow-black/50 dark:ring-white/15">
            <div className="flex items-center gap-3 border-b border-border bg-muted px-4 py-3">
              <span aria-hidden="true" className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-destructive/60" />
                <span className="size-2.5 rounded-full bg-secondary" />
                <span className="size-2.5 rounded-full bg-primary/50" />
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-background px-3 py-1 text-xs text-muted-foreground">
                <SearchX aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="truncate">zarasoa / 404</span>
              </span>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-brand-navy dark:ring-1 dark:ring-white/20">
                  <Image src="/assets/img/logo-light-icon.png" alt="" width={520} height={300} className="h-4 w-auto" />
                </span>
                <div>
                  <p className="font-heading text-sm font-semibold">ZARASOA</p>
                  <p className="text-xs text-muted-foreground">{t("help")}</p>
                </div>
              </div>

              <ul className="space-y-2.5">
                {shortcuts.map(({ href, label, Icon }, i) => (
                  <li
                    key={href}
                    className="animate-in duration-500 fade-in slide-in-from-bottom-3 motion-reduce:animate-none"
                    style={{ animationDelay: `${150 + i * 110}ms`, animationFillMode: "backwards" }}
                  >
                    <Link
                      href={href}
                      className="group flex items-center gap-3 rounded-xl bg-muted p-3 text-sm font-medium transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon aria-hidden="true" className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground shadow-lg sm:flex">
            <Compass aria-hidden="true" className="size-4" />
            {tc("tagline")}
          </div>
        </div>
      </div>

      {/* Bord inférieur courbe vers le pied de page */}
      <svg aria-hidden="true" className="absolute inset-x-0 bottom-0 h-10 w-full fill-background" viewBox="0 0 1440 64" preserveAspectRatio="none">
        <path d="M0 64V30C240 0 480 2 720 26S1200 58 1440 14V64Z" />
      </svg>
    </section>
  );
}
