import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** Link / useRouter / usePathname / redirect (sans préfixe de langue : les URLs restent /login, /register…). */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
