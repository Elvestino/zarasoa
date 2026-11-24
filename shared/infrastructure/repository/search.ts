/** Texte de recherche sûr pour un filtre PostgREST `.or(... ilike ...)` : retire les caractères de syntaxe. */
export function sanitizeSearch(raw: string | undefined | null): string {
  return (raw ?? "").replace(/[,()%*\\"':;]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

/** Plage `.range()` de Supabase pour une page (1-based). */
export const rangeFor = (page: number, pageSize: number): [number, number] => [(page - 1) * pageSize, page * pageSize - 1];
