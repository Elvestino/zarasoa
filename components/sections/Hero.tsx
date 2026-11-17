import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { APP_DESCRIPTION, APP_NAME, ROUTES } from "@/lib/constants";

export function Hero() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center gap-6 px-4 py-20">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{APP_NAME}</h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        {APP_DESCRIPTION} Les professeurs publient, les étudiants approuvés consultent et déposent leurs devoirs.
      </p>
      <div className="flex gap-3">
        <Link href={ROUTES.login} className={buttonVariants({ size: "lg" })}>
          Se connecter
        </Link>
        <Link href={ROUTES.register} className={buttonVariants({ size: "lg", variant: "outline" })}>
          Inscription étudiant
        </Link>
      </div>
    </section>
  );
}
