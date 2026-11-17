import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/module/auth/presentation/components/LoginForm";

export const metadata: Metadata = { title: "Connexion — ZARASOA" };

export default function LoginPage() {
  // LoginForm lit les paramètres d'URL : Suspense requis avec cacheComponents.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
