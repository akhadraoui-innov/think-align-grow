# Module — Admin & Observability

> Backoffice **SaaS Management** : pilotage des organisations, utilisateurs, rôles, abonnements, logs, observabilité, configurations IA.

## 🎯 Vision

Centraliser le pilotage opérationnel de la plateforme dans une interface dédiée à la SaaS Team (5 rôles : Super Admin, Customer Lead, Innovation Lead, Performance Lead, Product Actor).

## 🏛️ Jalons majeurs

### 2026-03-11 — PRD Admin & 12 rôles
- Définition de la hiérarchie de **12 rôles applicatifs** (5 SaaS + 7 Cabinet Client).
- Tables : `user_roles`, `teams`, `team_members`, `subscriptions`, `subscription_plans`, `activity_logs`.
- Edge functions : aucune au démarrage (CRUD direct via RLS).

### 2026-03-11 — Sprint 1 : Foundations
- Extension enum `app_role` avec 8 nouvelles valeurs.
- Création de 7 nouvelles tables.
- `AdminGuard.tsx` : protège toutes les routes `/admin/*` via `is_saas_team()`.
- `AdminShell.tsx` + `AdminSidebar.tsx` : layout dédié.

### 2026-03-11 — Sprint 2 : Dashboard & Organizations CRUD
- `AdminDashboard.tsx` : KPIs globaux.
- `AdminOrganizations.tsx` + `AdminOrganizationDetail.tsx` (8 onglets).

### 2026-03 — Sprint 3-N : Pages spécialisées

#### Organizations (`AdminOrganizationDetail.tsx`)
8 onglets :
- `OrgInfoTab.tsx` (identité, branding)
- `OrgMembersTab.tsx` (membres + rôles)
- `OrgTeamsTab.tsx` (équipes)
- `OrgToolkitsTab.tsx` (toolkits assignés)
- `OrgWorkshopsTab.tsx`
- `OrgSubscriptionTab.tsx` (plan + crédits)
- `OrgUsageTab.tsx` (consommation)
- `OrgActivityTab.tsx` (logs)
- `OrgAIConfigTab.tsx` (provider, modèles, prompts override)
- `OrgSimulatorTab.tsx`

#### Users (`AdminUserDetail.tsx`)
- `UserInfoTab.tsx`
- `UserOrgsTab.tsx`
- `UserRolesTab.tsx`
- `UserCreditsTab.tsx`
- `UserCardsTab.tsx`
- `UserChallengesTab.tsx`
- `UserWorkshopsTab.tsx`
- `UserActivityTab.tsx`

#### Toolkits (`AdminToolkitDetail.tsx`)
- `ToolkitInfoTab.tsx`
- `ToolkitPillarsTab.tsx`
- `ToolkitCardsTab.tsx`
- `ToolkitQuizTab.tsx`
- `ToolkitGamePlansTab.tsx`
- `ToolkitChallengesTab.tsx`
- `ToolkitOrgsTab.tsx`
- `ToolkitCardsBrowser.tsx`

#### Challenges (`AdminChallengeDetail.tsx`)
- `ChallengeInfoTab.tsx`
- `ChallengeSubjectsTab.tsx`
- `ChallengeSessionsTab.tsx`
- `ChallengeAnalysesTab.tsx`

### 2026-03 — Pages SaaS Management
- `AdminBilling.tsx` : abonnements, factures, plans.
- `AdminLogs.tsx` : journal d'activité (`activity_logs`).
- `AdminSettings.tsx` : configuration globale.
- `RolesPermissionsTab.tsx` : matrice rôles × permissions.

### 2026-04 — Modules verticaux

#### Academy
- `AdminAcademy.tsx` (hub)
- `AdminAcademyPaths.tsx` + détail
- `AdminAcademyFunctions.tsx` + détail
- `AdminAcademyPersonae.tsx`
- `AdminAcademyModuleDetail.tsx`
- `AdminAcademyCampaigns.tsx`
- `AdminAcademyCertificates.tsx`
- `AdminAcademyAssets.tsx`
- `AdminAcademyTracking.tsx`
- `AdminAcademyMap.tsx`

#### UCM
- `AdminUCM.tsx`
- `AdminUCMPrompts.tsx`
- `AdminUCMSectors.tsx`

#### Practice Studio
- `AdminPracticeStudio.tsx` (route `/admin/practices`).
- `AdminSimulator.tsx`, `AdminSimulatorTemplates.tsx`.

#### Business
- `AdminBusiness.tsx` (12 onglets — voir [Module Business & Revenue](./module-business-revenue.md)).

#### Design Innovation
- `AdminDesignInnovation.tsx` (hub challenges).

### 2026-04 — Observability
- `AdminObservability.tsx` (hub).
- `AdminObservabilityCatalogue.tsx` : catalogue cross-asset (paths, quizzes, exercises, practices, personae, campaigns).
- `AdminObservabilityMatrix.tsx` : matrice contributeurs × assets.
- Trigger DB `sync_observatory_asset()` : agrège metadata sur chaque update.
- Trigger DB `capture_asset_version()` : snapshot JSONB sur chaque update.

### 2026-04 — Hooks admin
- `useAdminBilling.ts`
- `useAdminChallenges.ts`
- `useAdminLogs.ts`
- `useAdminPractices.ts`
- `useAdminStats.ts`
- `useAdminToolkits.ts`
- `useAdminUserDetail.ts`
- `useAdminUsers.ts`
- `useAdminWorkshops.ts`
- `useAdminRole.ts` (gating SaaS Team)
- `useObservability.ts`
- `usePermissions.ts`
- `useQuotas.ts`

### 2026-04 — Crédits & Spending
- Table `user_credits` (balance, lifetime_earned).
- Table `credit_transactions` (amount, type, description).
- Fonction SQL `spend_credits(_user_id, _amount, _description)` SECURITY DEFINER avec lock atomique.
- Trigger `handle_new_user()` seed 10 crédits de bienvenue.
- Hooks : `useCredits.ts`, `useSpendCredits.ts`.

### 2026-04 — AI Configurations
- Table `ai_configurations` : provider, modèles chat/structured, temperature, max_tokens, prompts override par org.
- Table `ai_providers` : référentiel providers (OpenAI, Anthropic, Google, etc.).
- Hiérarchie : org override > global > Lovable AI Gateway (fallback).

### 2026-04 — Command Palette
- `CommandPalette.tsx` : ⌘K pour navigation rapide cross-admin.

## 📦 État actuel

- ✅ AdminGuard via `is_saas_team()`.
- ✅ Pilotage complet : organizations, users, toolkits, challenges, academy, UCM, practices, business.
- ✅ Observability cross-asset.
- ✅ Versioning + audit logs.
- ✅ Crédits transactionnels.
- ✅ AI configurations hiérarchiques.
- ✅ Command palette ⌘K.

## 🧠 Références mémoire

- `mem://product/role-hierarchy` — 12 rôles
- `mem://technical/permissions-architecture-roles` — 12 rôles détaillés
- `mem://product/monetization-model` — 40/30/30 free/credits/subscription
- `mem://ai/parametric-configuration` — Hiérarchie config IA
- `mem://auth/super-admin-identity` — Compte super-admin
