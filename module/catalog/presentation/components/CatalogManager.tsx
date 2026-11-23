"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useActionError } from "@/components/admin/useActionError";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/shared/domain/Page";
import type { Filiere } from "../../domain/entities/Filiere";
import { createFiliereAction, createParcoursAction, setCatalogActiveAction } from "../../infrastructure/server/catalogActions";

/** Petit formulaire en fenêtre : un champ code, un champ nom (et la faculté pour une filière). */
function CreateDialog({
  trigger,
  title,
  withFaculty,
  onSubmit,
}: {
  trigger: string;
  title: string;
  withFaculty?: boolean;
  onSubmit: (v: { code: string; name: string; facultyName: string }) => Promise<ActionResult>;
}) {
  const t = useTranslations("Admin.catalog");
  const errorText = useActionError();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    start(async () => {
      const res = await onSubmit({ code, name, facultyName: faculty });
      if (res.ok) {
        setOpen(false);
        setCode("");
        setName("");
        setFaculty("");
        router.refresh();
      } else {
        setError(errorText(res.code));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" size="sm" variant="outline" />}>
        <Plus data-icon="inline-start" />
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t("codeHelp")}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="cat-code">{t("code")}</Label>
            <Input id="cat-code" value={code} onChange={(e) => setCode(e.target.value)} required minLength={2} maxLength={30} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cat-name">{t("name")}</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={150} />
          </div>
          {withFaculty ? (
            <div className="grid gap-1.5">
              <Label htmlFor="cat-faculty">{t("faculty")}</Label>
              <Input id="cat-faculty" value={faculty} onChange={(e) => setFaculty(e.target.value)} maxLength={150} />
            </div>
          ) : null}
          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? t("saving") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ActiveToggle({ kind, id, active }: { kind: "filiere" | "parcours"; id: string; active: boolean }) {
  const t = useTranslations("Admin.catalog");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      size="xs"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setCatalogActiveAction({ kind, id, active: !active });
          router.refresh();
        })
      }
    >
      {active ? t("deactivate") : t("activate")}
    </Button>
  );
}

export function CatalogManager({ filieres }: { filieres: Filiere[] }) {
  const t = useTranslations("Admin.catalog");

  return (
    <div className="grid gap-4">
      <div>
        <CreateDialog
          trigger={t("newFiliere")}
          title={t("newFiliere")}
          withFaculty
          onSubmit={(v) => createFiliereAction({ code: v.code, name: v.name, facultyName: v.facultyName })}
        />
      </div>

      {filieres.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : null}

      {filieres.map((f) => (
        <Card key={f.id}>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <span className="font-mono text-xs text-muted-foreground">{f.code}</span>
              {f.name}
              <StatusBadge tone={f.isActive ? "success" : "neutral"}>{f.isActive ? t("active") : t("inactive")}</StatusBadge>
            </CardTitle>
            <div className="flex items-center gap-1">
              <CreateDialog
                trigger={t("newParcours")}
                title={t("newParcoursFor", { filiere: f.name })}
                onSubmit={(v) => createParcoursAction({ filiereId: f.id, code: v.code, name: v.name })}
              />
              <ActiveToggle kind="filiere" id={f.id} active={f.isActive} />
            </div>
          </CardHeader>
          <CardContent>
            {f.facultyName ? <p className="mb-2 text-xs text-muted-foreground">{f.facultyName}</p> : null}
            {f.parcours.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noParcours")}</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {f.parcours.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{p.code}</span>
                      {p.name}
                      {!p.isActive ? <StatusBadge tone="neutral">{t("inactive")}</StatusBadge> : null}
                    </span>
                    <ActiveToggle kind="parcours" id={p.id} active={p.isActive} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
