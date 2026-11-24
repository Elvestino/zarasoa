"use client";

import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useActionError } from "@/components/admin/useActionError";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/lib/notify";
import type { ActionResult } from "@/shared/domain/Page";

const MIN_REASON = 3;

/**
 * Fenêtre « action sur un compte + motif ». Le résultat est annoncé par un toast ;
 * en cas d'erreur la fenêtre reste ouverte et le motif saisi est conservé.
 */
export function ReasonDialog({
  id,
  icon: Icon,
  trigger,
  title,
  help,
  confirmLabel,
  successText,
  required,
  destructive,
  action,
}: {
  id: string;
  icon: LucideIcon;
  trigger: string;
  title: string;
  help: string;
  confirmLabel: string;
  successText: string;
  /** Motif obligatoire (3 à 500 caractères) ou facultatif. */
  required: boolean;
  destructive?: boolean;
  action: (reason: string) => Promise<ActionResult>;
}) {
  const t = useTranslations("Admin.accounts");
  const errorText = useActionError();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  const reasonTooShort = required && reason.trim().length < MIN_REASON;

  function submit() {
    if (reasonTooShort) return;
    start(async () => {
      const res = await action(reason.trim());
      if (res.ok) {
        notify.success(successText);
        setOpen(false);
        setReason("");
        router.refresh();
      } else {
        notify.error(errorText(res.code));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" size="sm" variant="outline" />}>
        <Icon data-icon="inline-start" />
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{help}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor={id}>{required ? t("reasonRequiredLabel") : t("reasonLabel")}</Label>
            <Textarea id={id} value={reason} onChange={(e) => setReason(e.target.value)} required={required} minLength={required ? MIN_REASON : undefined} maxLength={500} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={pending || reasonTooShort}>
              {pending ? t("saving") : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
