"use client";

import { FileSpreadsheet, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { StatusBadge, type Tone } from "@/components/admin/StatusBadge";
import { useActionError } from "@/components/admin/useActionError";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { notify } from "@/lib/notify";
import {
  REGISTRY_ACCEPTED_EXTENSIONS,
  REGISTRY_MAX_FILE_BYTES,
  REQUIRED_REGISTRY_FIELD,
  type ImportPreview,
  type PreviewColumn,
  type RegistryField,
} from "../../domain/RegistryImport";
import { cancelRegistryImportAction, confirmRegistryImportAction } from "../../infrastructure/server/registryActions";

const ROW_TONE: Record<string, Tone> = { valid: "success", duplicate: "warning", invalid: "danger" };
const BAR: Record<string, string> = { neutral: "bg-muted-foreground/40", success: "bg-green-600", warning: "bg-secondary", danger: "bg-destructive" };

/** Import du registre officiel : 1) choisir le fichier, 2) contrôler l'aperçu, 3) confirmer. */
export function RegistryImportPanel() {
  const t = useTranslations("Admin.registry");
  const errorText = useActionError();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  /** Clés des colonnes cochées (= importées et affichées dans l'aperçu). */
  const [selected, setSelected] = useState<Set<string>>(new Set());

  /** Au départ : colonnes reconnues cochées, colonnes inconnues décochées (elles ne sont jamais enregistrées). */
  const defaultSelection = (columns: PreviewColumn[]) => new Set(columns.filter((c) => c.field !== null).map((c) => c.key));

  const fieldColumn = (field: RegistryField) => preview?.columns.find((c) => c.field === field);
  /** Le parcours dépend de la filière : sans filière cochée, il ne peut pas être importé. */
  const parcoursBlocked = (() => {
    const filiere = fieldColumn("filiere");
    return filiere ? !selected.has(filiere.key) : false;
  })();

  function toggleColumn(column: PreviewColumn, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(column.key);
      else next.delete(column.key);
      // Décocher la filière décoche aussi le parcours.
      if (!checked && column.field === "filiere") {
        const parcours = preview?.columns.find((c) => c.field === "parcours");
        if (parcours) next.delete(parcours.key);
      }
      return next;
    });
  }

  const visibleColumns = useMemo(() => (preview ? preview.columns.filter((c) => selected.has(c.key)) : []), [preview, selected]);

  const reset = () => {
    setPreview(null);
    setSelected(new Set());
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  async function analyse() {
    if (!file) return;
    if (file.size > REGISTRY_MAX_FILE_BYTES) return notify.error(errorText("FILE_TOO_LARGE"));
    setBusy(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/registry/import", { method: "POST", body });
      const json = (await res.json().catch(() => null)) as { data?: ImportPreview; error?: { code: string } } | null;
      if (!res.ok || !json?.data) return notify.error(errorText(json?.error?.code));
      setPreview(json.data);
      setSelected(defaultSelection(json.data.columns));
    } catch {
      notify.error(errorText("GENERIC"));
    } finally {
      setBusy(false);
    }
  }

  function confirm() {
    if (!preview) return;
    start(async () => {
      // Champs reconnus dont la colonne est décochée : le serveur ne les écrit pas.
      const excluded = preview.columns.filter((c) => c.field && c.field !== REQUIRED_REGISTRY_FIELD && !selected.has(c.key)).map((c) => c.field as string);
      const res = await confirmRegistryImportAction(preview.importId, excluded);
      if (res.ok) {
        notify.success(t("doneTitle"), t("doneText", { inserted: res.data.inserted, updated: res.data.updated, checked: res.data.checkedRequests }));
        reset();
        router.refresh();
      } else {
        notify.error(errorText(res.code));
      }
    });
  }

  function cancel() {
    const id = preview?.importId;
    reset();
    if (id) void cancelRegistryImportAction(id);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="size-5 text-primary" aria-hidden="true" />
          {t("importTitle")}
        </CardTitle>
        <CardDescription>{t("importHelp", { size: Math.round(REGISTRY_MAX_FILE_BYTES / 1024 / 1024) })}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!preview ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid min-w-64 flex-1 gap-1.5 sm:max-w-md">
              <Label htmlFor="registry-file">{t("file")}</Label>
              <Input
                id="registry-file"
                ref={inputRef}
                type="file"
                accept={REGISTRY_ACCEPTED_EXTENSIONS.join(",")}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="button" onClick={analyse} disabled={!file || busy}>
              <Upload data-icon="inline-start" />
              {busy ? t("analysing") : t("analyse")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            <p className="text-sm">
              <span className="font-medium">{preview.fileName}</span>
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {(
                [
                  ["total", preview.total, "neutral"],
                  ["valid", preview.valid, "success"],
                  ["duplicate", preview.duplicate, "warning"],
                  ["invalid", preview.invalid, "danger"],
                  ["warnings", preview.warnings, "warning"],
                ] as const
              ).map(([key, value, tone]) => (
                <div key={key} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{t(`stats.${key}`)}</p>
                  <p className="mt-1 text-xl font-semibold">{value}</p>
                  <span aria-hidden="true" className={`mt-1 block h-1 w-8 rounded-full ${BAR[tone]}`} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["willInsert", preview.willInsert, "success"],
                  ["willUpdate", preview.willUpdate, "neutral"],
                  ["emptyNumbers", preview.emptyNumbers, "danger"],
                ] as const
              ).map(([key, value, tone]) => (
                <div key={key} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{t(`stats.${key}`)}</p>
                  <p className="mt-1 text-xl font-semibold">{value}</p>
                  <span aria-hidden="true" className={`mt-1 block h-1 w-8 rounded-full ${BAR[tone]}`} />
                </div>
              ))}
            </div>

            {preview.missingColumns.length > 0 ? (
              <Alert>
                <AlertDescription>
                  {t("missingColumns", { columns: preview.missingColumns.map((c) => t(`columns.${c}`)).join(", ") })}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-3 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{t("columnsTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("columnsHelp", { selected: visibleColumns.length, total: preview.columns.length })}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {preview.columns.map((c) => {
                  const required = c.field === REQUIRED_REGISTRY_FIELD;
                  const unknown = c.field === null;
                  const blocked = c.field === "parcours" && parcoursBlocked;
                  const disabled = required || unknown || blocked;
                  const note = required ? t("columnRequired") : unknown ? t("columnUnknown") : blocked ? t("columnNeedsFiliere") : c.field ? t(`fields.${c.field}`) : "";
                  return (
                    <label
                      key={c.key}
                      className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-muted"}`}
                    >
                      <Checkbox
                        checked={selected.has(c.key)}
                        disabled={disabled}
                        onCheckedChange={(checked) => toggleColumn(c, checked === true)}
                        aria-label={c.key}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{c.key}</span>
                        <span className="block truncate text-xs text-muted-foreground">{note}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {preview.issues.length > 0 ? (
              <div className="grid gap-2 rounded-lg border border-secondary/60 p-3">
                <div>
                  <p className="text-sm font-medium">{t("issuesTitle")}</p>
                  <p className="text-xs text-muted-foreground">
                    {preview.issues.length < preview.duplicate + preview.invalid + preview.warnings
                      ? t("issuesTruncated", { shown: preview.issues.length })
                      : t("issuesHelp")}
                  </p>
                </div>
                <div className="max-h-64 overflow-auto rounded-md border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card">
                      <TableRow>
                        <TableHead className="w-16">{t("row")}</TableHead>
                        <TableHead>{t("registration")}</TableHead>
                        <TableHead>{t("problem")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.issues.map((i) => (
                        <TableRow key={i.rowNumber}>
                          <TableCell className="text-muted-foreground">{i.rowNumber}</TableCell>
                          <TableCell className="font-mono text-xs">{i.registrationNumber ?? "—"}</TableCell>
                          <TableCell>
                            <StatusBadge tone={i.status === "valid" ? "warning" : (ROW_TONE[i.status] ?? "neutral")}>
                              {i.errorCode ? t(`issues.${i.errorCode}`) : t("rowStatus.valid")}
                            </StatusBadge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}

            <div className="max-h-96 overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead className="w-16">{t("row")}</TableHead>
                    {visibleColumns.map((c) => (
                      <TableHead key={c.key} className="whitespace-nowrap">
                        {c.key}
                      </TableHead>
                    ))}
                    <TableHead>{t("state")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.sample.map((r) => (
                    <TableRow key={r.rowNumber}>
                      <TableCell className="text-muted-foreground">{r.rowNumber}</TableCell>
                      {visibleColumns.map((c) => (
                        <TableCell
                          key={c.key}
                          className={c.field === REQUIRED_REGISTRY_FIELD ? "max-w-48 truncate font-mono text-xs" : "max-w-48 truncate text-xs text-muted-foreground"}
                        >
                          {r.cells[c.key] || "—"}
                        </TableCell>
                      ))}
                      <TableCell>
                        <StatusBadge tone={r.errorCode && r.status === "valid" ? "warning" : (ROW_TONE[r.status] ?? "neutral")}>
                          {r.errorCode ? t(`issues.${r.errorCode}`) : t("rowStatus.valid")}
                        </StatusBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {preview.total > preview.sample.length ? (
              <p className="text-xs text-muted-foreground">{t("sampleNote", { shown: preview.sample.length, total: preview.total })}</p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" onClick={cancel} disabled={pending}>
                {t("cancel")}
              </Button>
              <Button type="button" onClick={confirm} disabled={pending || preview.valid === 0}>
                {pending ? t("importing") : t("confirm", { count: preview.valid })}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
