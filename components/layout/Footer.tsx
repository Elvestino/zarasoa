import { APP_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto w-full max-w-5xl px-4 py-4 text-sm text-muted-foreground">
        © {APP_NAME} — Plateforme universitaire
      </div>
    </footer>
  );
}
