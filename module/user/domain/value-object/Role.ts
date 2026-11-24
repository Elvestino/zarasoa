export const ROLE_CODES = ["student", "professor", "super_admin"] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export function isRoleCode(value: string): value is RoleCode {
  return (ROLE_CODES as readonly string[]).includes(value);
}

export const MANAGEABLE_ROLES = ["professor", "super_admin"] as const satisfies readonly RoleCode[];

export type ManageableRole = (typeof MANAGEABLE_ROLES)[number];

export function isManageableRole(value: unknown): value is ManageableRole {
  return (MANAGEABLE_ROLES as readonly unknown[]).includes(value);
}
