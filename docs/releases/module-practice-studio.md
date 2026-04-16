# Module — Practice Studio & Professional Simulator

> **Simulateur professionnel universel** : 50+ modes spécialisés à travers 14 univers métiers (Engineering, Vibe Coding, Product, Infra, Business Analysis, Transformation, M&A, Leadership, Legal, Strategy, Prompting, Sales/HR, Personal Dev, Therapy).

## 🎯 Vision

Construire un module **autonome** de simulation professionnelle qui couvre TOUS les métiers du numérique et de la transformation, avec moteur de conception (Practice Studio) et exécution (Simulator).

## 🏛️ Jalons majeurs

### 2026-03-26 — Genèse "Prompt Challenge"
- Demande utilisateur : *« mode pour apprendre à prompter, l'IA donne un sujet et le user prompt »*.
- Introduction du champ `practice_type` sur `academy_practices`.

### 2026-03-26 — Vision élargie : 12 → 30 → 50 modes
Itérations successives pour couvrir :
- Métiers tech : Engineering, Vibe Coding, Product Owner, Infra, Architecture, Dev.
- Métiers conseil : Business Analyst, Transformation, M&A, Restructuring.
- Métiers humains : Leadership, Therapy, Personal Development.
- Métiers transverses : Legal, Strategy, Prompting, Sales/HR.

### 2026-03-26 — Phase 1 : Foundation
- Migration `academy_practices` : ajout `practice_type` (text), `type_config` (jsonb).
- `MODE_REGISTRY` : 50 modes définis (`src/components/simulator/config/modeRegistry.ts`).
- 7 familles UI : Chat, Code, Document, Analysis, Decision, Design, Assessment.
- 14 univers métiers avec couleurs sémantiques.

### 2026-03-26 — Phase 2 : SimulatorShell universel
- `SimulatorShell.tsx` : wrapper commun à tous les modes.
- Header global avec badges univers/mode.
- Barre de progression `exchangeCount`/`maxExchanges`.
- Onboarding overlay au premier lancement (`OnboardingOverlay.tsx`).
- AI assistance levels : `none`, `guided`, `intensive`.

### 2026-03-26 — Phase 3 : Practice Designer (admin)
- Templates pré-configurés (`practiceTemplates.ts`) : 10 templates initiaux (Negotiation, Crisis, Code Review…).
- `PracticeDesigner.tsx` : éditeur visuel multi-onglets.

### 2026-03-26 — Phase 4 : Widgets enrichis
- `TensionGauge.tsx` (avec pulse animation).
- `KPIDashboard.tsx` (historique 4 dernières valeurs).
- `DecisionTimeline.tsx` (chronologie crise).
- `ObjectivesPanel.tsx`, `SuggestionChips.tsx`, `BriefingCard.tsx`, `HelpDrawer.tsx`, `InputQualityIndicator.tsx`, `TimerBar.tsx`.

### 2026-03 — Persistance & Historique
- `academy_practice_sessions` : messages, evaluation, score, started_at, completed_at.
- `SimulatorHistory.tsx` + `PortalPratiqueHistory.tsx` : historique apprenant.
- `SimulatorReport.tsx` : rapport éditorial narratif sans graphiques (5 KPIs ouvert).
- `SessionReplay.tsx` : replay des sessions exemplaires.

### 2026-03 — Modèle hybride de persistance
- Sessions transient (mode test) : aucun enregistrement.
- Sessions réelles : `academy_practice_sessions` enregistrée à chaque exchange.
- Règle métier : **chaque session doit se conclure par une restitution** ou message bloquant.

### 2026-04 — Practice Studio v2.0 (refonte)
Migration vers une expérience studio complète :
- 5 nouvelles tables : `practice_blocks`, `practice_variants`, `practice_versions`, `practice_organizations`, `practice_user_assignments`.
- 16 nouvelles colonnes sur `academy_practices` : `coaching_mode`, `model_override`, `temperature_override`, `evaluation_strategy`, `evaluation_dimensions`, `evaluation_weights`, `restitution_template`, `objectives`, `success_criteria`, `phases`, `hints`, `guardrails`, `attached_data`, `audience`, `universe`, `is_public`.
- 10 onglets : Identité, Scénario, IA & Prompts, Mécanique, Coaching, Variantes A/B, Évaluation, Diffusion, Analytics, Versions.

### 2026-04 — StudioShell + composants
- `StudioShell.tsx` : layout 3-panneaux (liste + canvas + preview live).
- `LivePreviewPanel.tsx` : preview temps réel via edge function `academy-practice` mode `preview_practice`.
- `BlockLibrary.tsx` : bibliothèque réutilisable (5 kinds : persona, rubric, guardrail, mechanic, prompt_snippet).
- `AICopilot.tsx` : copilote IA contextuel par onglet.

### 2026-04 — Edge functions
- `academy-practice` : exécution session (consomme tous les nouveaux champs).
- `practice-copilot` : copilote IA studio (génère variants, suggère prompts, raffine rubrics).

### 2026-04-16 — Practice Studio v2.4 (release courante)
Voir [📄 v2.4-practice-studio.md](./v2.4-practice-studio.md).

Décisions verrouillées :
1. **Cabinet `/simulator` aligné sur les pratiques admin** (union RLS public + org + assigned).
2. **Bouton Sauver retiré** (autosave + ⌘S).
3. **Pas de notif email** sur assignation.
4. **Blocs Org-only par défaut** (promotion globale réservée super-admin).

Améliorations :
- `DistributionTab` : fix query profiles (`user_id` + `display_name`).
- `IdentityTab` : auto-suggestion univers depuis MODE_REGISTRY.
- `BlockLibrary` : scope filters + promote super-admin.
- `AnalyticsTab` : score moyen par dimension + seuil winner ≥3 sessions.
- `PortalPratique` : badges scope réels + deadlines J-3.
- `PortalFormationsDashboard` : section "Pratiques assignées".

## 📊 Modèle de données (Practice Studio)

| Table | Rôle |
|---|---|
| `academy_practices` | Pratique (titre, scénario, system_prompt, type_config, evaluation_*, etc.) |
| `practice_blocks` | Blocs réutilisables (persona, rubric, guardrail, mechanic, snippet) |
| `practice_variants` | Variantes A/B (variant_label, system_prompt, weight, is_active) |
| `practice_versions` | Snapshots historiques |
| `practice_organizations` | Liaison org cible |
| `practice_user_assignments` | Assignation perso (user_id, due_date) |
| `academy_practice_sessions` | Exécutions (messages, evaluation, score) |

## 📦 État actuel

- ✅ 50+ modes opérationnels sur 14 univers.
- ✅ Studio complet 10 onglets avec autosave + ⌘S.
- ✅ Variantes A/B avec analytics dimension par dimension.
- ✅ Bibliothèque blocs scopée org/global.
- ✅ Cabinet + Portail alignés sur la même source RLS.
- ✅ Versioning automatique tous les 10 saves.

## 🧠 Références mémoire

- `mem://features/academy/simulator-logic` — Moteur 50+ modes
- `mem://ux/academy-simulator-ui` — 7 familles UI
- `mem://features/academy/simulator-reporting-history` — Reporting éditorial
- `mem://technical/academy/simulator-persistence-model` — Persistance hybride
- `mem://constraints/simulator-restitution-rule` — Règle restitution
- `mem://constraints/no-simulated-data` — Pas de données fictives
