import type { Metadata } from "next";
import { ResetPasswordForm } from "@/module/auth/presentation/components/ResetPasswordForm";

export const metadata: Metadata = { title: "Nouveau mot de passe — ZARASOA" };

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
