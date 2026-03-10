

## Nouveau module : Challenge Canvas (Drag & Drop stratégique)

### Concept

Un mode structuré dans le Workshop où les participants répondent à des problématiques en plaçant des cartes du toolkit sur des emplacements prédéfinis. L'IA analyse ensuite les réponses pour évaluer la maturité et proposer des réflexions.

### Architecture base de données

```text
challenge_templates          challenge_subjects           challenge_slots
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│ id               │───┐    │ id               │───┐    │ id               │
│ name             │   │    │ template_id (FK) │   │    │ subject_id (FK)  │
│ description      │   └───>│ title            │   └───>│ label            │
│ pillar_id (null) │        │ description      │        │ slot_type        │
│ toolkit_id       │        │ type (question/   │        │ hint             │
│ difficulty       │        │  challenge/context)│       │ sort_order       │
│ created_at       │        │ sort_order       │        │ required         │
└──────────────────┘        └──────────────────┘        └──────────────────┘

challenge_responses (per workshop session)
┌──────────────────┐
│ id               │
│ workshop_id      │
│ subject_id       │
│ slot_id          │
│ card_id          │
│ user_id          │
│ created_at       │
└──────────────────┘

challenge_analyses (AI results)
┌──────────────────┐
│ id               │
│ workshop_id      │
│ template_id      │
│ analysis (jsonb) │  ← per-subject + global maturity scores, interpretations
│ created_at       │
└──────────────────┘
```

- `pillar_id` nullable : si renseigné, le template est lié à un deck spécifique ; sinon il est générique (toutes les cartes)
- `slot_type` : "single" (1 carte), "multi" (plusieurs cartes), "ranked" (ordre important)
- RLS : participants du workshop peuvent lire/écrire les responses, host peut tout gérer

### UI — Composants

| Composant | Rôle |
|---|---|
| `ChallengeView.tsx` | Page principale : navigation entre sujets (tabs/stepper), bouton "Analyser" |
| `SubjectCanvas.tsx` | Affiche une problématique + ses emplacements en grille adaptative |
| `DropSlot.tsx` | Zone de drop avec label, hint, type visuel (border dashed, couleur pilier) |
| `DraggableCard.tsx` | Wrapper autour des cartes existantes avec drag handle (HTML5 DnD ou pointer events) |
| `ChallengeAnalysis.tsx` | Affichage des résultats IA : radar par sujet, score maturité, réflexions |

### Flux utilisateur

1. L'hôte choisit un template de challenge lors de la création/dans le workshop actif
2. Les participants voient le premier sujet avec ses emplacements vides
3. Ils drag des cartes depuis la sidebar (identique) vers les emplacements
4. Les cartes hors emplacements restent sur le canvas mais ne comptent pas
5. Navigation entre sujets via tabs ou stepper
6. L'hôte clique "Analyser" → appel edge function IA
7. L'IA retourne : interprétation par sujet, maturité (1-5) par sujet et globale, réflexions

### Edge function `analyze-challenge`

- Reçoit workshop_id + template_id
- Récupère toutes les responses (quelles cartes dans quels slots)
- Construit un prompt avec le contexte des sujets, slots, et cartes placées
- Appelle Lovable AI (gemini-2.5-pro pour la qualité d'analyse)
- Utilise tool calling pour extraire : `{ subjects: [{ title, maturity, interpretation, reflections }], global_maturity, summary }`
- Stocke dans `challenge_analyses`

### Template initial complet

Après le développement, création d'un template "Diagnostic Stratégique" avec 5 sujets :
1. **Vision & Positionnement** — "Comment structurez-vous votre vision ?" (4 slots)
2. **Modèle économique** — "Quels leviers financiers activez-vous ?" (5 slots)
3. **Exécution & Opérations** — "Comment pilotez-vous l'exécution ?" (4 slots)
4. **Croissance** — "Quels moteurs de croissance privilégiez-vous ?" (6 slots)
5. **Gouvernance & Équipe** — "Comment structurez-vous la prise de décision ?" (3 slots)

### Fichiers à créer/modifier

| Fichier | Action |
|---|---|
| Migration SQL | 5 tables + RLS + realtime |
| `src/pages/WorkshopRoom.tsx` | Ajouter toggle canvas libre / challenge mode |
| `src/components/challenge/ChallengeView.tsx` | Nouveau |
| `src/components/challenge/SubjectCanvas.tsx` | Nouveau |
| `src/components/challenge/DropSlot.tsx` | Nouveau |
| `src/components/challenge/DraggableCard.tsx` | Nouveau |
| `src/components/challenge/ChallengeAnalysis.tsx` | Nouveau |
| `src/hooks/useChallengeData.ts` | Fetch templates, subjects, slots, responses |
| `supabase/functions/analyze-challenge/index.ts` | Edge function IA |
| Seed data migration | Template "Diagnostic Stratégique" |

