"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { PASSWORD_MIN_LENGTH, checkPassword } from "../../domain/value-object/PasswordRules";

/** Liste des conditions du mot de passe, recalculée à chaque frappe : rouge = manquante, vert = remplie. */
export function PasswordChecklist({ password, id }: { password: string; id?: string }) {
  const t = useTranslations("Auth.passwordRules");
  const results = checkPassword(password);

  return (
    <ul id={id} className="mt-2 flex flex-col gap-1">
      {results.map(({ id: ruleId, valid }) => (
        <li
          key={ruleId}
          data-valid={valid}
          className={cn(
            "flex items-center gap-1.5 text-[11px] transition-colors",
            valid ? "text-green-600 dark:text-green-400" : "text-destructive",
          )}
        >
          {valid ? <Check className="size-3.5 shrink-0" aria-hidden="true" /> : <X className="size-3.5 shrink-0" aria-hidden="true" />}
          <span>{t(ruleId, { min: PASSWORD_MIN_LENGTH })}</span>
        </li>
      ))}
    </ul>
  );
}
