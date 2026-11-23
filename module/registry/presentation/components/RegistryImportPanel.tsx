"use client";

import { FileSpreadsheet, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { StatusBadge, type Tone } from "@/components/admin/StatusBadge";
import { useActionError } from "@/components/admin/useActionError";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { REGISTRY_ACCEPTED_EXTENSIONS, REGISTRY_MAX_FILE_BYTES, type ImportPreview } from "../../domain/RegistryImport";
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
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ inserted: number; updated: number; checkedRequests: number } | null>(null);

  const reset = () => {
    setPreview(null);
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  async function analyse() {
    if (!file) return;
    setError(null);
    setDone(null);
    if (file.size > REGISTRY_MAX_FILE_BYTES) return setError(errorText("FILE_TOO_LARGE"));
    setBusy(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/registry/import", { method: "POST", body });
      const json = (await res.json().catch(() => null)) as { data?: ImportPreview; error?: { code: string } } | null;
      if (!res.ok || !json?.data) return setError(errorText(json?.error?.code));
      setPreview(json.data);
    } catch {
      setError(errorText("GENERIC"));
    } finally {
      setBusy(false);
    }
  }

  function confirm() {
    if (!preview) return;
    start(async () => {
      const res = await confirmRegistryImportAction(preview.importId);
      if (res.ok) {
        setDone(res.data);
        reset();
        router.refresh();
      } else {
        setError(errorText(res.code));
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
        {done ? (
          <Alert role="status">
            <AlertTitle>{t("doneTitle")}</AlertTitle>
            <AlertDescription>{t("doneText", { inserted: done.inserted, updated: done.updated, checked: done.checkedRequests })}</AlertDescription>
          </Alert>
        ) : null}
        {error ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

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

            {preview.missingColumns.length > 0 ? (
              <Alert>
                <AlertDescription>
                  {t("missingColumns", { columns: preview.missingColumns.map((c) => t(`columns.${c}`)).join(", ") })}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="max-h-96 overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead className="w-16">{t("row")}</TableHead>
                    <TableHead>{t("registration")}</TableHead>
                    <TableHead>{t("content")}</TableHead>
                    <TableHead>{t("state")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.sample.map((r) => (
                    <TableRow key={r.rowNumber}>
                      <TableCell className="text-muted-foreground">{r.rowNumber}</TableCell>
                      <TableCell className="font-mono text-xs">{r.normalizedNumber ?? "—"}</TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                        {Object.values(r.cells).filter(Boolean).slice(0, 5).join(" · ")}
                      </TableCell>
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
