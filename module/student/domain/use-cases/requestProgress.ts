import type { MyRegistrationRequest } from "../entities/RegistrationRequest";

export type StepKey = "submitted" | "email" | "review";
export type StepState = "done" | "current" | "pending" | "failed";

export interface ProgressStep {
  key: StepKey;
  state: StepState;
  /** Date à laquelle l'étape a été franchie (null tant qu'elle ne l'est pas). */
  at: Date | null;
}

/**
 * Les trois étapes de la demande d'inscription (US-011 à US-013) :
 * demande envoyée → e-mail confirmé → validation par l'administration (approuvée ou refusée).
 * Fonction pure : aucune dépendance à Supabase ni à l'interface.
 */
export function requestProgress(
  r: Pick<MyRegistrationRequest, "status" | "submittedAt" | "emailConfirmedAt" | "reviewedAt">,
): ProgressStep[] {
  const emailConfirmed = r.emailConfirmedAt !== null || r.status === "pending_admin" || r.status === "approved";

  const email: ProgressStep = emailConfirmed
    ? { key: "email", state: "done", at: r.emailConfirmedAt }
    : // Refusée avant la confirmation : l'étape n'a jamais été franchie, elle ne reste pas « en cours ».
      { key: "email", state: r.status === "pending_email" ? "current" : "pending", at: null };

  const review: ProgressStep =
    r.status === "approved"
      ? { key: "review", state: "done", at: r.reviewedAt }
      : r.status === "rejected"
        ? { key: "review", state: "failed", at: r.reviewedAt }
        : { key: "review", state: r.status === "pending_admin" ? "current" : "pending", at: null };

  return [{ key: "submitted", state: "done", at: r.submittedAt }, email, review];
}
