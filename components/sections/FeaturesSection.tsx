import { BookOpen, ClipboardCheck, FileText, Languages, ShieldCheck, UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/sections/SectionHeading";

const ICONS = [BookOpen, FileText, ClipboardCheck, ShieldCheck, UserCheck, Languages];

export function FeaturesSection() {
  const t = useTranslations("Features");
  const items = t.raw("items") as { title: string; desc: string }[];

  return (
    <section id="features" className="scroll-mt-16 px-4 py-24">
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHeading align="left" kicker={t("kicker")} title={t("title")} subtitle={t("subtitle")} />
        </div>

        <ul className="divide-y divide-border border-y border-border">
          {items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <li key={item.title} className="group flex gap-5 py-6">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
