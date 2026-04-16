# Module — Toolkits & Cards

> Toolkits stratégiques structurés en **Piliers / Phases / Cartes**, avec quatre modes de rendu (Section, Preview, Full, Gamifié).

## 🎯 Vision

Capitaliser des **frameworks stratégiques** sous forme de toolkits réutilisables. Chaque toolkit (ex. *Bootstrap in Business*, *Innovation/Product*, *IA*) contient des cartes organisées en piliers, avec définitions, raisons d'être, actions concrètes et KPIs mesurables.

## 🏛️ Jalons majeurs

### 2026-03-08 — Toolkit fondateur "Bootstrap in Business" (CPAM)
- Import des **200 cartes CPAM authentiques** : Definition, Why, Action, KPI.
- 10 piliers répartis sur 4 phases d'exécution : Foundations, Model, Growth, Execution.
- Tables : `toolkits`, `pillars`, `cards`.

### 2026-03-08 — Refonte multi-toolkit
- Décision : abandon de l'approche par personas → architecture **multi-toolkit**.
- `Hack & Show` devient le premier toolkit d'un catalogue extensible.
- Edge function `import-toolkit-cards` pour seed batch.

### 2026-03-09 — Modes de carte
Quatre modes de rendu introduits dans `CanvasCard.tsx` :
1. **Section** (compact, fond coloré pour layout dense).
2. **Preview** (carte de catalogue avec icône + titre + définition).
3. **Full** (vue détaillée avec tous les champs : objectif, action, KPI, qualification, durée).
4. **Gamifié** (mode jeu avec valorisation et difficulté).

Les modes Section et Preview sont les seuls disponibles en sidebar pour économiser l'espace.

### 2026-03-11 — Admin Toolkit Management
- Page `AdminToolkits.tsx` + `AdminToolkitDetail.tsx` (8 onglets : Info, Pillars, Cards, Quiz, Game Plans, Challenges, Orgs, Cards Browser).
- CRUD complet sur cartes/piliers avec drag-to-reorder.
- Onglet Orgs pour assigner un toolkit à une organisation.

### 2026-03 — Génération IA de toolkits
- Edge function `generate-toolkit` : génère un toolkit complet (piliers + 20+ cartes).
- Edge function `refine-toolkit` : enrichissement IA mode `complete_missing` (remplit les champs vides sans écraser).
- `ToolkitAIChatDialog.tsx` : dialogue conversationnel pour piloter la génération.

### 2026-03 — Game Plans
- Onglet Game Plans dans l'admin : compose des séquences narratives de cartes pour gamification.
- Mode Gamifié des cartes : `valorization` (points) + `difficulty`.

## 📊 Modèle de données

### Tables principales
- `toolkits` : le contenant.
- `pillars` : groupes thématiques (1-N).
- `cards` : 200+ cartes avec champs `phase`, `pillar_id`, `definition`, `why`, `action`, `kpi`, `objective`, `qualification`, `duration_minutes`, `difficulty`, `valorization`, `step_name`, `tags`.
- `card_phase` enum : `foundations`, `model`, `growth`, `execution`.

### Relations
- Toolkit ↔ Organization via `toolkit_organizations`.
- Toolkit ↔ Challenge templates (1-N) via `challenge_templates.toolkit_id`.

## 📦 État actuel

- ✅ 1 toolkit principal (Bootstrap in Business) avec 200 cartes seedées.
- ✅ Catalogue extensible via admin UI.
- ✅ 4 modes de rendu opérationnels (Section / Preview / Full / Gamifié).
- ✅ IA capable de générer + raffiner des toolkits complets.
- ✅ Browser de cartes filtrable (`ToolkitCardsBrowser.tsx`).

## 🧠 Références mémoire

- `mem://product/content-structure` — Toolkit / Pillar / Card
- `mem://features/card-modes` — 4 modes de rendu
- `mem://ai/toolkit-lifecycle` — Cycle de vie IA
