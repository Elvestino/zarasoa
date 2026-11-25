import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";
import { blockCode, homeFor } from "@/module/user/infrastructure/server/guards";
import { ProfileRepository } from "@/module/user/infrastructure/repository/ProfileRepository";
import { RegistrationRequestRepository } from "@/module/student/infrastructure/repository/RegistrationRequestRepository";


export async function GET() {
  const db = await createSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const profile = await new ProfileRepository(db).findById(user.id);
  const home = profile ? homeFor(profile) : null;
  const code = blockCode(profile) ?? (home ? null : "NO_ROLE");

  // Seul un compte qui a réellement déposé une demande d'inscription obtient cette session limitée.
  if ((code === "ACCOUNT_PENDING_ADMIN" || code === "ACCOUNT_REJECTED") && !profile?.deletedAt) {
    const request = await new RegistrationRequestRepository(db).findMine(user.id);
    if (request) redirect(ROUTES.request);
  }

  if (code || !home) {
    await db.auth.signOut();
    redirect(`${ROUTES.login}?error=${code ?? "NO_ROLE"}`);
  }
  redirect(home);
}
