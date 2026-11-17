import { BaseRepository, type Db } from "@/shared/infrastructure/repository/BaseRepository";
import type { Profile } from "../../domain/entities/Profile";
import { isAccountStatus } from "../../domain/value-object/AccountStatus";
import { isRoleCode } from "../../domain/value-object/Role";
import type { IProfileRepository } from "../../interfaces/IProfileRepository";

interface ProfileRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  pseudo: string | null;
  phone_number: string | null;
  avatar_path: string | null;
  account_status: string;
  preferred_locale: string;
  deleted_at: string | null;
  user_roles: { role_code: string; revoked_at: string | null }[] | null;
}

export class ProfileRepository extends BaseRepository implements IProfileRepository {
  constructor(db: Db) {
    super(db);
  }

  async findById(id: string): Promise<Profile | null> {
    // user_roles a 3 clés étrangères vers profiles : on désigne explicitement celle de user_id.
    const data = this.unwrap(
      await this.db
        .from("profiles")
        .select("*, user_roles!user_roles_user_id_fkey(role_code, revoked_at)")
        .eq("id", id)
        .maybeSingle(),
      "Lecture du profil impossible",
    );
    return data ? toProfile(data as ProfileRow) : null;
  }
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    pseudo: row.pseudo,
    phoneNumber: row.phone_number,
    avatarPath: row.avatar_path,
    // Statut inconnu = on refuse l'accès par prudence.
    accountStatus: isAccountStatus(row.account_status) ? row.account_status : "suspended",
    preferredLocale: row.preferred_locale,
    roles: (row.user_roles ?? [])
      .filter((r) => r.revoked_at === null)
      .map((r) => r.role_code)
      .filter(isRoleCode),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
  };
}
