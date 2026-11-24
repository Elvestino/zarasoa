"use client";

import { ScanSearch } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useActionError } from "@/components/admin/useActionError";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import { checkAllRequestsAction } from "../../infrastructure/server/studentActions";

/** Compare toutes les demandes en attente au registre officiel importé. */
export function CheckAllButton() {
  const t = useTranslations("Admin.requests");
  const errorText = useActionError();
  const router = useRouter();
  const [pending, start] = useTransition();

  function run() {
    start(async () => {
      const res = await checkAllRequestsAction();
      if (res.ok) {
        notify.success(t("checkedAll", { count: res.data.checked }));
        router.refresh();
      } else {
        notify.error(errorText(res.code));
      }
    });
  }

  return (
    <Button type="button" variant="outline" onClick={run} disabled={pending}>
      <ScanSearch data-icon="inline-start" />
      {pending ? t("checking") : t("checkAll")}
    </Button>
  );
}
