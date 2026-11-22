import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Champ « souligné » du design : libellé minuscule au-dessus, simple ligne dessous. */
export function Field({
  id,
  label,
  hint,
  children,
  className = "",
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <label htmlFor={id} className="text-xs font-semibold text-foreground">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-[11px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function FieldInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={cn(
        "h-9 w-full border-0 border-b border-border bg-transparent px-0 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-0 disabled:opacity-50",
        className,
      )}
    />
  );
}

/** Bouton « pilule » principal (bleu). */
export function PillButton({ className = "", ...props }: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={`mx-auto mt-2 inline-flex h-11 w-full max-w-xs items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-md transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-60 ${className}`}
    />
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      {message}
    </p>
  );
}

export function Honeypot() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-[-9999px] top-auto h-px w-px overflow-hidden opacity-0">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
