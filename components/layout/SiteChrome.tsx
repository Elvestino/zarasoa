"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { PROTECTED_PREFIXES } from "@/lib/constants";

/**
 * Pages publiques : en-tête + pied de page du site.
 * Espaces connectés (/admin, /etudiant, /professeur) : ils ont leur propre coque (sidebar), sans en-tête ni pied de page publics.
 */
export function SiteChrome({ header, footer, children }: { header: ReactNode; footer: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const inApp = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (inApp) return <div className="flex flex-1 flex-col">{children}</div>;

  return (
    <>
      {header}
      <main id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {children}
      </main>
      {footer}
    </>
  );
}
