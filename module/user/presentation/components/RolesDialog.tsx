"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useActionError } from "@/components/admin/useActionError";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/lib/notify";
import { MANAGEABLE_ROLES, type ManageableRole, type RoleCode } from "../../domain/value-object/Role";
import { assignRoleAction, revokeRoleAction } from "../../infrastructure/server/adminAccountActions";

const MIN_REASON = 3;

/** Attribution et retrait des rôles professeur / super administrateur (le rôle étudiant vient de l'inscription). */
export function RolesDialog({ userId, name, roles }: { userId: string; name: string; roles: RoleCode[] }) {
  const t = useTranslations("Admin.accounts");
  const tr = useTranslations("App.roles");
  const errorText = useActionError();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busyRole, setBusyRole] = useState<ManageableRole | null>(null);
  const [pending, start] = useTransition();

  function change(role: ManageableRole, assigned: boolean) {
    setBusyRole(role);
    start(async () => {
      const res = assigned
        ? await revokeRoleAction({ userId, role, reason: reason.trim() })
        : await assignRoleAction({ userId, role, reason: reason.trim() });
      if (res.ok) {
        notify.success(t(assigned ? "roleRevoked" : "roleAssigned", { role: tr(role), name }));
        setReason("");
        router.refresh();
      } else {
        notify.error(errorText(res.code));
      }
      setBusyRole(null);
    });
  }

  const reasonTooShort = reason.trim().length < MIN_REASON;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" size="sm" variant="outline" />}>
        <ShieldCheck data-icon="inline-start" />
        {t("roles")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("rolesTitle", { name })}</DialogTitle>
          <DialogDescription>{t("rolesHelp")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-1.5">
          <Label htmlFor={`roles-reason-${userId}`}>{t("rolesReasonLabel")}</Label>
          <Textarea id={`roles-reason-${userId}`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
        </div>

        <ul className="grid gap-2">
          {MANAGEABLE_ROLES.map((role) => {
            const assigned = roles.includes(role);
            return (
              <li key={role} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-sm font-medium">{tr(role)}</span>
                  <StatusBadge tone={assigned ? "success" : "neutral"} className="w-fit">
                    {assigned ? t("roleAssignedBadge") : t("roleNotAssignedBadge")}
                  </StatusBadge>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={assigned ? "destructive" : "outline"}
                  disabled={pending || (assigned && reasonTooShort)}
                  onClick={() => change(role, assigned)}
                >
                  {pending && busyRole === role ? t("saving") : assigned ? t("revoke") : t("assign")}
                </Button>
              </li>
            );
          })}
        </ul>
        {roles.includes("student") ? <p className="text-xs text-muted-foreground">{t("rolesStudentNote")}</p> : null}
        <p className="text-xs text-muted-foreground">{t("rolesRevokeHint")}</p>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
