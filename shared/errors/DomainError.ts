/** Erreur métier : une règle du domaine n'est pas respectée (donnée invalide, état interdit…). */
export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string = "DOMAIN_ERROR",
  ) {
    super(message);
    this.name = "DomainError";
  }
}
