export const ACCOUNT_STATUSES = [
  "pending_email",
  "pending_admin",
  "approved",
  "rejected",
  "suspended",
  "locked", // bloqué après 5 échecs de connexion
  "deactivated",
] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export function isAccountStatus(value: string): value is AccountStatus {
  return (ACCOUNT_STATUSES as readonly string[]).includes(value);
}
