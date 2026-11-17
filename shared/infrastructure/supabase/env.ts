// Accès DIRECT à process.env.NEXT_PUBLIC_* obligatoire : Next.js ne les injecte
// dans le bundle navigateur que s'ils sont écrits littéralement.
function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name} (voir .env.local)`);
  }
  return value;
}

export function getPublicEnv() {
  return {
    url: required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    publishableKey: required(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ),
  };
}

/** À n'appeler que côté serveur. */
export function getSecretKey(): string {
  return required(process.env.SUPABASE_SECRET_KEY, "SUPABASE_SECRET_KEY");
}
