# ZARASOA — Plateforme universitaire

Plateforme qui centralise les **cours, ressources pédagogiques et devoirs** d'une université.
Trois rôles : **étudiant**, **professeur**, **super administrateur**.

- Les professeurs publient des cours et des devoirs dans les matières qui leur sont affectées.
- Les étudiants approuvés accèdent uniquement aux contenus de leur filière, parcours et niveau (L1 à M2), et déposent leurs devoirs avant la date limite.
- Le super administrateur importe le registre officiel des étudiants, valide les inscriptions, gère le catalogue et les affectations.

La conception complète (tables, règles, User Stories, tests) est dans le document **ZARASOA v2.1** (`docs/ZARASOA_v2.1.docx`).

## Stack

| Couche | Technologie |
| --- | --- |
| Interface | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Authentification | Supabase Auth |
| Données | Supabase PostgreSQL + RLS |
| Fichiers | Supabase Storage (buckets privés) |
| Hébergement | Vercel ou Netlify + Supabase |

## Prérequis

- Node.js 20 ou plus (LTS)
- Git
- Accès au projet Supabase `zarasoa` (invitation de l'équipe)

## Installation

```bash
git clone <URL_DU_DEPOT> zarasoa
cd zarasoa
npm install
cp .env.example .env.local
```

Ouvrir `.env.local` et remplir les valeurs vides (voir la section suivante), puis :

```bash
npm run dev
```

L'application est disponible sur http://localhost:3000.

## Variables d'environnement

Elles sont décrites dans `.env.example`. Résumé :

| Variable | Où la trouver | Visible du navigateur |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API | Oui |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase > Project Settings > API Keys (clé publiable) | Oui |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` en local | Oui |
| `SUPABASE_SECRET_KEY` | Supabase > API Keys > Secret keys (canal privé) | **Non, serveur uniquement** |
| `SUPABASE_PROJECT_REF` | Référence du projet (CLI) | Non |
| `DATABASE_URL` | Supabase > Connect, avec le mot de passe de la base | **Non** |

Diagnostic de la connexion (dev uniquement) : http://localhost:3000/api/health

**Règles de sécurité**

- Ne jamais committer `.env.local`, un mot de passe ou une clé secrète `SUPABASE_SECRET_KEY`.
- Ne jamais écrire un secret dans le README, le code, une issue ou une capture d'écran.
- La clé secrète contourne la RLS : elle n'est utilisée que dans du code serveur (actions serveur, routes API).
- Une page protégée ou un bouton masqué ne remplace pas la RLS : la base doit refuser toute action non autorisée.

## Base de données et migrations

Tout changement de schéma passe par un **fichier de migration SQL versionné** dans `supabase/migrations/`, jamais par des modifications manuelles dans le tableau de bord. Ainsi les deux membres ont toujours la même base.

```bash
npx supabase login
npx supabase link --project-ref ypptglkpghojjwhofdvm
npx supabase migration new nom_de_la_migration   # crée un fichier horodaté
npx supabase db push                              # applique les migrations
```

Conventions (voir le document de conception) :

- tables et colonnes en `snake_case`, clés primaires `UUID DEFAULT gen_random_uuid()` ;
- RLS activée sur toutes les tables exposées, avec des politiques explicites ;
- désactivation/archivage plutôt que suppression destructive ;
- fichiers dans Storage, métadonnées dans PostgreSQL.


## Architecture (DDD)

```
app/                 routes Next.js (pages, route handlers /api, auth/callback)
proxy.ts             rafraîchit la session Supabase, redirections (remplace middleware.ts en Next 16)
components/          UI partagée (ui/, layout/, sections/)
lib/                 constants, container.ts (composition root serveur)
shared/
  errors/            DomainError, ApiError
  infrastructure/    supabase/ (clients, env, types), repository/BaseRepository, api/ (Endpoint, httpClient)
  providers/         AuthProviders (composition root navigateur)
module/<nom>/
  domain/            entities, value-object, use-cases (aucune dépendance Supabase)
  interfaces/        ports (IxxxRepository)
  infrastructure/    repository/, api/, server/ (implémentations Supabase)
  presentation/      components/, hooks/
```

Modules : `auth`, `user` (profils, rôles), `catalog` (niveaux). Sens des dépendances : presentation → interfaces/domain ← infrastructure.
Types de la base : `npm run db:types` (après `npx supabase login` et `link`).

## Plan de développement (sprints)

0. Conception · 1. Fondation (Auth, profils, rôles, blocage de compte) · 2. Préinscription · 3. Catalogue (filières, parcours, niveaux, matières) · 4. Import du registre · 5. Validation des étudiants · 6. Professeurs et affectations · 7. Cours · 8. Ressources · 9. Devoirs · 10. Espaces étudiant/professeur · 11. Administration · 12. Tests · 13. Production

