import type { RoleCode } from "../value-object/Role";

export interface AccountSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  pseudo: string | null;
  accountStatus: string;
  failedLoginCount: number;
  lockedAt: Date | null;
  deletedAt: Date | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  roles: RoleCode[];
}

export interface AccountFilters {
  search?: string;
  status?: string;
  role?: string;
  page: number;
  pageSize: number;
}
