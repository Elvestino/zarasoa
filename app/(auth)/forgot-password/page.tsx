import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/module/auth/presentation/components/ForgotPasswordForm";

export const metadata: Metadata = { title: "Mot de passe oublié — ZARASOA" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
