import type { Profile } from "../domain/entities/Profile";

export interface IProfileRepository {
  findById(id: string): Promise<Profile | null>;
}
