

# Plan — 7 Étapes post-audit AI Value Builder

## Résumé

Implémentation séquentielle des 7 étapes demandées : migration DB, seed data enrichi (v13.jsx), seed CREATIVE, config IA dynamique, hardening edge functions, export DOCX, UX fixes.

## Problème de mapping des codes secteurs

Les codes secteurs en DB ne correspondent **pas** aux codes du v13.jsx :

| v13.jsx | DB actuelle |
|---------|-------------|
| `banque` | `banque_detail` |
| `asset_mgmt` | `gestion_actifs` |
| `retail` | `commerce_detail` ou `grande_distribution` |
| `conseil` | `conseil_strategie` + `conseil_management` + `esn_ssii` |
| `tech` | `saas_tech` |
| etc. | etc. |

La DB a 35 secteurs avec des codes plus granulaires (3 secteurs conseil vs 1 dans v13). Le mapping sera fait au mieux, en enrichissant chaque secteur DB avec le knowledge v13 le plus pertinent.

---

## Étape 1 — Migration DB

**Migration SQL** :
- `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS ucm_plan TEXT DEFAULT 'starter'`
- `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS ucm_ai_config JSONB DEFAULT '{...}'` (config complète avec uc_generation, analysis, chat)
- `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS ucm_branding JSONB DEFAULT '{...}'`
- `CREATE FUNCTION get_ucm_section_prompt(p_org_id, p_section_code, p_mode)` — tenant override → global fallback
- `CREATE FUNCTION get_ucm_global_prompt(p_org_id, p_section_code)` — idem pour globales
- `CREATE FUNCTION check_ucm_quota(p_org_id, p_action)` — retourne boolean
- Créer le bucket storage `ucm-exports` (public: false)

## Étape 2 — Seed data enrichi

Via l'outil insert, UPDATE en masse :

**A. Knowledge sectoriel** — 35 UPDATEs, un par secteur. Copie mot pour mot depuis `SECTOR_KNOWLEDGE` du v13.jsx. Mapping codes DB → codes v13 :
- `banque_detail` ← v13 `banque`
- `assurance` ← v13 `assurance`
- `gestion_actifs` ← v13 `asset_mgmt`
- `fintech` ← v13 `fintech`
- `esn_ssii` ← v13 `conseil` (le plus pertinent car CREATIVE = ESN)
- `conseil_strategie` ← v13 `conseil` (adapté)
- etc.

**B. Instructions brief** — 6 UPDATEs pour `ucm_analysis_sections WHERE organization_id IS NULL`. Copie intégrale de `UCS[].instrBrief` du v13.

**C. Instructions detailed** — 6 UPDATEs. Copie intégrale de `UCS[].instrFull`.

**D. Instructions globales** — 7 UPDATEs pour `ucm_global_analysis_sections`. Copie intégrale de `GS[].instr`.

**E. Fonctions JSONB** — Vérifier et restructurer en `{core_business, dedicated, core_support, global_support, other}` depuis `SF` du v13 pour chaque secteur.

## Étape 3 — Seed CREATIVE

INSERT dans `ucm_projects` avec :
- `company = 'CREATIVE'`
- `context` = le texte court (lignes 480)
- `immersion` = le texte complet 3000+ car. (lignes 481)
- `sector_id` = UUID du secteur `esn_ssii`
- `sector_label` = 'ESN / Société de services IT'
- `selected_functions` = les 12 fonctions listées
- `organization_id` = org de l'admin (`c20a26a5-...`)
- `created_by` = UUID super admin
- `status` = 'in_progress'

## Étape 4 — Config IA dynamique (Option B : Lovable Gateway, modèle configurable)

Le projet utilise le Lovable AI Gateway (`ai.gateway.lovable.dev`) qui ne supporte pas l'API Anthropic directe. Implémenter **Option B** : garder le gateway Lovable mais rendre modèle/temperature/max_tokens configurables via `ucm_ai_config`.

