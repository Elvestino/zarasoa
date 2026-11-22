"use client";

import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { FieldInput } from "./AuthFields";

type PasswordInputProps = Omit<ComponentProps<"input">, "type"> & {
  /** Mode contrôlé : permet de piloter plusieurs champs avec un seul bouton (inscription). */
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  /** false = pas de bouton œil (le champ suit l'état `visible` d'un autre champ). */
  showToggle?: boolean;
};

/** Champ mot de passe avec bouton œil (showPassword). Autonome par défaut, contrôlable via `visible`. */
export function PasswordInput({ visible, onVisibleChange, showToggle = true, className, ...props }: PasswordInputProps) {
  const t = useTranslations("Auth.fields");
  const [internal, setInternal] = useState(false);
  const isControlled = visible !== undefined;
  const shown = isControlled ? visible : internal;

  function toggle() {
    const next = !shown;
    if (!isControlled) setInternal(next);
    onVisibleChange?.(next);
  }

  return (
    <div className="relative ">
      <FieldInput {...props} type={shown ? "text" : "password"} className={cn(showToggle && "pr-9", className)} />
      {showToggle ? (
        <button
          type="button"
          onClick={toggle}
          aria-label={shown ? t("hidePassword") : t("showPassword")}
          aria-pressed={shown}
          className="absolute right-0 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer"
        >
          {shown ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      ) : null}
    </div>
  );
}
