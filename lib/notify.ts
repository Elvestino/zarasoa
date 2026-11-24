"use client";

import { toast } from "@/components/ui/toast";

/** Notifications de l'application : toujours le toast shadcn (monté une fois dans app/layout.tsx). */
export const notify = {
  success: (title: string, description?: string) => toast.add({ type: "success", title, description }),
  error: (title: string, description?: string) => toast.add({ type: "error", title, description, timeout: 7000 }),
  info: (title: string, description?: string) => toast.add({ type: "info", title, description }),
};
