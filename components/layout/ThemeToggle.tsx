"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/** Bascule clair/sombre : classe `dark` sur <html>, mémorisée dans localStorage (script initial dans le layout). */
export function ThemeToggle() {
  const t = useTranslations("Header");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* stockage indisponible : le choix vaut pour la session */
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={dark ? t("toLight") : t("toDark")}
      title={dark ? t("toLight") : t("toDark")}
      className="rounded-full text-white/80 hover:bg-white/10 hover:text-white dark:hover:bg-white/10"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
