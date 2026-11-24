"use client";

import { Ban, LockOpen, ShieldOff, UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RoleCode } from "../../domain/value-object/Role";
import { liftSuspensionAction, reactivateAccountAction, suspendAccountAction, unlockAccountAction } from "../../infrastructure/server/adminAccountActions";
import { ReasonDialog } from "./ReasonDialog";
import { RolesDialog } from "./RolesDialog";

/**
 * Actions possibles sur un compte selon son état :
 * bloqué → débloquer · désactivé → réactiver · suspendu → lever la suspension · actif → suspendre et gérer les rôles.
 * Sur son propre compte (et sur un compte supprimé) aucune action n'est proposée ; la base la refuse aussi.
 */
export function AccountActions({
  userId,
  name,
  status,
  roles,
  isSelf,
  deleted,
}: {
  userId: string;
  name: string;
  status: string;
  roles: RoleCode[];
  isSelf: boolean;
  deleted: boolean;
}) {
  const t = useTranslations("Admin.accounts");
  if (deleted) return null;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {status === "locked" ? (
        <ReasonDialog
          id={`unlock-${userId}`}
          icon={LockOpen}
          trigger={t("unlock")}
          title={t("unlockTitle", { name })}
          help={t("unlockHelp")}
          confirmLabel={t("unlockConfirm")}
          successText={t("unlocked", { name })}
          required={false}
          action={(reason) => unlockAccountAction({ userId, reason })}
        />
      ) : null}

      {status === "deactivated" ? (
        <ReasonDialog
          id={`reactivate-${userId}`}
          icon={UserCheck}
          trigger={t("reactivate")}
          title={t("reactivateTitle", { name })}
          help={t("reactivateHelp")}
          confirmLabel={t("reactivateConfirm")}
          successText={t("reactivated", { name })}
          required
          action={(reason) => reactivateAccountAction({ userId, reason })}
        />
      ) : null}

      {status === "suspended" ? (
        <ReasonDialog
          id={`lift-${userId}`}
          icon={ShieldOff}
          trigger={t("liftSuspension")}
          title={t("liftTitle", { name })}
          help={t("liftHelp")}
          confirmLabel={t("liftConfirm")}
          successText={t("suspensionLifted", { name })}
          required
          action={(reason) => liftSuspensionAction({ userId, reason })}
        />
      ) : null}

      {status === "approved" && !isSelf ? (
        <>
          <RolesDialog userId={userId} name={name} roles={roles} />
          <ReasonDialog
            id={`suspend-${userId}`}
            icon={Ban}
            trigger={t("suspend")}
            title={t("suspendTitle", { name })}
            help={t("suspendHelp")}
            confirmLabel={t("suspendConfirm")}
            successText={t("suspended", { name })}
            required
            destructive
            action={(reason) => suspendAccountAction({ userId, reason })}
          />
        </>
      ) : null}
    </div>
  );
}
