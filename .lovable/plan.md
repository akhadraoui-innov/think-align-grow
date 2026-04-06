

# Audit complet UCM — État actuel et plan pour la suite

## Ce qui est FAIT et fonctionnel

| Composant | État | Commentaire |
|-----------|------|-------------|
| **11 tables DB** | Complet | `ucm_projects`, `ucm_use_cases`, `ucm_uc_contexts`, `ucm_analyses`, `ucm_global_sections`, `ucm_chat_messages`, `ucm_exports`, `ucm_sectors`, `ucm_analysis_sections`, `ucm_global_analysis_sections`, `ucm_quota_usage` |
| **RLS policies** | Complet | 41 policies couvrant toutes les tables UCM (CRUD) |
| **Seed data** | Complet | 35 secteurs, 6 sections d'analyse, 7 sections globales |
| **Permissions** | Complet | 10 clés UCM dans `permission_definitions` |
| **Quotas** | Complet (DB) | `ucm_quotas` JSONB sur `organizations`, `ucm_quota_usage` table, `ucm_increment_quota` function |
| **Edge: ucm-generate** | Complet | Auth + quota check + Lovable AI + insert UC + increment quota |
| **Edge: ucm-analyze** | Complet | Brief/detailed, versioning, section config from DB, quota tracking |
| **Edge: ucm-synthesize** | Complet | 7 sections globales, versioning, context enrichi |
| **Edge: ucm-chat** | Complet | Chat contextuel avec historique, quota tracking |
| **Edge: ucm-export** | Placeholder | Retourne 501 "coming soon" |
| **Portal: /portal/ucm** | Complet | Dashboard projets + création |
| **Portal: /portal/ucm/:id** | Fonctionnel | Wizard 5 tabs (Context, Scope, UC, Analysis, Synthesis) |
| **Portal: /portal/ucm/explorer** | Complet | Bibliothèque UC cross-projets avec recherche |
| **Routes App.tsx** | Complet | 3 routes UCM Portal |
| **Sidebar** | Complet | Entrée "AI Value Builder" dans PortalSidebar |

## Ce qui MANQUE (CDC non couvert)

### 1. UI — Composants non créés (0/8 prévus)
- **UCMChat.tsx** — Aucun composant chat dans le projet. Le 6e onglet "Chat consultant" du wizard n'existe pas.
- **UCMContextForm.tsx** — Le formulaire 7 champs (situation, tools, team, volumes, pain_points, objectives, constraints) pour enrichir chaque UC n'existe pas.
- **UCMAgentProgress.tsx** — Pas de barre de progression pour les agents IA (batch analysis).
- **UCMSectorPicker.tsx** — Intégré inline dans PortalUCMProject, pas un composant réutilisable.
- **UCMFunctionGrid.tsx** — Idem, inline.
- **UCMUseCaseCard.tsx** — Idem, inline.
- **UCMAnalysisView.tsx** — Les analyses s'affichent mais sans toggle brief/detailed dédié, sans versioning navigable.
- **UCMGlobalSynthesis.tsx** — Inline, pas de composant dédié.

### 2. Admin — Zéro pages admin
- `/admin/ucm` — Vue globale projets UCM cross-orgs : non créée
- `/admin/ucm/sectors` — CRUD secteurs globaux : non créé
- `/admin/ucm/prompts` — Gestion des templates prompts : non créé
- Pas d'entrée dans AdminSidebar

### 3. Fonctionnalités manquantes dans le wizard
- **Onglet Chat (6e tab)** — Manquant
- **Batch analysis** — Le bouton "Analyser tout" (toutes sections × tous UC sélectionnés) n'existe pas. Chaque analyse est manuelle une par une.
- **Formulaire UC Context** — Pas de moyen de renseigner les 7 champs contextuels par UC
- **Export DOCX** — Edge function placeholder, pas de bouton dans l'UI
- **Version history** — Les analyses sont versionnées en DB mais l'UI n'affiche que `is_current`, pas de navigation entre versions

### 4. Vérifications de permissions côté frontend
- Le wizard ne vérifie pas `ucm.uc.analyze_detailed` avant d'afficher le bouton "Détaillé"
- Pas de vérification `ucm.global.generate` avant la synthèse
- Pas de vérification `ucm.chat.use` (onglet chat inexistant)

