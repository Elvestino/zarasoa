import { getContainer } from "@/lib/container";
import { displayName } from "../../domain/entities/Profile";
import { getCurrentProfile } from "../../domain/use-cases/getCurrentProfile";

/** Server Component : affiche l'utilisateur connecté via le use case du domaine. */
export async function CurrentUserBadge() {
  const { auth, profiles } = await getContainer();
  const profile = await getCurrentProfile({ auth, profiles });

  if (!profile) return <span>Non connecté</span>;
  return (
    <span>
      {displayName(profile)} — {profile.roles.join(", ") || "aucun rôle"} ({profile.accountStatus})
    </span>
  );
}
