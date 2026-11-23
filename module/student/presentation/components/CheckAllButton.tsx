"use client";

import { ScanSearch } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useActionError } from "@/components/admin/useActionError";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { checkAllRequestsAction } from "../../infrastructure/server/studentActions";

/** Compare toutes les demandes en attente au registre officiel importé. */
export function CheckAllButton() {
  const t = useTranslations("Admin.requests");
  const errorText = useActionError();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function run() {
    setMessage(null);
    start(async () => {
      const res = await checkAllRequestsAction();
      if (res.ok) {
        setMessage({ kind: "ok", text: t("checkedAll", { count: res.data.checked }) });
        router.refresh();
      } else {
        setMessage({ kind: "error", text: errorText(res.code) });
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" variant="outline" onClick={run} disabled={pending}>
        <ScanSearch data-icon="inline-start" />
        {pending ? t("checking") : t("checkAll")}
      </Button>
      {message ? (
        <Alert variant={message.kind === "error" ? "destructive" : "default"} role="status" className="w-auto">
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
