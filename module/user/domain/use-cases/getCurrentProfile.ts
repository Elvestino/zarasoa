import type { IAuthRepository } from "@/module/auth/interfaces/IAuthRepository";
import type { IProfileRepository } from "../../interfaces/IProfileRepository";
import type { Profile } from "../entities/Profile";

interface Deps {
  auth: IAuthRepository;
  profiles: IProfileRepository;
}

/** Profil de l'utilisateur connecté, ou null s'il n'y a pas de session. */
export async function getCurrentProfile({ auth, profiles }: Deps): Promise<Profile | null> {
  const user = await auth.getCurrentUser();
  return user ? profiles.findById(user.id) : null;
}
