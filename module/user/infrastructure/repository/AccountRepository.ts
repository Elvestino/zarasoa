import { ApiError } from "@/shared/errors/ApiError";
import type { Page } from "@/shared/domain/Page";
import { BaseRepository, type Db } from "@/shared/infrastructure/repository/BaseRepository";
import { rangeFor, sanitizeSearch } from "@/shared/infrastructure/repository/search";
import type { AccountFilters, AccountSummary } from "../../domain/entities/Account";
import { isRoleCode, type ManageableRole } from "../../domain/value-object/Role";

/** Codes métier levés par les fonctions SQL (`hint`) : ils deviennent des messages côté interface. */
const SQL_HINT_CODES = new Set([
  "REASON_REQUIRED",
  "ACCOUNT_NOT_FOUND",
  "ACCOUNT_DELETED",
  "ACCOUNT_NOT_DEACTIVATED",
  "ACCOUNT_NOT_APPROVED",
  "ACCOUNT_NOT_SUSPENDED",
  "SELF_ACTION_FORBIDDEN",
  "ROLE_NOT_MANAGEABLE",
  "ROLE_ALREADY_ASSIGNED",
  "ROLE_NOT_ASSIGNED",
]);

function rpcFailure(error: { code?: string; hint?: string | null }, fallback: string): ApiError {
  if (error.code === "42501") return new ApiError("Accès refusé.", 403, "FORBIDDEN");
  const hint = error.hint ?? "";
  return new ApiError(hint || fallback, 409, SQL_HINT_CODES.has(hint) ? hint : fallback);
}

interface AccountRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  pseudo: string | null;
  account_status: string;
  failed_login_count: number;
  locked_at: string | null;
  deleted_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  roles: string[] | null;
}

/** Comptes vus par le super administrateur (vue `v_accounts`) + actions d'administration via des fonctions SQL contrôlées. */
export class AccountRepository extends BaseRepository {
  constructor(db: Db) {
    super(db);
  }

  async list(filters: AccountFilters): Promise<Page<AccountSummary>> {
    let query = this.db.from("v_accounts").select("*", { count: "exact" });
    const q = sanitizeSearch(filters.search);
    if (q) query = query.or(`last_name.ilike.%${q}%,first_name.ilike.%${q}%,email.ilike.%${q}%`);
    if (filters.status) query = query.eq("account_status", filters.status);
    if (filters.role && isRoleCode(filters.role)) query = query.contains("roles", [filters.role]);

    const [from, to] = rangeFor(filters.page, filters.pageSize);
    const result = await query.order("created_at", { ascending: false }).range(from, to);
    const rows = (this.unwrap(result, "Lecture des comptes impossible") ?? []) as AccountRow[];
    return {
      items: rows.map((r) => ({
        id: r.id,
        email: r.email,
        firstName: r.first_name,
        lastName: r.last_name,
        pseudo: r.pseudo,
        accountStatus: r.account_status,
        failedLoginCount: r.failed_login_count,
        lockedAt: r.locked_at ? new Date(r.locked_at) : null,
        deletedAt: r.deleted_at ? new Date(r.deleted_at) : null,
        lastSeenAt: r.last_seen_at ? new Date(r.last_seen_at) : null,
        createdAt: new Date(r.created_at),
        roles: (r.roles ?? []).filter(isRoleCode),
      })),
      total: result.count ?? rows.length,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  async countByStatus(status: string): Promise<number> {
    const { count, error } = await this.db.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", status);
    if (error) throw new ApiError(error.message, 500, error.code || "DB_ERROR");
    return count ?? 0;
  }

  async unlock(userId: string, reason: string | null): Promise<void> {
    const { error } = await this.db.rpc("unlock_account", { p_user_id: userId, p_reason: reason ?? undefined });
    if (error) throw rpcFailure(error, "UNLOCK_FAILED");
  }

  /** Réactive un compte désactivé (événement `account_reactivated` + audit, motif obligatoire). */
  async reactivate(userId: string, reason: string): Promise<void> {
    const { error } = await this.db.rpc("reactivate_account", { p_user_id: userId, p_reason: reason });
    if (error) throw rpcFailure(error, "REACTIVATE_FAILED");
  }

  /** Suspend un compte actif (événement `account_suspended` + audit, motif obligatoire). */
  async suspend(userId: string, reason: string): Promise<void> {
    const { error } = await this.db.rpc("suspend_account", { p_user_id: userId, p_reason: reason });
    if (error) throw rpcFailure(error, "SUSPEND_FAILED");
  }

  async liftSuspension(userId: string, reason: string): Promise<void> {
    const { error } = await this.db.rpc("lift_account_suspension", { p_user_id: userId, p_reason: reason });
    if (error) throw rpcFailure(error, "SUSPEND_FAILED");
  }

  async assignRole(userId: string, role: ManageableRole, reason: string | null): Promise<void> {
    const { error } = await this.db.rpc("assign_role", { p_user_id: userId, p_role: role, p_reason: reason ?? undefined });
    if (error) throw rpcFailure(error, "ROLE_FAILED");
  }

  async revokeRole(userId: string, role: ManageableRole, reason: string): Promise<void> {
    const { error } = await this.db.rpc("revoke_role", { p_user_id: userId, p_role: role, p_reason: reason });
    if (error) throw rpcFailure(error, "ROLE_FAILED");
  }
}
