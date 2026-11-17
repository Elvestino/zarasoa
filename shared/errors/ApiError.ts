/** Erreur d'infrastructure : échec d'un appel HTTP (route API) ou d'un service distant (Supabase). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number = 500,
    readonly code: string = "API_ERROR",
  ) {
    super(message);
    this.name = "ApiError";
  }

  toJSON() {
    return { error: { code: this.code, message: this.message } };
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;
