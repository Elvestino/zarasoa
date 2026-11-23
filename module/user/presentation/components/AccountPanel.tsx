"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { useActionError } from "@/components/admin/useActionError";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { LOCALE_LABELS, routing } from "@/i18n/routing";
import { ROUTES } from "@/lib/constants";
import { PasswordChecklist } from "@/module/auth/presentation/components/PasswordChecklist";
import { PasswordInput } from "@/module/auth/presentation/components/PasswordInput";
import { changePasswordAction, deactivateAccountAction, deleteAccountAction, updateProfileAction } from "../../infrastructure/server/accountActions";

export interface AccountPanelProps {
  email: string;
  firstName: string;
  lastName: string;
  pseudo: string | null;
  phoneNumber: string | null;
  preferredLocale: string;
}

type Feedback = { kind: "ok" | "error"; text: string } | null;

function FeedbackAlert({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <Alert variant={feedback.kind === "error" ? "destructive" : "default"} role={feedback.kind === "error" ? "alert" : "status"}>
      <AlertDescription>{feedback.text}</AlertDescription>
    </Alert>
  );
}

/** Page « Mon compte » commune à tous les rôles : profil, mot de passe, désactivation et suppression du compte. */
export function AccountPanel(props: AccountPanelProps) {
  const t = useTranslations("Account");
  const errorText = useActionError();
  const router = useRouter();

  // ── profil ──
  const [profile, setProfile] = useState({
    firstName: props.firstName,
    lastName: props.lastName,
    pseudo: props.pseudo ?? "",
    phoneNumber: props.phoneNumber ?? "",
    preferredLocale: props.preferredLocale,
  });
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);
  const [profilePending, startProfile] = useTransition();

  function saveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileFeedback(null);
    startProfile(async () => {
      const res = await updateProfileAction(profile);
      if (res.ok) {
        setProfileFeedback({ kind: "ok", text: t("profile.saved") });
        router.refresh();
      } else {
        setProfileFeedback({ kind: "error", text: errorText(res.code) });
      }
    });
  }

  // ── mot de passe ──
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwFeedback, setPwFeedback] = useState<Feedback>(null);
  const [pwPending, startPw] = useTransition();

  function savePassword(e: FormEvent) {
    e.preventDefault();
    setPwFeedback(null);
    if (pw.next !== pw.confirm) return setPwFeedback({ kind: "error", text: errorText("PASSWORD_MISMATCH") });
    startPw(async () => {
      const res = await changePasswordAction({ currentPassword: pw.current, newPassword: pw.next });
      if (res.ok) {
        setPw({ current: "", next: "", confirm: "" });
        setPwFeedback({ kind: "ok", text: t("password.saved") });
      } else {
        setPwFeedback({ kind: "error", text: errorText(res.code) });
      }
    });
  }

  // ── zone sensible ──
  const [confirmPw, setConfirmPw] = useState("");
  const [dangerError, setDangerError] = useState<string | null>(null);
  const [dangerPending, startDanger] = useTransition();

  function endAccount(kind: "deactivate" | "delete") {
    setDangerError(null);
    startDanger(async () => {
      const res = kind === "deactivate" ? await deactivateAccountAction({ password: confirmPw }) : await deleteAccountAction({ password: confirmPw });
      if (res.ok) window.location.assign(ROUTES.login);
      else setDangerError(errorText(res.code));
    });
  }

  const set = (k: keyof typeof profile) => (e: { target: { value: string } }) => setProfile((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="grid max-w-3xl gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
          <CardDescription>{t("profile.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="acc-email">{t("fields.email")}</Label>
              <Input id="acc-email" value={props.email} readOnly disabled />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="acc-last">{t("fields.lastName")}</Label>
              <Input id="acc-last" value={profile.lastName} onChange={set("lastName")} required maxLength={100} autoComplete="family-name" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="acc-first">{t("fields.firstName")}</Label>
              <Input id="acc-first" value={profile.firstName} onChange={set("firstName")} required maxLength={100} autoComplete="given-name" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="acc-pseudo">{t("fields.pseudo")}</Label>
              <Input id="acc-pseudo" value={profile.pseudo} onChange={set("pseudo")} maxLength={200} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="acc-phone">{t("fields.phone")}</Label>
              <Input id="acc-phone" type="tel" value={profile.phoneNumber} onChange={set("phoneNumber")} maxLength={25} autoComplete="tel" />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="acc-locale">{t("fields.language")}</Label>
              <NativeSelect id="acc-locale" value={profile.preferredLocale} onChange={set("preferredLocale")}>
                {routing.locales.map((l) => (
                  <NativeSelectOption key={l} value={l}>
                    {LOCALE_LABELS[l]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-3 sm:col-span-2">
              <FeedbackAlert feedback={profileFeedback} />
              <div>
                <Button type="submit" disabled={profilePending}>
                  {profilePending ? t("saving") : t("save")}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("password.title")}</CardTitle>
          <CardDescription>{t("password.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="pw-current">{t("password.current")}</Label>
              <PasswordInput id="pw-current" variant="box" autoComplete="current-password" required maxLength={256} value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pw-new">{t("password.new")}</Label>
              <PasswordInput
                id="pw-new"
                variant="box"
                autoComplete="new-password"
                required
                maxLength={128}
                aria-describedby="pw-rules"
                value={pw.next}
                onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                visible={showPw}
                onVisibleChange={setShowPw}
              />
              <PasswordChecklist id="pw-rules" password={pw.next} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pw-confirm">{t("password.confirm")}</Label>
              <PasswordInput id="pw-confirm" variant="box" autoComplete="new-password" required maxLength={128} value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} visible={showPw} showToggle={false} />
            </div>
            <FeedbackAlert feedback={pwFeedback} />
            <div>
              <Button type="submit" disabled={pwPending}>
                {pwPending ? t("saving") : t("password.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">{t("danger.title")}</CardTitle>
          <CardDescription>{t("danger.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(["deactivate", "delete"] as const).map((kind) => (
            <AlertDialog key={kind} onOpenChange={() => { setConfirmPw(""); setDangerError(null); }}>
              <AlertDialogTrigger render={<Button type="button" variant={kind === "delete" ? "destructive" : "outline"} />}>
                {t(`danger.${kind}.button`)}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t(`danger.${kind}.title`)}</AlertDialogTitle>
                  <AlertDialogDescription>{t(`danger.${kind}.text`)}</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-1.5">
                  <Label htmlFor={`confirm-${kind}`}>{t("danger.confirmPassword")}</Label>
                  <PasswordInput id={`confirm-${kind}`} variant="box" autoComplete="current-password" maxLength={256} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                </div>
                {dangerError ? (
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>{dangerError}</AlertDescription>
                  </Alert>
                ) : null}
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <Button type="button" variant="destructive" disabled={dangerPending || !confirmPw} onClick={() => endAccount(kind)}>
                    {dangerPending ? t("saving") : t(`danger.${kind}.confirm`)}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
