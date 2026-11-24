import "server-only";
import { ApiError } from "@/shared/errors/ApiError";
import type { Db } from "@/shared/infrastructure/repository/BaseRepository";
import type { AuthUser } from "../../domain/entities/AuthUser";
import type { IProfileRepository } from "@/module/user/interfaces/IProfileRepository";
import type { AccountStatus } from "@/module/user/domain/value-object/AccountStatus";
import { toAuthUser } from "../api/AuthEndpoint";

interface LoginMeta {
  ip?: string | null;
  userAgent?: string | null;
}

const BLOCKED_STATUS: Partial<Record<AccountStatus, [number, string, string]>> = {
  locked: [423, "ACCOUNT_LOCKED", "Compte bloqué après 5 échecs de connexion. Contactez l'administrateur."],
  pending_email: [403, "EMAIL_NOT_CONFIRMED", "Confirmez d'abord votre adresse e-mail."],
  pending_admin: [403, "ACCOUNT_PENDING_ADMIN", "Votre inscription est en attente de validation par l'administration."],
  rejected: [403, "ACCOUNT_REJECTED", "Votre inscription a été refusée."],
  suspended: [403, "ACCOUNT_INACTIVE", "Ce compte est suspendu."],
  deactivated: [403, "ACCOUNT_INACTIVE", "Ce compte est désactivé."],
};

/**
 * Connexion côté serveur : seul endroit qui peut compter les échecs (RPC `register_login_failure`,
 * qui exige la clé secrète) et refuser les comptes non approuvés.
 */
export class LoginService {
  constructor(
    private readonly userDb: Db, // client serveur lié aux cookies de l'utilisateur (RLS)
    private readonly adminDb: () => Db, // créé à la demande : la clé secrète peut être absente en local
    private readonly profiles: IProfileRepository,
  ) {}

  async login(email: string, password: string, meta: LoginMeta = {}): Promise<AuthUser> {
    const { data, error } = await this.userDb.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      if (error?.code === "email_not_confirmed") {
        throw new ApiError("Confirmez d'abord votre adresse e-mail.", 403, "EMAIL_NOT_CONFIRMED");
      }
      if (error?.code === "invalid_credentials" || error?.status === 400) {
        const locked = await this.registerFailure(email, meta);
        if (locked) {
          throw new ApiError(BLOCKED_STATUS.locked![2], 423, "ACCOUNT_LOCKED");
        }
        throw new ApiError("E-mail ou mot de passe incorrect.", 401, "INVALID_CREDENTIALS");
      }
      throw new ApiError("Connexion impossible pour le moment.", error?.status ?? 500, "LOGIN_FAILED");
    }

    const profile = await this.profiles.findById(data.user.id);
    const blocked = !profile
      ? BLOCKED_STATUS.suspended
      : profile.deletedAt
        ? BLOCKED_STATUS.deactivated
        : BLOCKED_STATUS[profile.accountStatus];

    if (blocked) {
      await this.userDb.auth.signOut(); // aucune session ne doit survivre à un refus
      throw new ApiError(blocked[2], blocked[0], blocked[1]);
    }

    await this.registerSuccess(data.user.id);
    return toAuthUser(data.user);
  }

  /** @returns true si le compte vient d'être (ou était déjà) bloqué. Ne casse jamais la connexion. */
  private async registerFailure(email: string, meta: LoginMeta): Promise<boolean> {
    try {
      const { data, error } = await this.adminDb().rpc("register_login_failure", {
        p_email: email,
        p_ip: meta.ip ?? null,
        p_user_agent: meta.userAgent ?? undefined,
      });
      if (error) throw error;
      return Boolean((data as { locked?: boolean } | null)?.locked);
    } catch (e) {
      console.error("[auth] register_login_failure a échoué :", e instanceof Error ? e.message : e);
      return false;
    }
  }

  private async registerSuccess(userId: string): Promise<void> {
    try {
      const { error } = await this.adminDb().rpc("register_login_success", { p_user_id: userId });
      if (error) throw error;
    } catch (e) {
      console.error("[auth] register_login_success a échoué :", e instanceof Error ? e.message : e);
    }
  }
}
