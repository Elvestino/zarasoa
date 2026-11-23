"use client";

import { LockOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useActionError } from "@/components/admin/useActionError";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { unlockAccountAction } from "../../infrastructure/server/adminAccountActions";

export function UnlockAccountButton({ userId, name }: { userId: string; name: string }) {
  const t = useTranslations("Admin.accounts");
  const errorText = useActionError();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    start(async () => {
      const res = await unlockAccountAction({ userId, reason });
      if (res.ok) {
        setOpen(false);
        setReason("");
        router.refresh();
      } else {
        setError(errorText(res.code));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" size="sm" variant="outline" />}>
        <LockOpen data-icon="inline-start" />
        {t("unlock")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("unlockTitle", { name })}</DialogTitle>
          <DialogDescription>{t("unlockHelp")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor={`unlock-${userId}`}>{t("reasonLabel")}</Label>
          <Textarea id={`unlock-${userId}`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
        </div>
        {error ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? t("saving") : t("unlockConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
