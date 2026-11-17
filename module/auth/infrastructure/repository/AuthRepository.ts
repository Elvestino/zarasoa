import type { AuthUser, Credentials } from "../../domain/entities/AuthUser";
import { validateStudentRegistration, type StudentRegistration } from "../../domain/entities/StudentRegistration";
import { Email } from "../../domain/value-object/Email";
import { Password } from "../../domain/value-object/Password";
import type { IAuthRepository } from "../../interfaces/IAuthRepository";
import type { AuthEndpoint } from "../api/AuthEndpoint";

/** Implémentation de IAuthRepository. Utilisable côté navigateur et côté serveur (selon le client injecté). */
export class AuthRepository implements IAuthRepository {
  constructor(
    private readonly endpoint: AuthEndpoint,
    /** Origine du site (ex. https://zarasoa.mg) pour les liens des e-mails ; défaut : origine du navigateur. */
    private readonly siteUrl: string = typeof window !== "undefined" ? window.location.origin : "",
  ) {}

  async signIn(credentials: Credentials): Promise<AuthUser> {
    const { user } = await this.endpoint.login({
      email: Email.create(credentials.email),
      password: credentials.password, // pas de règle de complexité à la connexion : on ne bloque pas un ancien mot de passe
    });
    return user;
  }

  async signUpStudent(registration: StudentRegistration): Promise<void> {
    await this.endpoint.register(validateStudentRegistration(registration));
  }

  signOut(): Promise<void> {
    return this.endpoint.logout();
  }

  requestPasswordReset(email: string): Promise<void> {
    return this.endpoint.requestPasswordReset(
      Email.create(email),
      `${this.siteUrl}/auth/callback?next=/reset-password`,
    );
  }

  updatePassword(newPassword: string): Promise<void> {
    return this.endpoint.updatePassword(Password.create(newPassword));
  }

  getCurrentUser(): Promise<AuthUser | null> {
    return this.endpoint.currentUser();
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    return this.endpoint.onAuthStateChange(callback);
  }
}
