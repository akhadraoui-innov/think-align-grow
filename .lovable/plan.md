

# Plan — Jeu de test complet pour le parcours Process Mining IA Augmented (Ammar Khadraoui)

## Audit de l'existant

**Utilisateur** : Ammar Khadraoui (`315af24d-afe3-4162-9b78-45274c0fe5dc`)
**Parcours** : Process Mining IA Augmented (`036db7ea-359a-4359-9be2-2697a0a0d6f7`)
**Enrollment** : `4168351f-6a24-4589-917f-4ff0ff30f828` — status `completed`
**Certificat** : `64c9a665-2903-42a5-bf7a-24a01d01f920` — actif

### État par module

| # | Module | Type | Score | Metadata | Problèmes |
|---|--------|------|-------|----------|------------|
| 0 | Introduction PM + IA | lesson | 100 | `{}` vide | ❌ Pas de metadata (read_at, time_seconds manquants). time_spent=11s irréaliste. started_at=null |
| 1 | Extraction et Préparation | exercise | 88 | Riche (submission, evaluation, criteria) | ✅ Bon. Manque `submitted_at` dans le format attendu par ModuleReviewView |
| 2 | Découverte et Conformité | lesson | 100 | Riche (bookmarks, sections, reading_time) | ✅ Bon |
| 3 | Prédiction et Optimisation | quiz | 92 | Riche (12 answers détaillées) | ⚠️ Format incomplet : manque `explanation`, `points`, `question_type` par réponse. Pas de `best_streak`, `total_xp` |
| 4 | Cas Pratiques Industriels | practice | 85 | Evaluation + session_summary | ❌ Pas de `practice_session_id` → ModuleReviewView ne peut pas charger la session |

### Données associées
- **Feedback parcours** : ✅ Existe (5★, testimonial)
- **Skill assessments** : ✅ 8 compétences évaluées (mais skills ne matchent pas les skills du path)
- **Practice session liée** : ❌ Aucune session avec `enrollment_id` correspondant
- **Certificat** : ✅ Existe mais `certificate_data.modules_detail` a des titres tronqués

## Corrections et enrichissements à effectuer

### 1. Module 0 (Leçon) — Enrichir metadata + corriger timing
UPDATE `academy_progress` pour le module `b131e819-42be-4429-a378-33a1680909ac` :
- `started_at` → `2026-03-02T09:00:00Z`
- `completed_at` → `2026-03-02T10:30:00Z`
- `time_spent_seconds` → `5400` (1h30)
- `metadata` → metadata riche de type leçon avec `read_at`, `time_seconds`, `sections_visited`, `bookmarks`, `ai_brief`, `ai_debrief`

### 2. Module 3 (Quiz) — Enrichir les réponses avec le format complet
UPDATE metadata pour ajouter `explanation`, `question_type`, `points` à chaque réponse. Ajouter `best_streak`, `total_xp`, format conforme à ce que `AcademyQuiz.tsx` produit maintenant.

### 3. Module 4 (Pratique) — Créer une session complète et lier
INSERT une `academy_practice_sessions` avec :
- `enrollment_id` = enrollment ID
- Messages réalistes (12 échanges consultant/IA sur diagnostic Supply Chain)
- Évaluation avec dimensions, scores, feedback
- Score 85
UPDATE `academy_progress.metadata` pour ajouter `practice_session_id`

### 4. Module 1 (Exercice) — Normaliser le format metadata
UPDATE pour aligner le format avec ce que `AcademyExercise.tsx` produit : `submissions[]` array avec `text`, `score`, `strengths`, `improvements`, `submitted_at`

### 5. Skill assessments — Aligner avec les skills du parcours
Les skills du path sont : Modélisation de processus, Analyse de conformité, Event log mining, Découverte automatique, Analyse prédictive IA, Optimisation de processus, Data storytelling, Gestion du changement, KPI process performance, Celonis/ProM/Disco.
Les assessments actuels ne matchent que partiellement. INSERT les skills manquants (Event log mining, Découverte automatique, Analyse prédictive IA, Data storytelling, KPI process performance).

### 6. Certificat — Enrichir certificate_data
UPDATE avec modules_detail complets (titres complets, scores, time_minutes cohérents), skills acquises, aptitudes, score moyen recalculé.

### 7. Profil — Compléter les infos manquantes
UPDATE `profiles` pour Ammar : `job_title`, `department`, `email` — nécessaire pour le contexte IA du tuteur.

## Méthode d'exécution

Toutes les opérations sont des UPDATEs/INSERTs de données → utiliser l'outil `insert` (pas de migration). Exécution en séquence :

1. UPDATE profil Ammar (job_title, department)
2. UPDATE module 0 metadata + timing
3. UPDATE module 3 quiz metadata enrichi
4. UPDATE module 1 exercise metadata normalisé
5. INSERT practice session complète (12 messages)
6. UPDATE module 4 metadata avec practice_session_id
7. INSERT skill assessments manquants (5 skills)
8. UPDATE certificat certificate_data enrichi

## Fichiers code impactés

Aucun — il s'agit uniquement de données de test en base.

