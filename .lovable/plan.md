

## Audit global — Hack & Show (Sprints 1-6)

### Back-office Admin : solide et complet

| Module | Statut | Commentaire |
|--------|--------|-------------|
| Dashboard | OK | Stats live, graphiques, activite recente |
| Organisations | OK | CRUD complet, 8 onglets, structure groupe/filiale |
| Utilisateurs | OK | Fiche riche, roles, credits, activite |
| Toolkits | OK | CRUD piliers/cartes/challenges/quiz, import CSV |
| Workshops | OK | Liste admin avec jointures |
| Billing | OK | Plans CRUD, abonnements, credits par org, graphiques |
| Logs | OK | Filtres, pagination server-side, export CSV, display_name |
| Design Innovation | Placeholder | "Sprint 8" |
| Settings | Placeholder | "Sprint 10" |

### Front-office utilisateur : lacunes majeures identifiees

| Probleme | Impact | Severite |
|----------|--------|----------|
| **Page Profil statique** — affiche "Bienvenue / Se connecter" meme pour un user connecte. Aucune vue de son profil, pas d'edition. | L'utilisateur connecte ne peut ni voir ni modifier ses infos | Critique |
| **Pas de contexte organisation** — aucun selecteur d'org cote user. Les workshops ne sont pas lies a une org a la creation. | Rupture du modele multi-tenant | Critique |
| **Quiz non persistant** — les scores restent en `useState` local, perdus au refresh. `quiz_results` existe en DB mais n'est pas utilise dans Lab.tsx | Perte de progression utilisateur | Eleve |
| **Credits non consommes** — le systeme de credits existe (DB + admin) mais aucune action utilisateur ne debite reellement de credits | Feature billing inactive | Eleve |
| **Outils IA "Reflexion" et "Livrables"** — les boutons existent mais redirigent vers un ChatInterface generique sans prompt specifique | Promesse UX non tenue | Moyen |
| **Pas de quota enforcement** — les quotas definis dans `subscription_plans.quotas` ne sont jamais verifies | Modele SaaS incomplet | Moyen |

### Architecture : points forts

- Hooks bien structures, separation nette admin/front
- RLS exhaustives avec fonctions SECURITY DEFINER
- Permissions granulaires via `usePermissions`
- Toolkit 100% dynamique (DB-driven, plus de mock)
- Design system coherent (typographie, couleurs, composants)

---

## Sprint 7 — Profil utilisateur & contexte multi-tenant

Le sprint le plus impactant est de combler le vide cote utilisateur connecte : profil fonctionnel, contexte organisation, persistance quiz.

### 1. Page Profil authentifiee

Transformer `Profile.tsx` pour detecter l'etat de connexion :
- **Non connecte** : garder la vue actuelle (CTA login)
- **Connecte** : afficher le vrai profil avec sections editables :
  - Avatar + display_name + job_title + department
  - Stats : XP, credits, cartes vues, quiz completes
  - Organisations (liste avec roles)
  - Bouton edition (dialog ou inline) → mutation `profiles` update
  - Bouton deconnexion

### 2. Selecteur d'organisation

- Composant `OrgSwitcher` dans la sidebar (sous le logo ou dans le footer)
- Query `organization_members` filtre par `user_id` → liste des orgs
- Stocker l'org active dans un React Context (`OrgProvider`)
- Le contexte org sera utilise par Workshop/Challenge pour rattacher les sessions

### 3. Persistance des scores quiz

- Dans `Lab.tsx` / `QuizEngine`, apres completion → upsert dans `quiz_results` (table existante)
- Au chargement de Lab, fetcher le dernier `quiz_results` pour pre-remplir le RadarChart
- Afficher "Votre dernier diagnostic" si des scores existent

### 4. Liaison Workshop → Organisation

- A la creation d'un workshop, pre-remplir `organization_id` avec l'org active du contexte
- Afficher le nom de l'org dans la liste "Mes workshops"

### Fichiers

| Action | Fichier |
|--------|---------|
| Rewrite | `src/pages/Profile.tsx` — vue authentifiee + edition |
| Create | `src/contexts/OrgContext.tsx` — provider + hook `useActiveOrg` |
| Create | `src/components/layout/OrgSwitcher.tsx` — selecteur d'org |
| Edit | `src/components/layout/AppSidebar.tsx` — integrer OrgSwitcher |
| Edit | `src/pages/Lab.tsx` — persistance quiz_results |
| Edit | `src/components/game/QuizEngine.tsx` — save scores en DB |
| Edit | `src/pages/Workshop.tsx` — passer org_id a la creation |
| Edit | `src/App.tsx` — wrapper OrgProvider |
| Update | `.lovable/plan.md` |

Aucune migration DB necessaire — toutes les tables (`profiles`, `organization_members`, `quiz_results`, `workshops.organization_id`) existent deja.

