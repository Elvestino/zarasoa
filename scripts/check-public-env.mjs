// Garde-fou exécuté avant `next build` : aucune clé secrète ne doit être exposée au navigateur.
// Toute variable NEXT_PUBLIC_* est copiée dans le JavaScript public ; une clé secrète n'y a donc pas sa place.
import { existsSync } from "node:fs";

for (const file of [".env", ".env.local", ".env.production", ".env.production.local"]) {
  if (existsSync(file)) {
    try {
      process.loadEnvFile(file);
    } catch {
      /* fichier illisible : ignoré */
    }
  }
}

function jwtRole(value) {
  try {
    const payload = JSON.parse(Buffer.from(value.split(".")[1], "base64url").toString("utf8"));
    return payload.role;
  } catch {
    return null;
  }
}

const problems = [];
for (const [name, value] of Object.entries(process.env)) {
  if (!name.startsWith("NEXT_PUBLIC_") || !value) continue;
  if (/secret|service_role|private|password|passwd/i.test(name)) problems.push(`${name} : le nom suggère une valeur secrète`);
  if (value.startsWith("sb_secret_")) problems.push(`${name} : contient une clé secrète Supabase (sb_secret_…)`);
  if (jwtRole(value) === "service_role") problems.push(`${name} : contient une clé Supabase service_role`);
}

if (problems.length > 0) {
  console.error("\n✖ Clé secrète exposée au navigateur :\n  - " + problems.join("\n  - "));
  console.error("\nRetirez le préfixe NEXT_PUBLIC_ : une clé secrète ne doit être lue que côté serveur.\n");
  process.exit(1);
}
console.log("✔ Aucune clé secrète dans les variables NEXT_PUBLIC_*.");
