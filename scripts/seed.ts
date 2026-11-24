
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../shared/infrastructure/supabase/database.types";

type RoleCode = "super_admin" | "professor" | "student";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variable manquante : ${name} (à définir dans .env.local)`);
  }
  return value;
}

const optional = (name: string, fallback: string): string => process.env[name]?.trim() || fallback;

interface Account {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: RoleCode;
}

async function main() {
  const url = required("NEXT_PUBLIC_SUPABASE_URL");
  const secretKey = required("SUPABASE_SECRET_KEY");

  const adminAccount: Account = {
    email: required("SEED_ADMIN_EMAIL").toLowerCase(),
    password: required("SEED_ADMIN_PASSWORD"),
    firstName: optional("SEED_ADMIN_FIRST_NAME", "Admin"),
    lastName: optional("SEED_ADMIN_LAST_NAME", "Zarasoa"),
    role: "super_admin",
  };
  // Comptes exemples (démonstration) : valeurs par défaut utilisables telles quelles en local.
  const studentAccount: Account = {
    email: optional("SEED_STUDENT_EMAIL", "etudiant.exemple@zarasoa.test").toLowerCase(),
    password: optional("SEED_STUDENT_PASSWORD", "Etudiant#2026"),
    firstName: "Fanja",
    lastName: "Rakotoarisoa",
    role: "student",
  };
  const professorAccount: Account = {
    email: optional("SEED_PROFESSOR_EMAIL", "professeur.exemple@zarasoa.test").toLowerCase(),
    password: optional("SEED_PROFESSOR_PASSWORD", "Professeur#2026"),
    firstName: "Hery",
    lastName: "Randrianasolo",
    role: "professor",
  };

  for (const account of [adminAccount, studentAccount, professorAccount]) {
    if (account.password.length < 8) {
      throw new Error(`Le mot de passe de ${account.email} doit contenir au moins 8 caractères.`);
    }
  }

  // La clé secrète contourne RLS et les gardes (auth.uid() est nul) : ce script ne doit tourner qu'en local / en CI de confiance.
  const admin = createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ─── Super admin ────────────────────────────────────────────────────────────
  console.log("— Super admin");
  const adminId = await ensureAccount(adminAccount, null);

  // ─── Données de référence pour l'étudiant exemple ───────────────────────────
  console.log("\n— Catalogue d'exemple");
  const { filiereId, parcoursId } = await ensureExampleCatalog(adminId);
  const { data: level, error: levelError } = await admin.from("academic_levels").select("id").eq("code", "L1").single();
  if (levelError || !level) throw new Error(`Niveau L1 introuvable (migrations appliquées ?) : ${levelError?.message ?? "vide"}`);

  // ─── Étudiant exemple ───────────────────────────────────────────────────────
  console.log("\n— Étudiant exemple");
  const studentId = await ensureAccount(studentAccount, adminId);
  const { error: studentError } = await admin.from("student_profiles").upsert(
    {
      user_id: studentId,
      registration_number: "EX-0001",
      current_filiere_id: filiereId,
      current_parcours_id: parcoursId,
      current_level_id: level.id,
      enrollment_status: "active",
      approved_at: new Date().toISOString(),
      approved_by: adminId,
    },
    { onConflict: "user_id" },
  );
  if (studentError) throw new Error(`Fiche étudiante : ${studentError.message}`);
  console.log("• Fiche étudiante (matricule EX-0001, Informatique / Génie logiciel / L1)");

  // ─── Professeur exemple ─────────────────────────────────────────────────────
  console.log("\n— Professeur exemple");
  const professorId = await ensureAccount(professorAccount, adminId);
  const { error: professorError } = await admin.from("professor_profiles").upsert(
    {
      user_id: professorId,
      employee_number: "PROF-EX-001",
      professional_title: "Maître de conférences",
      department_name: "Informatique",
      is_active: true,
    },
    { onConflict: "user_id" },
  );
  if (professorError) throw new Error(`Fiche professeur : ${professorError.message}`);
  console.log("• Fiche professeur (PROF-EX-001)");

  console.log("\n✔ Seed terminé. Comptes disponibles :");
  console.log(`   Admin       : ${adminAccount.email}`);
  console.log(`   Étudiant    : ${studentAccount.email}  /  ${studentAccount.password}`);
  console.log(`   Professeur  : ${professorAccount.email}  /  ${professorAccount.password}`);


  async function ensureAccount(account: Account, assignedBy: string | null): Promise<string> {
    const { email, password, firstName, lastName, role } = account;
    const metadata = { first_name: firstName, last_name: lastName };
    const existingId = await findAuthUserId(email);
    let userId: string;

    if (existingId) {
      const { error } = await admin.auth.admin.updateUserById(existingId, {
        password,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (error) throw new Error(`Mise à jour de l'utilisateur Auth (${email}) : ${error.message}`);
      userId = existingId;
      console.log(`• Utilisateur Auth existant mis à jour : ${email}`);
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (error || !data.user) throw new Error(`Création de l'utilisateur Auth (${email}) : ${error?.message ?? "réponse vide"}`);
      userId = data.user.id;
      console.log(`• Utilisateur Auth créé : ${email}`);
    }

    // Profil : normalement créé par le trigger on_auth_user_created ; on le recrée s'il a été effacé (cas d'un reset partiel).
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        account_status: "approved",
        failed_login_count: 0,
        locked_at: null,
        deactivated_at: null,
        deleted_at: null,
      },
      { onConflict: "id" },
    );
    if (profileError) throw new Error(`Profil (${email}) : ${profileError.message}`);
    console.log("• Profil approuvé");

    // Rôle (un seul rôle actif par utilisateur et par code)
    const { data: activeRole, error: roleLookupError } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role_code", role)
      .is("revoked_at", null)
      .maybeSingle();
    if (roleLookupError) throw new Error(`Lecture du rôle (${email}) : ${roleLookupError.message}`);

    if (activeRole) {
      console.log(`• Rôle ${role} déjà attribué`);
    } else {
      const { error: roleError } = await admin.from("user_roles").insert({ user_id: userId, role_code: role, assigned_by: assignedBy });
      if (roleError) throw new Error(`Attribution du rôle (${email}) : ${roleError.message}`);
      console.log(`• Rôle ${role} attribué`);
    }
    return userId;
  }

  /** Filière « Informatique » et parcours « Génie logiciel » d'exemple (réutilisés s'ils existent déjà). */
  async function ensureExampleCatalog(createdBy: string): Promise<{ filiereId: string; parcoursId: string }> {
    const { data: filiere, error: filiereError } = await admin
      .from("filieres")
      .upsert({ code: "INFO", name: "Informatique", created_by: createdBy }, { onConflict: "code", ignoreDuplicates: true })
      .select("id")
      .maybeSingle();
    if (filiereError) throw new Error(`Filière d'exemple : ${filiereError.message}`);
    let filiereId = filiere?.id;
    if (!filiereId) {
      // ignoreDuplicates ne renvoie rien quand la filière existe déjà : on la relit.
      const { data, error } = await admin.from("filieres").select("id").eq("code", "INFO").single();
      if (error || !data) throw new Error(`Filière d'exemple : ${error?.message ?? "introuvable"}`);
      filiereId = data.id;
    }

    const { data: parcoursRow, error: parcoursError } = await admin
      .from("parcours")
      .upsert({ filiere_id: filiereId, code: "GL", name: "Génie logiciel", created_by: createdBy }, { onConflict: "filiere_id,code", ignoreDuplicates: true })
      .select("id")
      .maybeSingle();
    if (parcoursError) throw new Error(`Parcours d'exemple : ${parcoursError.message}`);
    let parcoursId = parcoursRow?.id;
    if (!parcoursId) {
      const { data, error } = await admin.from("parcours").select("id").eq("filiere_id", filiereId).eq("code", "GL").single();
      if (error || !data) throw new Error(`Parcours d'exemple : ${error?.message ?? "introuvable"}`);
      parcoursId = data.id;
    }
    console.log("• Filière Informatique / parcours Génie logiciel");
    return { filiereId, parcoursId };
  }

  /** Cherche un utilisateur Auth par e-mail (l'API n'offre pas de recherche directe : on pagine). */
  async function findAuthUserId(target: string): Promise<string | null> {
    const perPage = 200;
    for (let page = 1; ; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(`Liste des utilisateurs Auth : ${error.message}`);
      const found = data.users.find((u) => u.email?.toLowerCase() === target);
      if (found) return found.id;
      if (data.users.length < perPage) return null;
    }
  }
}

main().catch((err: unknown) => {
  console.error(`\n✖ Seed échoué : ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
