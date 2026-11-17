import type { AccountStatus } from "../value-object/AccountStatus";
import type { RoleCode } from "../value-object/Role";

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  pseudo: string | null;
  phoneNumber: string | null;
  avatarPath: string | null;
  accountStatus: AccountStatus;
  preferredLocale: string;
  roles: RoleCode[];
  deletedAt: Date | null;
}

export const profileHasRole = (profile: Profile, role: RoleCode): boolean => profile.roles.includes(role);

/** Seul un compte approuvé et non supprimé accède aux espaces privés. */
export const canAccessPlatform = (profile: Profile): boolean =>
  profile.accountStatus === "approved" && profile.deletedAt === null;

export const displayName = (profile: Profile): string =>
  profile.pseudo?.trim() || `${profile.firstName} ${profile.lastName}`.trim() || profile.email;
