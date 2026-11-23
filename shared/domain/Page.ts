export const DEFAULT_PAGE_SIZE = 20;

/** Une page de résultats d'une liste paginée côté base. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const totalPages = (p: Pick<Page<unknown>, "total" | "pageSize">) => Math.max(1, Math.ceil(p.total / p.pageSize));

/** Entier de page lu dans l'URL (toujours >= 1). */
export function parsePage(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, 100000) : 1;
}

/** Résultat d'une Server Action : jamais d'exception vers le navigateur, seulement un code traduit à l'affichage. */
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; code: string };
