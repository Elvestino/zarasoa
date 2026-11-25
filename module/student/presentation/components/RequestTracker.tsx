import { Check, Clock, Mail, Send, ShieldCheck, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { ComponentType } from "react";
import { StatusBadge, type Tone } from "@/components/admin/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { MyRegistrationRequest, RequestStatus } from "../../domain/entities/RegistrationRequest";
import { requestProgress, type StepKey, type StepState } from "../../domain/use-cases/requestProgress";

const STATUS_TONE: Record<RequestStatus, Tone> = {
  pending_email: "warning",
  pending_admin: "warning",
  approved: "success",
  rejected: "danger",
};

const STEP_ICON: Record<StepKey, ComponentType<{ className?: string }>> = {
  submitted: Send,
  email: Mail,
  review: ShieldCheck,
};

const STEP_STYLE: Record<StepState, string> = {
  done: "border-primary bg-primary text-primary-foreground",
  current: "border-secondary bg-secondary/20 text-foreground",
  pending: "border-border bg-muted text-muted-foreground",
  failed: "border-destructive bg-destructive text-white",
};

/** US-013 : état de la demande d'inscription (attente e-mail, attente admin, approuvée ou refusée) avec le motif éventuel. */
export function RequestTracker({ request }: { request: MyRegistrationRequest }) {
  const t = useTranslations("Request");
  const format = useFormatter();
  const steps = requestProgress(request);

  // Date seule : l'heure dépendrait du fuseau du serveur, pas de celui de l'étudiant.
  const date = (d: Date) => format.dateTime(d, { dateStyle: "long" });
  const stepDetail = (step: ReturnType<typeof requestProgress>[number]): string => {
    if (!step.at) return t(`stepState.${step.state}`);
    if (step.key !== "review") return date(step.at);
    return t(step.state === "failed" ? "stepAt.rejected" : "stepAt.approved", { date: date(step.at) });
  };
  const fullName = `${request.firstName} ${request.lastName}`.trim();

  const summary: { label: string; value: string }[] = [
    { label: t("summary.registrationNumber"), value: request.registrationNumber },
    { label: t("summary.name"), value: fullName },
    { label: t("summary.email"), value: request.email },
    ...(request.phoneNumber ? [{ label: t("summary.phone"), value: request.phoneNumber }] : []),
    ...(request.declaredDateOfBirth
      ? [{ label: t("summary.birthDate"), value: format.dateTime(new Date(`${request.declaredDateOfBirth}T00:00:00Z`), { dateStyle: "long", timeZone: "UTC" }) }]
      : []),
    { label: t("summary.submittedOn"), value: date(request.submittedAt) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardDescription>{t("title")}</CardDescription>
            <StatusBadge tone={STATUS_TONE[request.status]}>{t(`status.${request.status}`)}</StatusBadge>
          </div>
          <CardTitle className="text-xl">{t(`headline.${request.status}`)}</CardTitle>
          <CardDescription>{t(`description.${request.status}`, { email: request.email })}</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {request.status === "rejected" ? (
            <Alert variant="destructive">
              <X aria-hidden="true" />
              <AlertTitle>{t("reasonTitle")}</AlertTitle>
              <AlertDescription>{request.decisionReason?.trim() || t("noReason")}</AlertDescription>
            </Alert>
          ) : null}

          <ol className="flex flex-col" aria-label={t("title")}>
            {steps.map((step, index) => {
              const Icon = step.state === "done" ? Check : step.state === "failed" ? X : step.state === "current" ? Clock : STEP_ICON[step.key];
              const last = index === steps.length - 1;
              return (
                <li key={step.key} className="flex gap-4" aria-current={step.state === "current" ? "step" : undefined}>
                  <div className="flex flex-col items-center">
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full border-2", STEP_STYLE[step.state])}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    {last ? null : <span className={cn("my-1 w-0.5 flex-1", step.state === "done" ? "bg-primary" : "bg-border")} aria-hidden="true" />}
                  </div>
                  <div className={cn("min-w-0 pb-6", last && "pb-0")}>
                    <p className="text-sm font-semibold leading-9">{t(`steps.${step.key}`)}</p>
                    <p className="text-xs text-muted-foreground">{stepDetail(step)}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          {request.status === "approved" ? (
            // Route serveur : elle aiguille vers l'espace du rôle (navigation complète, comme après la connexion).
            <Button nativeButton={false} render={<a href={ROUTES.continue} />} size="lg" className="self-start">
              {t("openSpace")}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("summary.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {summary.map((item) => (
              <div key={item.label} className="min-w-0">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</dt>
                <dd className="wrap-break-words font-medium">{item.value}</dd>
              </div>
            ))}
          </dl>
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">{t("contactHint")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
