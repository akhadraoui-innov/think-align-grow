

# Challenge du plan UCM vs Cahier des charges "AI Value Builder"

## Verdict : 7 écarts critiques entre mon plan et le CDC

### 1. Mon plan réutilise l'architecture existante — le CDC demande une architecture tenant-first dédiée

**Mon plan** : tables `ucm_*` avec `organization_id`, RLS via `is_org_member()` existant.
**Le CDC** : table `tenants` dédiée avec slug, domain, plan, limites, branding, IA config — une isolation tenant complète avec `tenant_id` sur TOUTES les tables, pas `organization_id`.

**Problème** : la table `organizations` existante n'a pas les champs nécessaires (slug, domain, max_users, max_projects, plan, branding, custom_system_prompt). On ne peut pas simplement ajouter `organization_id` et considérer le multi-tenant comme fait.

**Décision requise** : soit on enrichit `organizations` avec les champs manquants (pragmatique, évite la duplication), soit on crée `tenants` séparément (isolation pure mais complexité accrue avec les orgs existantes).

### 2. Permissions : le CDC définit un système UCM-spécifique, mon plan n'en a pas

**Mon plan** : s'appuie sur `usePermissions` existant sans rien ajouter.
**Le CDC** : permissions granulaires dédiées — `projects.create`, `uc.generate`, `uc.analyze_detailed`, `export.docx`, `ai_config.manage`, `sectors.manage`. Le mode `detailed` est bloqué pour le plan Starter.

