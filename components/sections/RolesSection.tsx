import { Check, GraduationCap, Presentation, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { cn } from "@/lib/utils";

const ICONS = [GraduationCap, Presentation, ShieldCheck];

export function RolesSection() {
  const t = useTranslations("Roles");
  const items = t.raw("items") as { title: string; points: string[] }[];

  return (
    <section id="roles" className="scroll-mt-16 px-4 py-24">
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading kicker={t("kicker")} title={t("title")} subtitle={t("subtitle")} />
        {/* Le nombre de colonnes suit le nombre de rôles définis dans messages/*.json */}
        <div className={cn("grid gap-5", items.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
          {items.map((role, i) => {
            const Icon = ICONS[i % ICONS.length];
            const featured = i === 0;
            return (
              <article
                key={role.title}
                className={cn("rounded-3xl p-8", featured ? "bg-brand-navy text-white shadow-xl" : "bg-card ring-1 ring-foreground/10")}
              >
                <div className="mb-6 flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full",
                      featured ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <h3 className="font-heading text-xl font-semibold">{role.title}</h3>
                </div>
                <ul className={cn("space-y-3.5 text-sm", featured ? "text-white/85" : "text-muted-foreground")}>
                  {role.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5">
                      <Check className={cn("mt-0.5 size-4 shrink-0", featured ? "text-brand-gold" : "text-primary")} />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
