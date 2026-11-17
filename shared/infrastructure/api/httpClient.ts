import { ApiError } from "../../errors/ApiError";

interface ErrorBody {
  error?: { code?: string; message?: string };
}

/** Client HTTP JSON minimal pour appeler les routes `app/api/*` du projet. */
async function request<T>(method: "GET" | "POST", url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError("Impossible de joindre le serveur. Vérifiez votre connexion.", 0, "NETWORK_ERROR");
  }

  const payload = (await res.json().catch(() => null)) as (T & ErrorBody) | null;
  if (!res.ok) {
    throw new ApiError(
      payload?.error?.message ?? "Une erreur est survenue.",
      res.status,
      payload?.error?.code ?? "API_ERROR",
    );
  }
  return payload as T;
}

export const httpClient = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, body?: unknown) => request<T>("POST", url, body),
};
