# Module — Academy / Formations

> LMS complet **multi-format** intégré à la plateforme : parcours, modules, quiz, exercices, pratiques IA, certificats vérifiables, gamification.

## 🎯 Vision

Permettre aux **cabinets de coaching et entreprises** de construire des parcours de formation IA personnalisés, avec génération de contenu assistée, évaluation IA et certification automatique.

## 🏛️ Jalons majeurs

### 2026-03-24 — Genèse Academy 1.0
- Décision : créer un module isolé avec **schéma DB dédié** (préfixe `academy_`) et edge functions séparées pour réutilisation cross-projets.
- **14 tables initiales** : `academy_personae`, `academy_paths`, `academy_modules`, `academy_contents`, `academy_quizzes`, `academy_quiz_questions`, `academy_exercises`, `academy_progress`, `academy_enrollments`, `academy_certificates`, `academy_campaigns`, `academy_campaign_targets`, `academy_path_modules`, `academy_skill_assessments`.
- Edge functions : `academy-generate` (génération path/modules), `academy-tutor` (chat pédagogique), `academy-skills-agent` (assessment).

### 2026-03-24 — Refonte Functions vs Personae
Distinction structurelle introduite :
- **Functions** (`academy_functions`) : rôles organisationnels (responsabilités, outils, KPIs, AI use cases).
- **Personae** (`academy_personae`) : profils comportementaux (habitudes, appétences, niveau d'expérimentation).

### 2026-03-24 — Audit "Academy 2.0"
- Constat utilisateur : *« banal, pas digne de ce que l'IA peut imaginer »*.
- Refonte vers une expérience IA-native :
  - Markdown enrichi avec embeds vidéo/iframe (`EnrichedMarkdown.tsx`).
  - Tutor IA conversationnel embarqué (`HeepAIWidget.tsx`).
  - Quiz adaptatifs (`QuizEngine.tsx`).
  - Pratiques IA (intégrées au Practice Studio).

### 2026-03 — Path & Module Detail
- `AdminAcademyPathDetail.tsx` (5 onglets : Info, Modules, Skills, Stats, Enrollments).
- `AdminAcademyModuleDetail.tsx` : CRUD contenu, quiz, exercices, pratique.
- `AcademyModule.tsx` (apprenant) : reader Markdown + quiz inline + tracking temps passé.

### 2026-03 — Adaptive Learning
- Diagnostic initial de positionnement.
- Embranchement dynamique selon score.
- Skill assessments stockés dans `academy_skill_assessments` (initial_level, final_level, evidence).

### 2026-04 — Certification System
- Tables : `academy_certificates`, `academy_certificate_config`.
- Edge function `verify-certificate` : page publique `/verify-certificate/:id`.
- `CertificateDownload.tsx` : génération PDF avec QR code.
- Configuration par parcours : `min_score`, `template_key`, `custom_signature`, `webhook_url`.
- Logique de normalisation des KPIs (fallback naming systématique).

### 2026-04 — Knowledge IA
- Agent expert intégré à la vue détaillée du certificat.
- Exploite le contenu des modules + résultats apprenant pour répondre aux questions.

### 2026-04 — Gamification
- Streaks (jours consécutifs).
- Multiplicateurs d'XP.
- Heatmap d'activité 12 semaines (`PortalFormationsDashboard.tsx`).
- Badges/trophées.

### 2026-04 — Pedagogical Booklet v2
- Document de restitution complet 8-15 pages.
- Regroupe contenu modules + quiz + exercices + pratiques.
- Edge function `academy-path-document`.

### 2026-04 — Évaluation finale du parcours
- Section auto-générée à 100% complétion.
- Note globale + feedback narratif.
- Stockée dans `academy_path_feedback` (overall_rating, difficulty_rating, relevance_rating, testimonial, would_recommend, AI insights).

### 2026-04 — Persistance interactions profondes
- Toutes les réponses quiz, soumissions exercices, sessions de pratique persistées.
- `academy_progress.metadata` (JSONB) : answers, time per question, hints used.

### 2026-04 — Personalisation tutor IA
- L'IA pédagogique s'adresse à l'apprenant par son prénom.
- Adapte ton et exemples au persona/function de l'apprenant.
- Posture coach, jamais professorale.

### 2026-04 — Path Visuals AI
- Colonne `cover_image_url` sur `academy_paths`.
- Pipeline de génération d'images (style "Professional e-learning course cover").
- Stockage dans bucket `academy-assets`.

### 2026-04 — Campaigns
- `academy_campaigns` : enrôlement en masse par org/team.
- `academy_campaign_targets` (target_type : org / team / user).
- Reminder config (cadence emails de relance).

### 2026-04 — Versioning
- `academy_asset_versions` : snapshot JSON à chaque modification.
- Trigger `capture_asset_version()` sur quizzes, exercises, practices, paths, personae, campaigns.
- Composant `VersionHistory.tsx` avec rollback.

### 2026-04 — Observatory Assets
- Trigger `sync_observatory_asset()` : agrège statut, contributeurs, version count.
- Vue `AdminObservabilityCatalogue.tsx` : catalogue cross-asset filtrable.

## 📊 Modèle de données

| Table | Rôle |
|---|---|
| `academy_paths` | Parcours (skills, aptitudes, prerequisites, professional_outcomes, guide_document) |
| `academy_modules` | Modules (estimated_minutes, objectives, module_type) |
| `academy_path_modules` | Liaison ordonnée |
| `academy_contents` | Contenus (markdown, video, embed) |
| `academy_quizzes` + `academy_quiz_questions` | Quiz (passing_score, question types) |
| `academy_exercises` | Exercices (instructions, evaluation_criteria, expected_output_type) |
| `academy_practices` | Pratiques IA (lien Practice Studio) |
| `academy_enrollments` | Inscriptions |
| `academy_progress` | Progression module (status, score, time_spent_seconds, metadata) |
| `academy_certificates` | Certificats émis |
| `academy_path_feedback` | Évaluation finale apprenant |
| `academy_skill_assessments` | Diagnostics initiaux + finaux |
| `academy_campaigns` + `_targets` | Enrôlement en masse |
| `academy_personae` + `academy_functions` | Profils cibles |
| `academy_asset_versions` | Historique versions |
| `academy_document_sends` | Tracking envois booklets |

## 📦 État actuel

- ✅ 18 tables + RLS complète.
- ✅ Génération IA bout-en-bout (path → modules → quiz → exercices → pratiques → cover image).
- ✅ Tutor IA personnalisé.
- ✅ Certificats publics vérifiables.
- ✅ Booklet pédagogique 8-15 pages.
- ✅ Versioning + Observatory.
- ✅ Gamification (streaks, heatmap, XP).

## 🧠 Références mémoire

- `mem://features/academy/architecture-roles-behaviors-v2` — Functions vs Personae
- `mem://features/academy/path-skills-management` — Skills, aptitudes, prerequisites
- `mem://features/academy/adaptive-learning-logic` — Embranchement dynamique
- `mem://features/academy/global-path-evaluation` — Évaluation finale
- `mem://features/academy/pedagogical-booklet-v2` — Booklet 8-15 pages
- `mem://features/academy/deep-interaction-persistence` — Persistance interactions
- `mem://features/academy/professional-tutor-inline` — Tutor inline
- `mem://features/academy/path-visuals-ai` — Cover images AI
- `mem://features/academy/gamification-mechanics` — Streaks & XP
- `mem://ai/pedagogical-tutor-personalization` — Personnalisation tutor
- `mem://ai/knowledge-ia-agent` — Knowledge IA
- `mem://product/academy-certification-system` — Certificats
- `mem://style/academy-path-visuals-standard` — Style covers
- `mem://style/ai-content-rendering-standards` — Markdown enrichi
- `mem://technical/kpi-normalization-logic` — Normalisation KPIs
