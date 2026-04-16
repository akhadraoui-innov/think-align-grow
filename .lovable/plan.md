

## Analyse de l'existant — patterns puissants à conserver

| Pattern | Localisation | Force |
|---|---|---|
| **Mode Registry (50+ modes)** | `modeRegistry.ts` | 14 univers × 7 familles UI, dimensions par défaut |
| **Behavior Injections** | `promptTemplates.ts` | Mécanique métier (gauges, scoring, phases) injectée par-dessus le prompt admin |
| **Mode Insights** | `modeInsights.ts` | Pédagogie : skills, tips, audience, durée, exemple |
| **Practice Templates** | `practiceTemplates.ts` | Presets prêts à l'emploi par mode |
| **Type Config Schemas** | `typeConfigSchemas.ts` | Champs typés par mode (tension_start, language…) |
| **AI Assistance Levels** | `SimulatorShell` | 3 niveaux : autonomous / guided / intensive |
| **Family Routing** | `SimulatorEngine` | Chat / Code / Document / Analysis / Decision / Design / Assessment |
| **Restitution enrichie** | `academy-practice` edge fn | KPIs + strengths + improvements + learning_gaps + best_practices |
| **AI Designer** | `PracticeDesigner` | Génération brief → pratique complète |

## Ce qui manque pour un module *world-class*

1. **Pas de console centralisée** : pratiques dispersées (assets / module / portail)
2. **Pas de multi-org / multi-user assignment**
3. **Pas de versioning / rollback** des prompts et configs
4. **Pas de live preview** pendant l'édition
5. **Pas d'A/B testing** entre variantes de prompt
6. **Pas d'analytics par pratique** (taux complétion, score moyen, dimensions faibles)
7. **Pas de bibliothèque de blocs réutilisables** (personas, rubrics, garde-fous)
8. **Pas d'évaluateur custom** (rubric simple aujourd'hui, pas de pondération visuelle ni de seuils)
9. **Pas de phases éditables** côté admin (le champ existe mais aucun éditeur)
10. **Pas de gestion fine des objectifs SMART** ni de critères de succès paramétrables

## Vision — Practice Studio v2

Une console unique qui rend **chaque dimension de chaque mode** paramétrable, avec **live preview**, **versioning**, **diffusion granulaire** et **analytics**.

### Architecture en 8 onglets

```text
┌─ Liste pratiques ─┬─ Canvas Studio ──────────────────────┬─ Live Preview ─┐
│ Filtres :         │ 1. Identité & Mode                   │ Mini-chat      │
│ - org             │ 2. Scénario & Contexte               │ teste config   │
│ - univers         │ 3. IA & Prompts (versionné)          │ courante       │
│ - mode            │ 4. Mécanique (behavior injection)    │                │
│ - statut          │ 5. Accompagnement & Coaching         │ Score live     │
│ - assigné         │ 6. Évaluation & Restitution          │ Gauges live    │
│                   │ 7. Diffusion (orgs + users)          │                │
│ Recherche +       │ 8. Analytics & Versions              │                │
│ tags + tri        │                                      │                │
└───────────────────┴──────────────────────────────────────┴────────────────┘
```

### Détail des 8 onglets

| # | Onglet | Paramètres |
|---|---|---|
| 1 | **Identité & Mode** | Titre, mode (50+), univers, famille UI, difficulté, durée, audience, tags, icône |
| 2 | **Scénario & Contexte** | Brief immersif (markdown), data attachée (CSV/JSON/code), persona IA, phases drag-drop, ressources externes |
| 3 | **IA & Prompts** | System prompt (Monaco), modèle override, temperature, max_tokens, garde-fous, **diff vs version précédente** |
| 4 | **Mécanique** | Behavior injection custom OU preset, configuration typée (selon `typeConfigSchemas`), max_exchanges, mécaniques spéciales (timer, événements, jauges) |
| 5 | **Coaching** | Niveau (autonomous/guided/intensive), mode coaching (proactive/socratique/challenger/silent), hints éditables, suggestions auto, onboarding personnalisé |
| 6 | **Évaluation & Restitution** | Stratégie (rubric/dimensions/hybride/holistique), dimensions pondérées (sliders sommant 100%), seuils de réussite, template du rapport final (sections cochables, KPIs visibles, ton) |
| 7 | **Diffusion** | Toggle public · multi-orgs (chips) · multi-users filtrés par org · échéance · notification |
| 8 | **Analytics & Versions** | Sessions, taux complétion, score moyen, dimensions faibles, replay sessions exemplaires + historique versions avec diff et restore |

### Innovations clés