### 5. Quota enforcement côté frontend
- Pas d'affichage des quotas restants
- Pas d'alertes quand on approche des limites

---

## Plan d'exécution — 6 étapes

### Étape 1 : Chat consultant (6e onglet du wizard)
- Créer `src/components/ucm/UCMChat.tsx` — Interface chat avec historique, input, markdown rendering
- Ajouter un hook `useUCMChat` pour envoyer/recevoir via `ucm-chat` edge function
- Ajouter le 6e tab "Chat" dans `PortalUCMProject.tsx`
- Vérifier permission `ucm.chat.use`

### Étape 2 : Formulaire contexte UC + Batch analysis
- Créer `src/components/ucm/UCMContextForm.tsx` — Dialog/sheet avec les 7 champs
- Ajouter un hook `useUCMContext` (upsert dans `ucm_uc_contexts`)
- Ajouter bouton "Enrichir contexte" sur chaque UC card dans l'onglet 3
- Ajouter bouton "Analyser tout (brief)" qui lance les 6 sections × tous UC sélectionnés en séquence
- Afficher progression (compteur simple X/N)

### Étape 3 : Améliorer l'onglet Analyses
- Créer `src/components/ucm/UCMAnalysisView.tsx` — Viewer avec :
  - Toggle brief/detailed côté à côté
  - Navigation entre versions (dropdown)
  - Bouton régénérer
  - Markdown enrichi
- Vérifier `ucm.uc.analyze_detailed` pour conditionner le bouton "Détaillé"

### Étape 4 : Pages Admin UCM
- `src/pages/admin/AdminUCM.tsx` — Liste tous les projets UCM cross-orgs avec stats (nb UC, nb analyses, tokens consommés)
- `src/pages/admin/AdminUCMSectors.tsx` — CRUD secteurs : edit label, icon, group, functions (JSON editor), knowledge
- Ajouter entrée "UCM" dans `AdminSidebar.tsx`
- Ajouter routes dans `App.tsx`

### Étape 5 : Export DOCX
- Implémenter la logique dans `supabase/functions/ucm-export/index.ts` :
  - Charger projet + UC + analyses + global sections
  - Générer DOCX structuré (utiliser `docx` npm via CDN ESM)
  - Upload dans Supabase Storage (bucket `ucm-exports`)
  - Sauvegarder dans `ucm_exports`
- Ajouter bouton "Exporter Word" dans le wizard (onglet synthèse)
- Créer le bucket storage `ucm-exports`

### Étape 6 : Quotas UI + Permission guards
- Créer `src/hooks/useUCMQuotas.ts` — charge `ucm_quota_usage` + limites org
- Afficher un bandeau quota dans le dashboard UCM (X/Y analyses ce mois)
- Désactiver les boutons quand quota atteint
- Ajouter guards de permission sur tous les boutons d'action (generate, analyze detailed, synthesize, chat, export)

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/ucm/UCMChat.tsx` | Créer |
| `src/components/ucm/UCMContextForm.tsx` | Créer |
| `src/components/ucm/UCMAnalysisView.tsx` | Créer |
| `src/hooks/useUCMChat.ts` | Créer |
| `src/hooks/useUCMQuotas.ts` | Créer |
| `src/pages/admin/AdminUCM.tsx` | Créer |
| `src/pages/admin/AdminUCMSectors.tsx` | Créer |
| `src/pages/portal/PortalUCMProject.tsx` | Modifier — ajouter 6e tab Chat, bouton batch, contexte UC, guards permissions |
| `src/components/admin/AdminSidebar.tsx` | Modifier — ajouter entrée UCM |
| `src/App.tsx` | Modifier — ajouter routes admin UCM |
| `supabase/functions/ucm-export/index.ts` | Modifier — implémenter DOCX |

## Ordre recommandé
1. Chat consultant (valeur utilisateur immédiate)
2. Contexte UC + Batch analysis (qualité des analyses)
3. Amélioration onglet Analyses (UX)
4. Pages Admin (gouvernance)
5. Export DOCX (livrable client)
6. Quotas UI + Guards (contrôle SaaS)

