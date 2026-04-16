# Module — Design Innovation (Challenges)

> Mode **structuré** où les participants répondent à des problématiques en glissant des cartes dans des slots prédéfinis. L'IA produit ensuite une analyse de maturité.

## 🎯 Vision

Diagnostic stratégique guidé : 3 à 7 sujets par challenge, chacun avec des slots typés (force, faiblesse, opportunité, action…). Seules les cartes placées dans des slots sont incluses dans l'analyse IA.

## 🏛️ Jalons majeurs

### 2026-03-10 — Création du module
- Décision : enrichir le Workshop libre avec un **mode structuré** complémentaire.
- Tables introduites :
  - `challenge_templates` (le challenge global, lié à un toolkit).
  - `challenge_subjects` (3-7 sujets par template).
  - `challenge_slots` (emplacements typés par sujet).
  - `challenge_responses` (cartes placées par les utilisateurs).
  - `challenge_analyses` (analyse IA générée).
- Enums : `challenge_slot_type` (`strength`, `weakness`, `opportunity`, `threat`, `action`, `metric`, `risk`, `custom`).

### 2026-03-10 — UI Challenge Board
- `ChallengeBoard.tsx` : layout 3-colonnes (sidebar cartes + zone sujet + analyse).
- `BoardZone.tsx` : zone par slot avec drop targets.
- `DraggableCard.tsx` : carte avec `dataTransfer.source-response-id` pour distinguer **move** vs **duplicate**.
- `StagingZone.tsx` : zone tampon pour pré-sélectionner des cartes avant placement.
- `MaturitySelector.tsx` : score 1-5 par carte placée.
- `FormatSelector.tsx` : variation visuelle (compact/large).

### 2026-03-10 — Vues Liste & Plateau
- Toggle entre vue **Liste** (séquentielle, sujet par sujet) et **Plateau** (global, tous les sujets visibles).
- Stepper de navigation `SubjectCanvas.tsx`.

### 2026-03-10 — Bug fixes critiques
- Drag-and-drop : duplication parasite corrigée (tracking via `source-response-id`).
- Suppression réparée en vue Plateau.
- Scroll horizontal ajouté en vue Plateau.
- Contrainte d'unicité DB : un bloc/slot ne peut contenir **qu'une carte unique** (pas de doublon).

### 2026-03 — Analyse IA
- Edge function `analyze-challenge` : prend en entrée toutes les `challenge_responses` d'un workshop, génère :
  - Score de maturité par sujet (0-100).
  - Forces / faiblesses identifiées.
  - Recommandations actionnables.
- Stockée dans `challenge_analyses.analysis` (JSONB).
- Composant `ChallengeAnalysis.tsx` : restitution éditoriale narrative.

### 2026-03-11 — Admin
- `AdminChallengeDetail.tsx` (4 onglets) :
  - **Info** : titre, description, toolkit lié.
  - **Subjects** : CRUD sujets + slots.
  - **Sessions** : liste des workshops ayant utilisé ce challenge.
  - **Analyses** : historique des analyses IA.

### 2026-04 — ChallengeRoom & PortalChallengeRoom
- Route dédiée pour exécuter un challenge en session collaborative.
- Réutilise les hooks `useChallengeData` + `useChallengeStaging`.

## 📦 État actuel

- ✅ 5 tables + RLS.
- ✅ Drag-and-drop fluide vues Liste/Plateau.
- ✅ Analyse IA générée par session.
- ✅ Admin CRUD complet (templates, subjects, slots).
- ✅ Contrainte unicité bloc/slot respectée.

## 🧠 Références mémoire

- `mem://product/modular-architecture` — Workshop libre vs Design Innovation
- `mem://features/design-innovation` — Gestion admin
- `mem://constraints/challenge-logic` — Unicité bloc/slot