**Impact** : sans permissions spécifiques UCM, impossible de différencier les plans (Starter n'a pas le mode detailed, pas de synthèse globale, pas de chat). Il faut ajouter un domaine `ucm` dans `permission_definitions` avec les clés correspondantes.

### 3. Quotas : mon plan ne les mentionne pas, le CDC en fait un pilier

**Le CDC** : `quota_usage` avec métriques mensuelles (uc_generations, analysis_generations, exports, total_tokens, total_cost_cents) + `quota_alerts` + vérification à chaque appel IA.
**Mon plan** : zéro gestion de quotas.

**Impact critique** : sans quotas, pas de SaaS viable. Chaque edge function doit vérifier les limites avant d'appeler l'IA.

### 4. Paramétrage IA : mon plan sous-estime la granularité

**Mon plan** : réutilise `ai_configurations` existant.
**Le CDC** : `tenant_ai_config` avec config différente par type de tâche (uc_generation vs analysis vs chat — modèle, température, max_tokens séparés), `tenant_ai_keys` avec chiffrement, `prompt_templates` éditables par tenant et par section.

**L'existant** couvre partiellement (ai_configurations a model_chat, model_structured, prompts JSONB) mais il manque la granularité par tâche UCM et les templates de prompts versionnés.

### 5. Export DOCX : mon plan l'ignore, le CDC en fait une feature clé

Le prototype v13 contient un générateur Word complet. Mon plan ne mentionne aucun export. Il faut une edge function `ucm-export` dédiée.

### 6. UC Context (7 champs) : mon plan a la table mais pas l'UX

Le CDC détaille les 7 champs contextuels par UC (situation, tools, team, volumes, pain_points, objectives, constraints) + champs custom extensibles. Mon plan a `ucm_uc_contexts` mais ne décrit pas le formulaire ni l'interaction.

### 7. Seed data : mon plan est flou, le CDC est exhaustif

Le CDC exige que les 35 secteurs, les fonctions, le knowledge sectoriel, les 6 sections d'analyse avec leurs prompts brief/detailed, et les 7 sections globales soient tous seedés en DB. Mon plan mentionne le seed mais ne structure pas les prompts par section.

---

## Plan révisé — AI Value Builder intégré à GROWTHINNOV

### Phase 1 : Schema DB (migration unique)

**Tables à créer (11 tables)** :

| Table | Rôle | Clé |
|-------|------|-----|
| `ucm_projects` | Projets d'analyse IA | organization_id, created_by |
| `ucm_use_cases` | Use cases générés | project_id |
| `ucm_uc_contexts` | Contexte métier par UC (7 champs + custom) | use_case_id |
| `ucm_analyses` | Analyses par section×mode versionnées | use_case_id, section_id, mode, version |
| `ucm_global_sections` | Synthèse globale versionnée | project_id, section_id, version |
| `ucm_chat_messages` | Chat consultant IA | project_id |
| `ucm_exports` | Historique exports DOCX | project_id |
| `ucm_sectors` | Secteurs + fonctions + knowledge | organization_id nullable (null=global) |
| `ucm_analysis_sections` | 6 dimensions d'analyse + prompts brief/detailed | organization_id nullable |
| `ucm_global_analysis_sections` | 7 sections globales + prompts | organization_id nullable |
| `ucm_quota_usage` | Compteurs mensuels par org | organization_id, period |

**Enrichir `organizations`** : ajouter colonnes `ucm_max_projects`, `ucm_max_uc_per_project`, `ucm_max_analyses_per_month`, `ucm_max_exports_per_month` (ou JSONB `ucm_quotas`).

**Permissions** : ajouter domaine `ucm` dans `permission_definitions` avec : `ucm.projects.create`, `ucm.projects.read_all`, `ucm.uc.generate`, `ucm.uc.analyze`, `ucm.uc.analyze_detailed`, `ucm.global.generate`, `ucm.chat.use`, `ucm.export.docx`, `ucm.sectors.manage`, `ucm.config.manage`.

**Seed** : 35 secteurs, 6 analysis sections avec prompts, 7 global sections avec prompts.

**RLS** : toutes les tables UCM filtrées par `organization_id` via projet parent. Fonctions SECURITY DEFINER pour éviter la récursion.

### Phase 2 : Edge Functions (5 fonctions)

| Fonction | Responsabilité |
|----------|---------------|
| `ucm-generate` | Génère 10 UC. Vérifie permissions + quotas. Log usage. |
| `ucm-analyze` | Analyse 1 section×mode. Support batch (sémaphore 3). Vérifie quota `analyses_per_month`. Bloque `detailed` si permission absente. |
| `ucm-synthesize` | Génère sections globales. Vérifie permission `ucm.global.generate`. |
| `ucm-chat` | Chat consultant contextuel. Vérifie permission `ucm.chat.use`. |
| `ucm-export` | Génère DOCX via librairie `docx`. Upload Storage. Vérifie quota exports. |

Chaque fonction suit le flow : Auth → Permission → Quota check → Load AI config (org override ou global) → Build context → Call AI → Log usage → Update quota → Save result → Return.

### Phase 3 : UI Portal (3 pages + 8 composants)

**Pages** :
- `/portal/ucm` — Dashboard projets (liste, filtres, create)
- `/portal/ucm/:id` — Wizard projet 6 steps (Contexte → Périmètre → UC → Analyses → Synthèse → Chat)
- `/portal/ucm/explorer` — Bibliothèque UC cross-projets avec filtres

**Composants** :
- `UCMProjectWizard` — Stepper 6 étapes
- `UCMSectorPicker` — Sélecteur secteur groupé (6 groupes)
- `UCMFunctionGrid` — Grille fonctions par catégorie avec toggle
- `UCMUseCaseCard` — Card UC avec badges priority/complexity/impact + sélection
- `UCMContextForm` — Formulaire 7 champs contexte UC
- `UCMAnalysisView` — Viewer brief/detailed avec toggle + régénération + versioning
- `UCMGlobalSynthesis` — Tabs 7 sections
- `UCMAgentProgress` — Barre progression agents IA (sémaphore visuel)

### Phase 4 : Admin + API

**Pages admin** :
- `/admin/ucm` — Vue globale tous projets UCM cross-orgs
- `/admin/ucm/sectors` — CRUD secteurs globaux + knowledge
- `/admin/ucm/prompts` — Templates prompts par section (brief/detailed)

**API externe** : les edge functions sont déjà des REST endpoints. Ajouter support API key organization pour appels externes (MCP, CLI).

### Phase 5 : Quotas & Export (bonus)

- `ucm_quota_usage` incrémenté automatiquement par les edge functions
- Alertes quota (80%, 100%) stockées et affichées dans le portal
- Export DOCX avec branding organization (logo, couleurs, nom cabinet)

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| Migration SQL | 11 tables + seed 35 secteurs + 13 sections + permissions + RLS |
| `supabase/functions/ucm-generate/index.ts` | Créer |
| `supabase/functions/ucm-analyze/index.ts` | Créer |
| `supabase/functions/ucm-synthesize/index.ts` | Créer |
| `supabase/functions/ucm-chat/index.ts` | Créer |
| `supabase/functions/ucm-export/index.ts` | Créer |
| `src/pages/portal/PortalUCM.tsx` | Créer |
| `src/pages/portal/PortalUCMProject.tsx` | Créer |
| `src/pages/portal/PortalUCMExplorer.tsx` | Créer |
| `src/pages/admin/AdminUCM.tsx` | Créer |
| `src/pages/admin/AdminUCMSectors.tsx` | Créer |
| `src/components/ucm/*.tsx` | 8 composants |
| `src/hooks/useUCMProject.ts` | Hook données projet |
| `src/hooks/useUCMQuotas.ts` | Hook quotas |
| `src/App.tsx` | Routes UCM |
| `src/components/portal/PortalSidebar.tsx` | Entrée UCM |
| `src/components/admin/AdminSidebar.tsx` | Entrée UCM |

## Ordre d'exécution
1. Migration DB (11 tables + seed + permissions + RLS)
2. Edge functions (5 fonctions cœur)
3. Hooks React (useUCMProject, useUCMQuotas)
4. Composants partagés UCM (8)
5. Pages Portal (3)
6. Pages Admin (2)
7. Routes + navigation
8. Export DOCX (Phase 5)

