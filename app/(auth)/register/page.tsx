import type { Metadata } from "next";
import { RegisterForm } from "@/module/auth/presentation/components/RegisterForm";

export const metadata: Metadata = { title: "Inscription — ZARASOA" };

export default function RegisterPage() {
  return <RegisterForm />;
}
