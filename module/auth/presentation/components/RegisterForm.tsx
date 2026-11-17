"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/constants";
import { DomainError } from "@/shared/errors/DomainError";
import { validateStudentRegistration } from "../../domain/entities/StudentRegistration";
import { PASSWORD_MIN_LENGTH } from "../../domain/value-object/Password";
import { useAuth } from "../hooks/useAuth";
import { AuthCard, Field } from "./AuthCard";

export function RegisterForm() {
  const { register, pending } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const value = (name: string) => String(f.get(name) ?? "");

    try {
      if (value("password") !== value("confirmPassword")) {
        throw new DomainError("Les deux mots de passe ne correspondent pas.", "PASSWORD_MISMATCH");
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
      if (!result.ok) return setError(result.error ?? null);
      setSentTo(registration.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  if (sentTo) {
    return (
      <AuthCard title="Vérifiez votre boîte mail">
        <Alert>
          <AlertTitle>Demande enregistrée</AlertTitle>
          <AlertDescription>
            Un lien de confirmation a été envoyé à {sentTo}. Après confirmation, l&apos;administration validera votre
            inscription avant l&apos;accès à la plateforme.
          </AlertDescription>
        </Alert>
        <Link href={ROUTES.login} className="text-sm underline-offset-4 hover:underline">
          Retour à la connexion
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Inscription étudiant" description="Utilisez le matricule figurant au registre officiel.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <Field id="lastName" label="Nom">
            <Input id="lastName" name="lastName" autoComplete="family-name" required maxLength={100} />
          </Field>
          <Field id="firstName" label="Prénom">
            <Input id="firstName" name="firstName" autoComplete="given-name" required maxLength={100} />
          </Field>
        </div>
        <Field id="registrationNumber" label="Matricule">
          <Input id="registrationNumber" name="registrationNumber" required maxLength={50} />
        </Field>
        <Field id="dateOfBirth" label="Date de naissance (facultatif)">
          <Input id="dateOfBirth" name="dateOfBirth" type="date" autoComplete="bday" />
        </Field>
        <Field id="pseudo" label="Pseudo (facultatif)">
          <Input id="pseudo" name="pseudo" maxLength={200} />
        </Field>
        <Field id="phoneNumber" label="Téléphone (facultatif)">
          <Input id="phoneNumber" name="phoneNumber" type="tel" autoComplete="tel" maxLength={25} />
        </Field>
        <Field id="email" label="Adresse e-mail">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field
          id="password"
          label="Mot de passe"
          hint={`${PASSWORD_MIN_LENGTH} caractères minimum, avec au moins une lettre et un chiffre.`}
        >
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </Field>
        <Field id="confirmPassword" label="Confirmer le mot de passe">
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Envoi…" : "Envoyer ma demande"}
        </Button>
      </form>
      <span className="text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href={ROUTES.login} className="text-foreground underline-offset-4 hover:underline">
          Se connecter
        </Link>
      </span>
    </AuthCard>
  );
}
