import "server-only";
import { ApiError } from "@/shared/errors/ApiError";
import type { Db } from "@/shared/infrastructure/repository/BaseRepository";
import type { StudentRegistration } from "../../domain/entities/StudentRegistration";

/**
 * Inscription étudiante : création du compte Supabase Auth (le trigger `handle_new_user` crée le profil),
 * puis de la demande `student_registration_requests`. Cette insertion passe par la clé secrète car,
 * tant que l'e-mail n'est pas confirmé, l'utilisateur n'a pas de session (la RLS exige auth.uid()).
 */
export class RegisterService {
  constructor(
    private readonly userDb: Db,
    private readonly adminDb: () => Db,
    private readonly siteUrl: string,
  ) {}

  async register(input: StudentRegistration): Promise<void> {
    const { data, error } = await this.userDb.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${this.siteUrl}/auth/callback?next=/login`,
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          pseudo: input.pseudo ?? "",
          phone_number: input.phoneNumber ?? "",
        },
      },
    });

    if (error) {
      if (error.code === "user_already_exists") throw emailTaken();
      if (error.code === "weak_password") throw new ApiError(error.message, 422, "WEAK_PASSWORD");
      throw new ApiError("Inscription impossible pour le moment.", error.status ?? 500, "REGISTER_FAILED");
    }
    const user = data.user;
    if (!user) throw new ApiError("Inscription impossible pour le moment.", 500, "REGISTER_FAILED");
    // Supabase masque les doublons : un e-mail déjà inscrit renvoie un utilisateur sans identité.
    if (user.identities?.length === 0) throw emailTaken();

    const admin = this.adminDb();
    const { error: insertError } = await admin.from("student_registration_requests").insert({
      user_id: user.id,
      registration_number: input.registrationNumber,
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      phone_number: input.phoneNumber ?? null,
      declared_date_of_birth: input.dateOfBirth ?? null,
    });

    if (insertError) {
      // Pas de compte orphelin sans demande : on annule la création Auth (le profil part en cascade).
      await admin.auth.admin.deleteUser(user.id);
      if (insertError.code === "23505") {
        throw new ApiError("Ce matricule est déjà utilisé par une autre demande.", 409, "REGISTRATION_NUMBER_TAKEN");
      }
      console.error("[auth] insertion de la demande d'inscription :", insertError.message);
      throw new ApiError("Inscription impossible pour le moment.", 500, "REGISTER_FAILED");
    }
  }
}

const emailTaken = () => new ApiError("Cette adresse e-mail est déjà utilisée.", 409, "EMAIL_ALREADY_USED");
