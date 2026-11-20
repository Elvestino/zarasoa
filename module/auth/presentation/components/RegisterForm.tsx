"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/constants";
import { DomainError } from "@/shared/errors/DomainError";
import { validateStudentRegistration } from "../../domain/entities/StudentRegistration";
import { useAuth } from "../hooks/useAuth";
import { useAuthError } from "../hooks/useAuthError";
import { Field, FieldInput, FormError, PillButton } from "./AuthFields";
import { AuthShell } from "./AuthShell";

export function RegisterForm() {
  const t = useTranslations("Auth");
  const { register, pending } = useAuth();
  const errorMessage = useAuthError();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const value = (name: string) => String(f.get(name) ?? "");

    try {
      if (value("password") !== value("confirmPassword")) {
        throw new DomainError("Passwords do not match", "PASSWORD_MISMATCH");
      }
      const registration = validateStudentRegistration({
        email: value("email"),
        password: value("password"),
        firstName: value("firstName"),
        lastName: value("lastName"),
        pseudo: value("pseudo"),
        phoneNumber: value("phoneNumber"),
        registrationNumber: value("registrationNumber"),
        dateOfBirth: value("dateOfBirth"),
      });
      const result = await register(registration);
      if (!result.ok) return setError(errorMessage(result.code));
      setSentTo(registration.email);
    } catch (err) {
      setError(errorMessage(err instanceof DomainError ? err.code : "generic"));
    }
  }

  if (sentTo) {
    return (
      <AuthShell title={t("register.sentTitle")}>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
          <p className="font-semibold text-primary">{t("register.sentAlertTitle")}</p>
          <p className="mt-1 text-muted-foreground">{t("register.sentBody", { email: sentTo })}</p>
        </div>
        <Link href={ROUTES.login} className="text-center text-xs font-semibold text-primary underline-offset-4 hover:underline">
          {t("register.backToLogin")}
        </Link>
      </AuthShell>
    );
  }

  const optional = ` (${t("fields.optional")})`;

  return (
    <AuthShell title={t("register.title")} subtitle1={t("register.subtitle1")} subtitle2={t("register.subtitle2")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormError message={error} />
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field id="lastName" label={t("fields.lastName")}>
            <FieldInput id="lastName" name="lastName" autoComplete="family-name" required maxLength={100} />
          </Field>
          <Field id="firstName" label={t("fields.firstName")}>
            <FieldInput id="firstName" name="firstName" autoComplete="given-name" required maxLength={100} />
          </Field>
          <Field id="registrationNumber" label={t("fields.registrationNumber")} className="col-span-2">
            <FieldInput id="registrationNumber" name="registrationNumber" required maxLength={50} />
          </Field>
          <Field id="phoneNumber" label={t("fields.phone") + optional}>
            <FieldInput id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" maxLength={25} />
          </Field>
          <Field id="email" label={t("fields.email")} className="col-span-2">
            <FieldInput id="email" name="email" type="email" autoComplete="email" required />
          </Field>
          <Field id="password" label={t("fields.password")} hint={t("register.passwordHint")} className="col-span-2">
            <FieldInput id="password" name="password" type="password" autoComplete="new-password" required />
          </Field>
          <Field id="confirmPassword" label={t("fields.confirmPassword")} className="col-span-2">
            <FieldInput id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
          </Field>
        </div>
        <label className="flex items-start gap-2 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-0.5 size-3.5 accent-primary"
            onInvalid={(e) => e.currentTarget.setCustomValidity(t("register.termsRequired"))}
            onChange={(e) => e.currentTarget.setCustomValidity("")}
          />
          <span>{t("register.terms")}</span>
        </label>
        <PillButton type="submit" disabled={pending}>
          {pending ? t("register.submitting") : t("register.submit")}
        </PillButton>
      </form>
      <p className="text-center text-xs text-muted-foreground">
        {t("register.haveAccount")}{" "}
        <Link href={ROUTES.login} className="font-semibold text-primary underline-offset-4 hover:underline">
          {t("register.signIn")}
        </Link>
      </p>
    </AuthShell>
  );
}
