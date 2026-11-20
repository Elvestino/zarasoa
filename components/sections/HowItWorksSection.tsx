import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/sections/SectionHeading";

export function HowItWorksSection() {
  const t = useTranslations("How");
  const steps = t.raw("steps") as { title: string; desc: string }[];

  return (
    <section id="how" className="scroll-mt-16 bg-muted/60 px-4 py-24">
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading kicker={t("kicker")} title={t("title")} subtitle={t("subtitle")} />
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="relative rounded-2xl bg-card p-7 ring-1 ring-foreground/10">
              <span className="font-heading text-6xl leading-none font-bold text-secondary">{i + 1}</span>
              <h3 className="mt-5 font-heading text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              {i < steps.length - 1 ? (
                <ChevronRight aria-hidden="true" className="absolute top-1/2 right-[-1.1rem] hidden size-5 -translate-y-1/2 text-primary/40 md:block" />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
