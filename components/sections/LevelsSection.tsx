import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const LEVEL_CODES = ["L1", "L2", "L3", "M1", "M2"] as const;
// Les marches montent de la Licence 1 au Master 2 : la hauteur illustre la progression.
const STEP_HEIGHTS = ["h-24", "h-32", "h-40", "h-48", "h-56"];

export function LevelsSection() {
  const t = useTranslations("Levels");
  const names = t.raw("names") as string[];

  return (
    <section className="bg-muted/60 px-4 py-24">
      <div className="mx-auto grid w-full max-w-6xl items-end gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="max-w-md">
          <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{t("title")}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t("subtitle")}</p>
        </div>

        <ol className="flex items-end gap-2 sm:gap-3">
          {LEVEL_CODES.map((code, i) => {
            const last = i === LEVEL_CODES.length - 1;
            return (
              <li
                key={code}
                className={cn(
                  "flex flex-1 flex-col justify-between rounded-t-2xl px-2 py-3 sm:px-4 sm:py-4",
                  STEP_HEIGHTS[i],
                  last ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground",
                )}
              >
                <span className="font-heading text-xl font-bold sm:text-2xl">{code}</span>
                <span className="text-[11px] leading-tight font-medium sm:text-sm">{names[i]}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
