"use client";

import { RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useActionError } from "@/components/admin/useActionError";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import { confirmRegistryImportAction } from "../../infrastructure/server/registryActions";

/** Reprend un import interrompu : seules les lignes pas encore écrites sont traitées, avec les mêmes colonnes cochées. */
export function ResumeImportButton({ importId }: { importId: string }) {
  const t = useTranslations("Admin.registry");
  const errorText = useActionError();
  const router = useRouter();
  const [pending, start] = useTransition();

  function resume() {
    start(async () => {
      const res = await confirmRegistryImportAction(importId);
      if (res.ok) {
        notify.success(t("doneTitle"), t("doneText", { inserted: res.data.inserted, updated: res.data.updated, checked: res.data.checkedRequests }));
      } else {
        notify.error(errorText(res.code));
      }
      router.refresh();
    });
  }

  return (
    <Button type="button" size="sm" variant="outline" className="cursor-pointer" onClick={resume} disabled={pending}>
      <RotateCw data-icon="inline-start" />
      {pending ? t("resuming") : t("resume")}
    </Button>
  );
}
