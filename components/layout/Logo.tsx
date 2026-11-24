import Image from "next/image";

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <Image src="/assets/img/logo-light-wordmark.png" alt="ZARASOA" width={620} height={143} className="h-12 w-auto dark:hidden" priority />
      <Image src="/assets/img/logo-dark-wordmark.png" alt="ZARASOA" width={620} height={143} className="hidden h-12 w-auto dark:block" priority />
    </span>
  );
}

export function LogoSmart() {
  return (
    <span className="flex items-center gap-2">
      <Image src="/assets/img/logo-light-icon.png" alt="" width={520} height={300} className="h-7 w-auto shrink-0 sm:h-8 dark:hidden" priority />
      <Image src="/assets/img/logo-dark-icon.png" alt="" width={520} height={307} className="hidden h-7 w-auto shrink-0 sm:h-8 dark:block" priority />
      <Image src="/assets/img/logo-light-wordmark.png" alt="ZARASOA" width={620} height={138} className="h-5 w-auto shrink-0 sm:h-6 dark:hidden" priority />
      <Image src="/assets/img/logo-dark-wordmark.png" alt="ZARASOA" width={620} height={143} className="hidden h-5 w-auto shrink-0 sm:h-6 dark:block" priority />
    </span>
  );
}

/**
 * Icône seule (sidebar réduite). Hauteur fixe + `w-auto` + `shrink-0` + `max-w-none` : le ratio du logo est
 * conservé, il n'est jamais écrasé par le conteneur flex (cause de la déformation en mode miniature).
 */
export function LogoIcon() {
  return (
    <span className="flex items-center justify-center">
      <Image src="/assets/img/logo-light-icon.png" alt="" width={520} height={300} className="h-5 w-auto max-w-none shrink-0 dark:hidden" priority />
      <Image src="/assets/img/logo-dark-icon.png" alt="" width={520} height={307} className="hidden h-5 w-auto max-w-none shrink-0 dark:block" priority />
    </span>
  );
}
