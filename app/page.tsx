import { Suspense } from "react";
import { Hero } from "@/components/sections/Hero";
import { CurrentUserBadge } from "@/module/user/presentation/components/CurrentUserBadge";

export default function Home() {
  return (
    <>
      <Hero />
      <div className="mx-auto w-full max-w-5xl px-4 pb-6 text-sm text-muted-foreground">
        {/* Lit les cookies de session : doit rester dans un Suspense (cacheComponents). */}
        <Suspense fallback={<span>…</span>}>
          <CurrentUserBadge />
        </Suspense>
      </div>
    </>
  );
}