Chaque edge function :
1. Charge `organizations.ucm_ai_config` pour l'org du projet
2. Extrait la config du type de tâche (`uc_generation`, `analysis`, `chat`)
3. Utilise le modèle/temperature/max_tokens de la config au lieu de hardcoder
4. Fallback sur les defaults actuels si config absente

**Fichiers** : `ucm-generate`, `ucm-analyze`, `ucm-synthesize`, `ucm-chat` (4 edge functions)

## Étape 5 — Hardening edge functions

Pour les 4 fonctions (generate, analyze, synthesize, chat), ajouter dans l'ordre :

1. **Permission check** — Après auth, appeler `has_any_role` + vérifier la permission spécifique via une query sur `role_permissions` + `permission_definitions`. Retour 403 si absent.
2. **Quota pre-check** — Appeler `check_ucm_quota(org_id, action)` via RPC. Retour 429 avec message structuré si dépassé.
3. **Tenant prompt override** — `ucm-analyze` : appeler `get_ucm_section_prompt(org_id, code, mode)` via RPC au lieu de `WHERE organization_id IS NULL`. `ucm-synthesize` : appeler `get_ucm_global_prompt(org_id, code)`.
4. **Detailed guard** — `ucm-analyze` : si mode = 'detailed', vérifier permission `ucm.uc.analyze_detailed`. Retour 403 sinon.

**Fichiers** : 4 edge functions modifiées

## Étape 6 — Export DOCX

Réécrire `ucm-export/index.ts` :

1. Auth + Permission `ucm.export.docx` + Quota check
2. Charger : projet + UC sélectionnés + analyses `is_current` + contextes UC + sections globales + org branding
3. Installer `docx` via import ESM (`https://esm.sh/docx@9`)
4. Construire le document :
   - Page de couverture (company, secteur, date, branding)
   - Sommaire
   - Contexte + Immersion + Périmètre
   - Portfolio UC (tableau)
   - Pour chaque UC : contexte spécifique + 6 sections (brief/detailed)
   - Synthèse globale (7 sections)
   - Footer confidentiel
5. Upload vers Storage bucket `ucm-exports`
6. Générer URL signée 24h
7. INSERT dans `ucm_exports`
8. Incrémenter quota exports

**Fichier** : `supabase/functions/ucm-export/index.ts`

## Étape 7 — UX corrections

| Fichier | Changement |
|---------|-----------|
| `UCMContextStep.tsx` | Textarea immersion → `rows={8}`, compteur caractères avec feedback couleur (rouge < 200, orange < 500, vert ≥ 500) |
| `PortalUCMExplorer.tsx` | Ajouter filtre par secteur (dropdown construit depuis les secteurs des UC existants) |
| `UCMAnalysisPage.tsx` | Badge "V2" visible à côté du titre quand `version > 1` |

---

## Fichiers impactés (total)

| Fichier | Action |
|---------|--------|
| Migration SQL | 3 colonnes + 3 fonctions + 1 bucket |
| Seed data | ~55 UPDATEs (35 knowledge + 6 brief + 6 detailed + 7 global + fonctions) |
| Seed CREATIVE | 1 INSERT projet |
| `supabase/functions/ucm-generate/index.ts` | Modifier — permission + quota + AI config dynamique |
| `supabase/functions/ucm-analyze/index.ts` | Modifier — permission + quota + tenant override + detailed guard + AI config |
| `supabase/functions/ucm-synthesize/index.ts` | Modifier — permission + quota + tenant override + AI config |
| `supabase/functions/ucm-chat/index.ts` | Modifier — permission + quota + AI config |
| `supabase/functions/ucm-export/index.ts` | Réécrire — DOCX complet |
| `src/components/ucm/UCMContextStep.tsx` | Modifier — rows + compteur |
| `src/pages/portal/PortalUCMExplorer.tsx` | Modifier — filtre secteur |
| `src/components/ucm/UCMAnalysisPage.tsx` | Modifier — badge version |

## Ordre : 1 → 2 → 3 → 4 → 5 → 6 → 7

