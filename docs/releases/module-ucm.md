# Module — AI Value Builder (UCM)

> **Micro-service SaaS multi-tenant** dédié à la génération et l'analyse de **use cases IA** pour cabinets de conseil et directions générales.

## 🎯 Vision

Plateforme structurée en 11 tables `ucm_*`, pilotée par 5 edge functions, qui accompagne une organisation depuis la définition de son contexte stratégique jusqu'à la synthèse exécutive de ses use cases IA prioritaires.

## 🏛️ Jalons majeurs

### 2026-04-06 — Genèse depuis prototype
- Source : `GI_UCM_v13_-_uses_cas_management.jsx` (prototype standalone).
- Mockup React multi-onglets : projets, contexte, génération use cases, analyse, synthèse.

### 2026-04-06 — Cahier des charges "AI Value Builder"
Décision : implémenter une **architecture tenant-first dédiée** (et non réutiliser l'existant).

7 écarts critiques identifiés vs prototype :
1. Tenant architecture séparée.
2. Permissions granulaires (10 actions).
3. Quotas mensuels par plan.
4. Configuration AI (provider, modèles, prompts override).
5. Export DOCX livrable.
6. Contexte UC enrichi.
7. Sectoriel (35 secteurs seedés).

### 2026-04-06 — Phase 1 : Infrastructure
- **11 tables** préfixées `ucm_*` :
  - `ucm_projects` : projets clients.
  - `ucm_use_cases` : UC générés par projet.
  - `ucm_uc_analyses` : analyses détaillées par UC.
  - `ucm_global_analyses` : synthèse globale projet.
  - `ucm_chat_messages` : conversation consultant IA.
  - `ucm_sectors` : référentiel 35 secteurs (NAICS-aligned).
  - `ucm_analysis_sections` : prompts par section UC (organization-scoped + global fallback).
  - `ucm_global_analysis_sections` : prompts synthèse globale.
  - `ucm_quota_usage` : compteurs mensuels par org.
  - `ucm_ai_config` : configuration AI par org.
  - `ucm_exports` : tracking DOCX exports.
- **41 RLS policies** + **10 permissions granulaires**.
- Seed : 35 secteurs + 13 prompts d'analyse extraits du prototype.

### 2026-04-06 — Edge functions
- `ucm-generate` : génère UCs en batch depuis contexte.
- `ucm-analyze` : analyse détaillée d'un UC (5-7 sections).
- `ucm-synthesize` : synthèse globale exécutive.
- `ucm-chat` : consultant IA conversationnel.
- `ucm-export` : DOCX livrable (actuellement stub 501 — voir roadmap).

### 2026-04 — Composants UI
- `UCMContextStep.tsx` + `UCMScopeStep.tsx` : formulaire wizard contexte.
- `UCMUseCasesList.tsx` : liste UCs générés avec scoring.
- `UCMAnalysisView.tsx` + `UCMAnalysisPage.tsx` : restitution analyse par section.
- `UCMSynthesisPage.tsx` : synthèse exécutive.
- `UCMChat.tsx` : 6e onglet conversationnel.
- `UCMProjectSidebar.tsx` : navigation projet.

### 2026-04 — Hooks
- `useUCMProject.ts` : CRUD projets.
- `useUCMChat.ts` : messages persistés.
- `useUCMQuotas.ts` : check quotas avant action.

### 2026-04 — Quotas & Monétisation
Segmentation par plan (Starter / Pro / Enterprise) :
- `max_uc_generations_per_month`
- `max_analyses_per_month`
- `max_globals_per_month`
- `max_chat_per_month`
- `max_exports_per_month`

Fonction SQL `check_ucm_quota(p_org_id, p_action)` STABLE SECURITY DEFINER.
Fonction SQL `ucm_increment_quota(_org_id, _field, _tokens)` met à jour `ucm_quota_usage` par période `YYYY-MM`.

### 2026-04 — Configuration AI hiérarchique
Priorité : **Surcharge org > Global > Fallback**.
- `get_ucm_section_prompt(p_org_id, p_section_code, p_mode)` : récupère prompt analyse section.
- `get_ucm_global_prompt(p_org_id, p_section_code)` : récupère prompt synthèse globale.
- Pages admin : `AdminUCMPrompts.tsx`, `AdminUCMSectors.tsx`.

### 2026-04 — Portail apprenant
- `PortalUCM.tsx` : hub UCM portail.
- `PortalUCMExplorer.tsx` : explorateur cross-projet.
- `PortalUCMProject.tsx` : vue projet apprenant.

## 📊 Modèle de données

| Table | Rôle |
|---|---|
| `ucm_projects` | Projet client |
| `ucm_use_cases` | UCs générés |
| `ucm_uc_analyses` | Analyses sections |
| `ucm_global_analyses` | Synthèse exécutive |
| `ucm_chat_messages` | Consultant IA |
| `ucm_sectors` | 35 secteurs NAICS |
| `ucm_analysis_sections` | Prompts UC (override org) |
| `ucm_global_analysis_sections` | Prompts synthèse |
| `ucm_quota_usage` | Compteurs mensuels |
| `ucm_ai_config` | Config provider/modèles |
| `ucm_exports` | Tracking DOCX |

## 📦 État actuel

- ✅ 11 tables + 41 RLS + 10 permissions.
- ✅ 5 edge functions opérationnelles (4/5 — DOCX stub).
- ✅ Quotas mensuels enforcés par plan.
- ✅ Configuration AI hiérarchique.
- ✅ Portail apprenant intégré.
- 🚧 Export DOCX : actuellement stub 501, livrable cible : document Word 30-50 pages avec sommaire, page de garde, sections enrichies.

## 🚫 Roadmap

- 📄 Export DOCX réel (priorité 1).
- 📊 Dashboards analytics par projet.
- 🔗 Webhooks org pour intégrations externes.

## 🧠 Références mémoire

- `mem://product/ucm-system-architecture` — Architecture 11 tables + 5 EF
- `mem://features/ucm/monetization-quotas-admin-v2` — Plans + quotas
- `mem://features/ucm/roadmap-and-stubs` — Stub DOCX + cible
- `mem://technical/ucm/data-mapping-v13` — Mapping codes secteurs
- `mem://ai/parametric-configuration` — Config hiérarchique
