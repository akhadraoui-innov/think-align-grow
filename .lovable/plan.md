
# Audit complet UCM — AI Value Builder — v2

## ✅ Ce qui est FAIT et fonctionnel

### Infrastructure DB (11/11 tables)
| Table | Colonnes clés | RLS | Statut |
|-------|--------------|-----|--------|
| `ucm_projects` | company, context, immersion, sector_id, selected_functions, status | 4 policies | ✅ |
| `ucm_use_cases` | name, description, priority, complexity, impact_level, horizon, data_readiness, ai_techniques, value_drivers, functions, is_selected | 4 policies | ✅ |
| `ucm_uc_contexts` | situation, tools, team, volumes, pain_points, objectives, constraints | 4 policies | ✅ |
| `ucm_analyses` | use_case_id, section_id, mode, content, version, is_current, tokens_used | 4 policies | ✅ |
| `ucm_global_sections` | section_id, content, version, is_current | 4 policies | ✅ |
| `ucm_chat_messages` | project_id, role, content, tokens_used | 2 policies | ✅ |
| `ucm_exports` | project_id, format, file_url, metadata | 4 policies | ✅ |
| `ucm_sectors` | code, label, icon, group_name, functions, knowledge | 4 policies | ✅ |
| `ucm_analysis_sections` | code, title, icon, brief_instruction, detailed_instruction | 4 policies | ✅ |
| `ucm_global_analysis_sections` | code, title, instruction | 4 policies | ✅ |
| `ucm_quota_usage` | uc_generations, analysis_generations, global_generations, chat_messages, exports, total_tokens | 3 policies | ✅ |

### Seed data
- 35 secteurs avec knowledge et functions
- 6 sections d'analyse (process, data, tech, impact, roadmap, risks)
- 7 sections globales (exec, synergies, roadmap, archi, business, change, next)

### Permissions (10/10)
`ucm.projects.create`, `ucm.projects.read_all`, `ucm.uc.generate`, `ucm.uc.analyze`, `ucm.uc.analyze_detailed`, `ucm.global.generate`, `ucm.chat.use`, `ucm.export.docx`, `ucm.config.manage`, `ucm.sectors.manage`

### DB Functions
- `ucm_increment_quota(_org_id, _field, _tokens)` — SECURITY DEFINER ✅

### Edge Functions (5/5)
| Fonction | Auth | Quota | IA | Statut |
|----------|------|-------|----|--------|
| `ucm-generate` | ✅ JWT | ✅ increment | Gemini 2.5 Flash | ✅ Fonctionnel |
| `ucm-analyze` | ✅ JWT | ✅ increment | Flash/Pro selon mode | ✅ Fonctionnel |
| `ucm-synthesize` | ✅ JWT | ✅ increment | Gemini 2.5 Pro | ✅ Fonctionnel |
| `ucm-chat` | ✅ JWT | ✅ increment | Gemini 2.5 Flash | ✅ Fonctionnel |
| `ucm-export` | - | - | - | ❌ Placeholder 501 |

### Frontend — Pages Portal (3/3)
| Page | Route | Statut |
|------|-------|--------|
| Dashboard projets | `/portal/ucm` | ✅ |
| Wizard 6 tabs | `/portal/ucm/:id` | ✅ |
| UC Explorer | `/portal/ucm/explorer` | ✅ |

### Frontend — Pages Admin (2/2)
| Page | Route | Statut |
|------|-------|--------|
| Dashboard admin | `/admin/ucm` | ✅ |
| CRUD Secteurs | `/admin/ucm/sectors` | ✅ |

### Frontend — Composants UCM (3/3)
| Composant | Statut |
|-----------|--------|
| `UCMChat.tsx` | ✅ Chat avec historique, markdown |
| `UCMContextForm.tsx` | ✅ Dialog 7 champs |
| `UCMAnalysisView.tsx` | ✅ Brief/Detailed, versions, régénération |

### Frontend — Hooks (3/3)
| Hook | Statut |
|------|--------|
| `useUCMProject.ts` | ✅ 8 hooks (projects, usecases, analyses, sectors, mutations) |
| `useUCMChat.ts` | ✅ Messages + send |
| `useUCMQuotas.ts` | ✅ Usage + limits |

### Navigation
- PortalSidebar : entrée "AI Value Builder" ✅
- AdminSidebar : section collapsible UCM (Dashboard + Secteurs) ✅
- Routes App.tsx : 5 routes (3 portal + 2 admin) ✅

### Guards
- Permission `ucm.chat.use` → onglet Chat disabled ✅
- Permission `ucm.global.generate` → bouton Synthèse disabled ✅
- Permission `ucm.uc.analyze_detailed` → bouton Détaillé disabled ✅
- Quota `canGenerate` → bouton Générer 10 UC disabled ✅
- Quota `canAnalyze` → bouton Batch disabled ✅
- Affichage quotas dans header projet ✅

---

## ❌ Ce qui MANQUE encore

### 1. Export DOCX (Phase 5 du CDC)
- Edge function `ucm-export` retourne 501
- Pas de bucket storage `ucm-exports`
- Pas de bouton "Exporter Word" dans l'UI

### 2. Améliorations UX mineures
- **Batch analysis** : pas de bouton Annuler pendant le batch
- **UC Explorer** : pas de filtres avancés (par secteur, priorité, complexité)
- **Admin UCM** : pas de drill-down vers les projets individuels
- **Admin Secteurs** : pas de bouton toggle actif/inactif inline
- **Version history** : pas de comparaison côte à côte entre versions

### 3. Pages Admin manquantes
- `/admin/ucm/prompts` — Gestion des templates de prompts (sections d'analyse + sections globales)

### 4. Workspace portal
- Pas d'entrée "AI Value Builder" dans le workspace/dashboard portal principal

---

## Plan d'exécution — Prochaines étapes

### Étape 1 : Export DOCX (priorité haute)
1. Créer le bucket storage `ucm-exports`
2. Implémenter `ucm-export` edge function (charger projet + UC + analyses + global, générer DOCX structuré)
3. Ajouter bouton "Exporter Word" dans l'onglet Synthèse
4. Sauvegarder dans `ucm_exports` + increment quota

### Étape 2 : Admin Prompts
1. Créer `/admin/ucm/prompts` — CRUD pour `ucm_analysis_sections` et `ucm_global_analysis_sections`
2. Ajouter route et entrée sidebar

### Étape 3 : UX Polish
1. Toggle actif/inactif inline dans Admin Secteurs
2. Filtres avancés dans UC Explorer
3. Lien drill-down admin → projet
4. Bouton Annuler batch analysis

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `supabase/functions/ucm-export/index.ts` | Implémenter DOCX |
| `src/pages/portal/PortalUCMProject.tsx` | Ajouter bouton Export |
| `src/pages/admin/AdminUCMPrompts.tsx` | Créer |
| `src/components/admin/AdminSidebar.tsx` | Ajouter entrée Prompts |
| `src/App.tsx` | Ajouter route prompts |
| `src/pages/portal/PortalUCMExplorer.tsx` | Filtres avancés |
| `src/pages/admin/AdminUCMSectors.tsx` | Toggle inline |
