"use client";

import Script from "next/script";
import { useEffect } from "react";
import { useConsent } from "@/lib/consent";

// Mesure d'audience Google Analytics 4 : activée seulement si NEXT_PUBLIC_GA_MEASUREMENT_ID est défini
// ET si le visiteur a accepté les cookies. Sans consentement, aucun script n'est chargé.
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
const VALID_ID = /^G-[A-Z0-9]{6,}$/.test(GA_ID);

export function Analytics() {
  const consent = useConsent();

  useEffect(() => {
    if (!VALID_ID) return;
    // Si le visiteur retire son accord après le chargement, on coupe l'envoi des mesures.
    (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = consent !== "accepted";
  }, [consent]);

  if (!VALID_ID || consent !== "accepted") return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
