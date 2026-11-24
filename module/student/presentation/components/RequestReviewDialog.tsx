"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { StatusBadge, type Tone } from "@/components/admin/StatusBadge";
import { useActionError } from "@/components/admin/useActionError";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/lib/notify";
import type { AcademicLevel } from "@/module/catalog/domain/entities/AcademicLevel";
import type { Filiere } from "@/module/catalog/domain/entities/Filiere";
import { canApprove, type RegistrationRequest } from "../../domain/entities/RegistrationRequest";
import { approveRequestAction, checkRequestAction, rejectRequestAction } from "../../infrastructure/server/studentActions";

const flat = (v: string | null | undefined) =>
  (v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

export const MATCH_TONE: Record<string, Tone> = { found: "success", mismatch: "warning", not_found: "danger", unchecked: "neutral" };

/** Fenêtre d'examen d'une demande : comparaison déclaré / registre officiel, puis approbation ou refus. */
export function RequestReviewDialog({
  request,
  filieres,
  levels,
}: {
  request: RegistrationRequest;
  filieres: Filiere[];
  levels: AcademicLevel[];
}) {
  const t = useTranslations("Admin.requests");
  const errorText = useActionError();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);

  const off = request.official;
  const [filiereId, setFiliereId] = useState(off?.filiereId ?? "");
  const [parcoursId, setParcoursId] = useState(off?.parcoursId ?? "");
  const [levelId, setLevelId] = useState(off?.levelId ?? "");
  const [reason, setReason] = useState("");

  const activeFilieres = filieres.filter((f) => f.isActive || f.id === filiereId);
  const parcoursOptions = useMemo(
    () => filieres.find((f) => f.id === filiereId)?.parcours.filter((p) => p.isActive || p.id === parcoursId) ?? [],
    [filieres, filiereId, parcoursId],
  );

  const matchKey = request.matchStatus ?? "unchecked";
  const approvable = canApprove(request);
  const open_ = request.status === "pending_email" || request.status === "pending_admin";

  const rows: { label: string; declared: string; official: string | null; same: boolean | null }[] = [
    { label: t("fields.lastName"), declared: request.lastName, official: off?.lastName ?? null, same: off?.lastName ? flat(off.lastName) === flat(request.lastName) : null },
    {
      label: t("fields.firstName"),
      declared: request.firstName,
      official: off?.firstName ?? null,
      same: off?.firstName
        ? flat(off.firstName) === flat(request.firstName) || flat(off.firstName).includes(flat(request.firstName)) || flat(request.firstName).includes(flat(off.firstName))
        : null,
    },
    {
      label: t("fields.birthDate"),
      declared: request.declaredDateOfBirth ?? "—",
      official: off?.dateOfBirth ?? null,
      same: off?.dateOfBirth && request.declaredDateOfBirth ? off.dateOfBirth === request.declaredDateOfBirth : null,
    },
  ];

  function run(fn: () => Promise<{ ok: true } | { ok: false; code: string }>, successText: string) {
    start(async () => {
      const res = await fn();
      if (res.ok) {
        notify.success(successText);
        setOpen(false);
        setMode(null);
        router.refresh();
      } else {
        notify.error(errorText(res.code));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" size="sm" variant="outline" />}>{t("review")}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {request.lastName} {request.firstName}
          </DialogTitle>
          <DialogDescription>
            {t("matricule")} : <span className="font-mono">{request.registrationNumber}</span> · {request.email}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={MATCH_TONE[matchKey] ?? "neutral"}>{t(`match.${matchKey}`)}</StatusBadge>
          <StatusBadge tone={request.emailConfirmedAt ? "success" : "warning"}>
            {request.emailConfirmedAt ? t("emailConfirmed") : t("emailPending")}
          </StatusBadge>
          {open_ ? (
            <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => run(() => checkRequestAction(request.id), t("recheckedDone"))}>
              {t("recheck")}
            </Button>
          ) : null}
        </div>

        {off ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium" />
                  <th className="px-3 py-2 font-medium">{t("declared")}</th>
                  <th className="px-3 py-2 font-medium">{t("official")}</th>
                  <th className="w-8 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-t">
                    <td className="px-3 py-2 text-muted-foreground">{r.label}</td>
                    <td className="px-3 py-2">{r.declared}</td>
                    <td className="px-3 py-2">{r.official ?? "—"}</td>
                    <td className="px-3 py-2">
                      {r.same === null ? null : r.same ? (
                        <Check className="size-4 text-green-600 dark:text-green-400" aria-label={t("same")} />
                      ) : (
                        <X className="size-4 text-destructive" aria-label={t("different")} />
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="border-t">
                  <td className="px-3 py-2 text-muted-foreground">{t("fields.academic")}</td>
                  <td className="px-3 py-2">—</td>
                  <td className="px-3 py-2" colSpan={2}>
                    {[off.filiereName, off.parcoursName, off.levelLabel, off.academicStatus].filter(Boolean).join(" · ") || "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <Alert variant={matchKey === "not_found" ? "destructive" : "default"}>
            <AlertDescription>{matchKey === "not_found" ? t("notFoundHelp") : t("uncheckedHelp")}</AlertDescription>
          </Alert>
        )}

        {request.decisionReason ? (
          <p className="text-sm text-muted-foreground">
            {t("reason")} : {request.decisionReason}
          </p>
        ) : null}

        {open_ && mode === null ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="destructive" onClick={() => setMode("reject")}>
              {t("reject")}
            </Button>
            <Button type="button" disabled={!approvable} onClick={() => setMode("approve")} title={!approvable ? t("approveBlocked") : undefined}>
              {t("approve")}
            </Button>
          </div>
        ) : null}
        {open_ && !approvable && mode === null ? (
          <p className="text-xs text-muted-foreground">{request.status === "pending_email" ? t("waitingEmail") : t("approveBlocked")}</p>
        ) : null}

        {mode === "approve" ? (
          <form
            className="grid gap-3 rounded-lg border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => approveRequestAction({ requestId: request.id, filiereId, parcoursId: parcoursId || undefined, levelId }), t("approvedDone"));
            }}
          >
            {matchKey === "mismatch" ? (
              <Alert>
                <AlertDescription>{t("mismatchWarning")}</AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-1.5">
              <Label htmlFor={`f-${request.id}`}>{t("fields.filiere")}</Label>
              <NativeSelect id={`f-${request.id}`} value={filiereId} required onChange={(e) => { setFiliereId(e.target.value); setParcoursId(""); }}>
                <NativeSelectOption value="">{t("choose")}</NativeSelectOption>
                {activeFilieres.map((f) => (
                  <NativeSelectOption key={f.id} value={f.id}>{f.name}</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`p-${request.id}`}>{t("fields.parcours")}</Label>
              <NativeSelect id={`p-${request.id}`} value={parcoursId} disabled={!filiereId} onChange={(e) => setParcoursId(e.target.value)}>
                <NativeSelectOption value="">{t("noParcours")}</NativeSelectOption>
                {parcoursOptions.map((p) => (
                  <NativeSelectOption key={p.id} value={p.id}>{p.name}</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`l-${request.id}`}>{t("fields.level")}</Label>
              <NativeSelect id={`l-${request.id}`} value={levelId} required onChange={(e) => setLevelId(e.target.value)}>
                <NativeSelectOption value="">{t("choose")}</NativeSelectOption>
                {levels.filter((l) => l.isActive).map((l) => (
                  <NativeSelectOption key={l.id} value={l.id}>{l.label}</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setMode(null)}>{t("cancel")}</Button>
              <Button type="submit" disabled={pending || !filiereId || !levelId}>{pending ? t("saving") : t("confirmApprove")}</Button>
            </div>
          </form>
        ) : null}

        {mode === "reject" ? (
          <form
            className="grid gap-3 rounded-lg border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => rejectRequestAction({ requestId: request.id, reason }), t("rejectedDone"));
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor={`r-${request.id}`}>{t("reasonLabel")}</Label>
              <Textarea id={`r-${request.id}`} value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} maxLength={500} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setMode(null)}>{t("cancel")}</Button>
              <Button type="submit" variant="destructive" disabled={pending || reason.trim().length < 3}>{pending ? t("saving") : t("confirmReject")}</Button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
