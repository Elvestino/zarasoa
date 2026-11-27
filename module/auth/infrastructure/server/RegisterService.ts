import "server-only";
import { ApiError } from "@/shared/errors/ApiError";
import type { Db } from "@/shared/infrastructure/repository/BaseRepository";
import type { StudentRegistration } from "../../domain/entities/StudentRegistration";

/**
 * Inscription étudiante (US-011, US-014) : contrôle du matricule, création du compte Supabase Auth
 * (le trigger `handle_new_user` crée le profil), puis de la demande `student_registration_requests`.
 * Cette insertion passe par la clé secrète car, tant que l'e-mail n'est pas confirmé, l'utilisateur
 * n'a pas de session (la RLS exige auth.uid()).
 */
export class RegisterService {
  constructor(
    private readonly userDb: Db,
    private readonly adminDb: () => Db,
    private readonly siteUrl: string,
  ) {}

  async register(input: StudentRegistration): Promise<void> {
    // Avant `signUp` : sinon Supabase enverrait un e-mail de confirmation pour une demande qui sera refusée.
    await this.assertRegistrationNumberFree(input.registrationNumber);

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
      // Cause réelle côté Supabase Auth (visible dans le terminal `npm run dev`) : le client, lui, ne reçoit qu'un code générique.
      console.error("[auth] signUp a échoué :", { status: error.status, code: error.code, message: error.message });
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
      // Filet de sécurité : deux inscriptions simultanées avec le même matricule passent le contrôle ci-dessus,
      // mais l'index unique n'en laisse survivre qu'une.
      if (insertError.code === "23505") throw registrationNumberTaken();
      console.error("[auth] insertion de la demande d'inscription :", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      throw new ApiError("Inscription impossible pour le moment.", 500, "REGISTER_FAILED");
    }
  }

  private async assertRegistrationNumberFree(registrationNumber: string): Promise<void> {
    const { data, error } = await this.adminDb().rpc("registration_number_in_use", { p_number: registrationNumber });
    if (error) {
      console.error("[auth] registration_number_in_use a échoué :", { code: error.code, message: error.message });
      return;
    }
    if (data === true) throw registrationNumberTaken();
  }
}

const registrationNumberTaken = () =>
  new ApiError("Ce matricule est déjà utilisé par une autre demande.", 409, "REGISTRATION_NUMBER_TAKEN");

const emailTaken = () => new ApiError("Cette adresse e-mail est déjà utilisée.", 409, "EMAIL_ALREADY_USED");
