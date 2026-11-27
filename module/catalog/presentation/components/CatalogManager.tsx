"use client";

import { EllipsisVertical, Pencil, Plus, Power, PowerOff, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useActionError } from "@/components/admin/useActionError";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notify";
import type { ActionResult } from "@/shared/domain/Page";
import type { Filiere } from "../../domain/entities/Filiere";
import {
  createFiliereAction,
  createParcoursAction,
  deleteCatalogAction,
  setCatalogActiveAction,
  updateFiliereAction,
  updateParcoursAction,
} from "../../infrastructure/server/catalogActions";

interface FormValues {
  code: string;
  name: string;
  facultyName: string;
}

/** Formulaire en fenêtre (création ou modification) : code, nom, et la faculté pour une filière. */
function CatalogFormDialog({
  mode,
  triggerLabel,
  title,
  submitLabel,
  successText,
  withFaculty,
  initial,
  onSubmit,
  open: controlledOpen,
  onOpenChange,
  iconOnlyOnMobile,
}: {
  /** « create » : bouton « + Nouveau… » · « edit » : pas de bouton, la fenêtre est ouverte depuis le menu ⋮ (open / onOpenChange). */
  mode: "create" | "edit";
  triggerLabel: string;
  title: string;
  submitLabel: string;
  successText: string;
  withFaculty?: boolean;
  initial: FormValues;
  onSubmit: (v: FormValues) => Promise<ActionResult>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Création : sur mobile, seul le « + » est visible (le libellé reste lu par les lecteurs d'écran). */
  iconOnlyOnMobile?: boolean;
}) {
  const t = useTranslations("Admin.catalog");
  const errorText = useActionError();
  const router = useRouter();
  const uid = useId();
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = (next: boolean) => {
    setInnerOpen(next);
    onOpenChange?.(next);
  };
  const [values, setValues] = useState<FormValues>(initial);
  const [pending, start] = useTransition();
  const set = (k: keyof FormValues) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value }));

  function submit() {
    start(async () => {
      const res = await onSubmit(values);
      if (res.ok) {
        notify.success(successText);
        setOpen(false);
        router.refresh();
      } else {
        notify.error(errorText(res.code));
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setValues(initial); // repart des valeurs courantes (ou vides en création)
        setOpen(next);
      }}
    >
      {mode === "create" ? (
        <DialogTrigger
          render={
            <Button
              type="button"
              size="sm"
              variant="outline"
              aria-label={iconOnlyOnMobile ? triggerLabel : undefined}
              className={iconOnlyOnMobile ? "max-sm:w-7 max-sm:gap-0" : undefined}
            />
          }
        >
          <Plus data-icon="inline-start" />
          <span className={iconOnlyOnMobile ? "max-sm:hidden" : undefined}>{triggerLabel}</span>
        </DialogTrigger>
      ) : null}
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
            <Label htmlFor={`${uid}-code`}>{t("code")}</Label>
            <Input id={`${uid}-code`} value={values.code} onChange={set("code")} required minLength={2} maxLength={30} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${uid}-name`}>{t("name")}</Label>
            <Input id={`${uid}-name`} value={values.name} onChange={set("name")} required minLength={2} maxLength={150} />
          </div>
          {withFaculty ? (
            <div className="grid gap-1.5">
              <Label htmlFor={`${uid}-faculty`}>{t("faculty")}</Label>
              <Input id={`${uid}-faculty`} value={values.facultyName} onChange={set("facultyName")} maxLength={150} />
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? t("saving") : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const EMPTY: FormValues = { code: "", name: "", facultyName: "" };

/** Confirmation de suppression (ouverte depuis le menu ⋮). La base refuse si l'élément est encore utilisé : on l'explique par un toast. */
function DeleteDialog({
  kind,
  id,
  name,
  open,
  setOpen,
}: {
  kind: "filiere" | "parcours";
  id: string;
  name: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const t = useTranslations("Admin.catalog");
  const errorText = useActionError();
  const router = useRouter();
  const [pending, start] = useTransition();

  function confirm() {
    start(async () => {
      const res = await deleteCatalogAction({ kind, id });
      if (res.ok) {
        notify.success(t("deleted"));
        setOpen(false);
        router.refresh();
      } else {
        notify.error(errorText(res.code));
        setOpen(false);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t(kind === "filiere" ? "deleteFiliereTitle" : "deleteParcoursTitle", { name })}</AlertDialogTitle>
          <AlertDialogDescription>{t(kind === "filiere" ? "deleteFiliereText" : "deleteParcoursText")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <Button type="button" variant="destructive" disabled={pending} onClick={confirm}>
            {pending ? t("saving") : t("confirmDelete")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Menu ⋮ d'une filière ou d'un parcours : activer / désactiver, modifier, supprimer. */
function RowActions({
  kind,
  id,
  name,
  active,
  editTitle,
  initial,
  onSubmit,
}: {
  kind: "filiere" | "parcours";
  id: string;
  name: string;
  active: boolean;
  editTitle: string;
  initial: FormValues;
  onSubmit: (v: FormValues) => Promise<ActionResult>;
}) {
  const t = useTranslations("Admin.catalog");
  const errorText = useActionError();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  // Nouvelle clé à chaque ouverture : le formulaire repart des valeurs actuelles (après un enregistrement, par exemple).
  const [editKey, setEditKey] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, start] = useTransition();

  function toggleActive() {
    start(async () => {
      const res = await setCatalogActiveAction({ kind, id, active: !active });
      if (res.ok) {
        notify.success(t("updated"));
        router.refresh();
      } else {
        notify.error(errorText(res.code));
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label={t("actions")} />}>
          <EllipsisVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled={pending} onClick={toggleActive}>
            {active ? <PowerOff /> : <Power />}
            {active ? t("deactivate") : t("activate")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setEditKey((k) => k + 1);
              setEditOpen(true);
            }}
          >
            <Pencil />
            {t("edit")}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 />
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Les fenêtres sont hors du menu : elles restent ouvertes quand le menu se referme. */}
      <CatalogFormDialog
        key={editKey}
        mode="edit"
        triggerLabel={editTitle}
        title={editTitle}
        submitLabel={t("save")}
        successText={t("updated")}
        withFaculty={kind === "filiere"}
        initial={initial}
        onSubmit={onSubmit}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteDialog kind={kind} id={id} name={name} open={deleteOpen} setOpen={setDeleteOpen} />
    </>
  );
}

export function CatalogManager({ filieres }: { filieres: Filiere[] }) {
  const t = useTranslations("Admin.catalog");

  return (
    <div className="grid gap-4">
      <div>
        <CatalogFormDialog
          mode="create"
          triggerLabel={t("newFiliere")}
          title={t("newFiliere")}
          submitLabel={t("create")}
          successText={t("created")}
          withFaculty
          initial={EMPTY}
          onSubmit={(v) => createFiliereAction({ code: v.code, name: v.name, facultyName: v.facultyName })}
        />
      </div>

      {filieres.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : null}

      {filieres.map((f) => (
        <Card key={f.id}>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-base">
              <span className="font-mono text-xs text-muted-foreground">{f.code}</span>
              {f.name}
              <StatusBadge tone={f.isActive ? "success" : "neutral"}>{f.isActive ? t("active") : t("inactive")}</StatusBadge>
            </CardTitle>
            {/* Sur la même ligne que le titre : titre à gauche, « + » et menu ⋮ à droite (mobile et ordinateur). */}
            <div className="flex shrink-0 items-center gap-1">
              <CatalogFormDialog
                mode="create"
                iconOnlyOnMobile
                triggerLabel={t("newParcours")}
                title={t("newParcoursFor", { filiere: f.name })}
                submitLabel={t("create")}
                successText={t("created")}
                initial={EMPTY}
                onSubmit={(v) => createParcoursAction({ filiereId: f.id, code: v.code, name: v.name })}
              />
              <RowActions
                kind="filiere"
                id={f.id}
                name={f.name}
                active={f.isActive}
                editTitle={t("editFiliere")}
                initial={{ code: f.code, name: f.name, facultyName: f.facultyName ?? "" }}
                onSubmit={(v) => updateFiliereAction({ id: f.id, code: v.code, name: v.name, facultyName: v.facultyName })}
              />
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
                    <span className="flex items-center gap-1">
                      <RowActions
                        kind="parcours"
                        id={p.id}
                        name={p.name}
                        active={p.isActive}
                        editTitle={t("editParcours")}
                        initial={{ code: p.code, name: p.name, facultyName: "" }}
                        onSubmit={(v) => updateParcoursAction({ id: p.id, code: v.code, name: v.name })}
                      />
                    </span>
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