1. **Bibliothèque de blocs réutilisables** : personas, rubrics, garde-fous, mécaniques mixables entre pratiques (table `practice_blocks`)
2. **Versioning automatique** : snapshot à chaque save majeur, diff visuel, rollback 1-clic
3. **Live Preview embarqué** : panneau droit lance une mini-session sur la config en cours, avec score en direct
4. **A/B variants** : 2 variantes de prompt sur une même pratique, routage 50/50, comparaison analytics
5. **AI Co-pilote d'édition** : "Améliore ce scénario", "Génère 3 variantes de rubric", "Challenge mes objectifs"
6. **Diffusion granulaire** : public / org(s) / user(s) avec échéance et rappels
7. **Coaching modes étendus** : 5 postures (proactive, socratique, challenger, silent, intensive)
8. **Restitution paramétrable** : choix des sections, ton, KPIs affichés, format export

## Schéma DB

**Nouvelles tables**
```sql
practice_organizations(practice_id, organization_id, assigned_at)
practice_user_assignments(practice_id, user_id, organization_id, assigned_by, due_date)
practice_versions(practice_id, version_number, snapshot jsonb, changed_by, change_summary)
practice_blocks(id, kind: persona|rubric|guardrail|mechanic, name, content jsonb, organization_id)
practice_variants(practice_id, variant_label, system_prompt, weight)
```

**Colonnes ajoutées à `academy_practices`**
- `is_public` (bool), `coaching_mode` (text), `objectives` (jsonb SMART), `success_criteria` (jsonb seuils), `evaluation_strategy` (text), `evaluation_weights` (jsonb), `restitution_template` (jsonb), `attached_data` (jsonb), `model_override` (text), `temperature_override` (numeric), `tags` (déjà), `audience` (text)

**RLS** : SaaS team manage tout. Apprenants voient via `is_public OR org match OR user assignment`.

## Lecture côté Portal

`PortalPratique` + `PortalExperiences` requêtent l'union :
```
public OR org_active ∈ practice_organizations OR auth.uid() ∈ practice_user_assignments
```
Badges : "Public", "Org", "Assignée à toi", "Échéance J-3".

## Composants à créer

| Composant | Rôle |
|---|---|
| `AdminPracticeStudio.tsx` | Page racine `/admin/practices` |
| `practice-studio/StudioShell.tsx` | Layout 3 colonnes + autosave + breadcrumb + raccourcis |
| `practice-studio/PracticeListPanel.tsx` | Liste virtualisée + filtres + recherche |
| `practice-studio/tabs/IdentityTab.tsx` | Mode picker visuel (univers + cards) |
| `practice-studio/tabs/ScenarioTab.tsx` | Markdown editor + attachements + phases drag |
| `practice-studio/tabs/AIPromptsTab.tsx` | Monaco + variants + diff |
| `practice-studio/tabs/MechanicsTab.tsx` | Behavior preset + config typée (forms générés depuis `typeConfigSchemas`) |
| `practice-studio/tabs/CoachingTab.tsx` | Sélecteur posture + assistance + hints |
| `practice-studio/tabs/EvaluationTab.tsx` | Builder dimensions pondérées + restitution template |
| `practice-studio/tabs/DistributionTab.tsx` | Multi-org chips + table users + échéance |
| `practice-studio/tabs/AnalyticsTab.tsx` | Stats sessions + replay + versions |
| `practice-studio/LivePreviewPanel.tsx` | Mini-chat avec config courante |
| `practice-studio/BlockLibrary.tsx` | Drawer bibliothèque de blocs réutilisables |
| `practice-studio/AICopilot.tsx` | Bouton "Améliorer / Générer variantes" |

## Edge functions

- `practice-preview` (nouveau) — endpoint léger pour live preview sans persister
- `academy-practice` (existante) — étendre pour gérer `model_override`, `temperature_override`, `variants`

## Fichiers à modifier

| Cible | Action |
|---|---|
| Migration SQL | 5 tables + 10 colonnes + RLS + backfill |
| `src/App.tsx` | Route `/admin/practices` |
| `src/components/admin/AdminSidebar.tsx` | Entrée "Practice Studio" |
| `src/pages/admin/AdminPracticeStudio.tsx` | **Nouveau** |
| `src/components/admin/practice-studio/*` | **14 composants nouveaux** |
| `src/hooks/useAdminPractices.ts` | **Nouveau** — CRUD + versions + diffusion + analytics |
| `src/pages/portal/PortalPratique.tsx` | Requête union + badges |
| `src/pages/portal/PortalExperiences.tsx` | Idem |
| `supabase/functions/practice-preview/index.ts` | **Nouveau** |
| `supabase/functions/academy-practice/index.ts` | Support overrides + variants |

## UX corporate

- Autosave debounce 800ms avec indicateur "Enregistré il y a 3s"
- Snapshots auto à chaque changement majeur (table `practice_versions`)
- Validation visuelle : badges rouges sur onglets incomplets
- Raccourcis : Cmd+S, Cmd+P (preview), Cmd+D (duplicate), Cmd+/ (recherche)
- Duplication, export/import JSON
- Liste virtualisée (react-window) pour 100+ pratiques

## Compatibilité ascendante

- Pratiques existantes restent accessibles (backfill `is_public=true` pour celles sans org)
- Onglet "Pratiques" dans Module Detail conservé, lien "Ouvrir dans Studio"
- Aucune rupture sur les sessions en cours

