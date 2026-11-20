import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}

/** En-tête commun des sections de la landing page. */
export function SectionHeading({ kicker, title, subtitle, align = "center" }: SectionHeadingProps) {
  const left = align === "left";
  return (
    <div className={cn("max-w-2xl", left ? "text-left" : "mx-auto mb-12 text-center")}>
      {kicker ? (
        <p className={cn("flex items-center gap-2 text-sm font-semibold text-primary", !left && "justify-center")}>
          <span aria-hidden="true" className="h-0.5 w-6 rounded-full bg-secondary" />
          {kicker}
        </p>
      ) : null}
      <h2 className="mt-3 font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-4 text-base leading-relaxed text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
