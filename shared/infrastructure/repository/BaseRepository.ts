import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "../../errors/ApiError";
import type { Database } from "../supabase/database.types";

export type Db = SupabaseClient<Database>;

/**
 * Base des repositories Supabase. Le client (navigateur, serveur ou admin) est injecté :
 * le repository ne décide jamais lui-même du niveau de privilège.
 */
export abstract class BaseRepository {
  protected constructor(protected readonly db: Db) {}

  /** Lève une ApiError si la requête Supabase a échoué, sinon renvoie les données. */
  protected unwrap<T>(result: { data: T; error: PostgrestError | null }, action: string): T {
    if (result.error) {
      throw new ApiError(`${action} : ${result.error.message}`, 500, result.error.code || "DB_ERROR");
    }
    return result.data;
  }
}
