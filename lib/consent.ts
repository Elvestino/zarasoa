import { useSyncExternalStore } from "react";

/** Choix de cookies mémorisé dans le navigateur (localStorage) : « accepted » ou « refused ». */
export const CONSENT_KEY = "zarasoa-cookie-consent";
export type Consent = "accepted" | "refused";

const CHANGE_EVENT = "zarasoa:consent-change";
const OPEN_EVENT = "zarasoa:open-cookie-settings";

export function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "accepted" || value === "refused" ? value : null;
  } catch {
    return null;
  }
}

export function saveConsent(value: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* stockage indisponible : le choix vaut pour la page en cours */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** « pending » = rendu serveur (on n'affiche rien pour éviter un décalage d'hydratation), « none » = pas encore de choix. */
export function useConsent(): Consent | "none" | "pending" {
  return useSyncExternalStore(
    subscribe,
    () => readConsent() ?? "none",
    () => "pending",
  );
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenCookieSettings(callback: () => void) {
  window.addEventListener(OPEN_EVENT, callback);
  return () => window.removeEventListener(OPEN_EVENT, callback);
}
