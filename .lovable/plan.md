

# Plan — Refonte totale de l'expérience apprenant avec IA intégrée et mode lecture post-complétion

## Vision

Chaque interaction de l'apprenant (réponse quiz, soumission exercice, échange pratique, lecture leçon) est **persistée dans `academy_progress.metadata`**. Une fois le module terminé, l'apprenant voit le **même contenu enrichi de ses données** (réponses, feedback IA, échanges) en mode lecture seule. Le Knowledge IA exploite tout ce contexte pour ses analyses.

## Architecture

```text
┌──────────────────────────────────────────────────────┐
│  PortalFormationsModule / AcademyModule               │
│                                                       │
│  isCompleted ?                                        │
│  ├─ NON → Mode Apprentissage (actuel, inchangé)      │
│  │         + IA inline (brief pré-module, feedback)   │
│  │         + Persistance auto dans metadata           │
│  │                                                    │
│  └─ OUI → Mode Lecture (ModuleReviewView)             │
│            Même UI enrichie des données utilisateur   │
│            + Onglets: Résultat | Analyse IA | Brief   │
│            + Bouton "Refaire" → repasse en mode actif │
└──────────────────────────────────────────────────────┘
         ↕
┌──────────────────────────────────────────────────────┐
│  academy-tutor (edge function)                        │
│  Actions: brief | explain | coach | debrief           │
│  Contexte: path skills, module objectives, metadata,  │
│  user profile, progression complète                   │
└──────────────────────────────────────────────────────┘
```

---

## 1. Persistance des données utilisateur — `useAcademyModule.ts`

Ajouter un paramètre `metadata` optionnel à `saveProgress`. Le metadata est **mergé** avec l'existant (pas remplacé) pour accumuler les tentatives.

```typescript
saveProgress(score, "completed", {
  quiz_answers: [...],           // Quiz
  submissions: [...],            // Exercice
  practice_session_id: "..."     // Pratique
})
```

---

## 2. Persistance par type de pédagogie

### Quiz (`AcademyQuiz.tsx`)
- Après chaque réponse (`handleConfirm`), accumuler dans un ref local : `{ question, question_type, user_answer, correct_answer, is_correct, explanation, points, time_seconds }`
- Au `onComplete`, passer le tableau complet via metadata : `{ quiz_answers: [...], best_streak, total_xp, attempt: N }`
- **IA inline** : après chaque réponse (correct ou non), appeler `academy-tutor` action `explain` pour 2-3 phrases contextuelles. Afficher sous la réponse dans une card "Insight IA" avec icone Sparkles.

### Exercice (`AcademyExercise.tsx`)
- Chaque soumission + feedback IA est déjà en state local (`history[]`). Au `onComplete`, passer via metadata : `{ submissions: [{ text, score, strengths, improvements, summary, submitted_at }] }`
- **IA inline pré-soumission** : card "Guide méthodologique" auto-chargée (appel `academy-tutor` action `coach` phase `pre`), affichée au-dessus du textarea.

### Pratique (`AcademyPractice.tsx`)
- Déjà persistée dans `academy_practice_sessions`. Au `onComplete`, passer le `session_id` dans metadata : `{ practice_session_id: "..." }`
- Aucun changement d'UI nécessaire, la pratique a déjà l'IA intégrée.

### Leçon
- Au `handleMarkComplete`, persister : `{ read_at: ISO, time_seconds: N }`
- **IA inline** : card "Brief" auto-chargée en haut (appel `academy-tutor` action `brief`) avec objectifs personnalisés. Card "Debrief" en bas après le contenu (appel `debrief`) avec synthèse concepts clés.

---

## 3. Edge Function `academy-tutor`

Nouvelle edge function. Modèle : `google/gemini-2.5-flash`.

| Action | Déclencheur | Input | Output |
|--------|------------|-------|--------|
| `brief` | Ouverture module non-complété | module title/objectives, path skills, user function | Markdown : objectifs, importance, lien compétences |
| `explain` | Après réponse quiz | question, user_answer, correct_answer, is_correct, module context | Markdown : explication enrichie 2-3 phrases |
| `coach` | Avant/après soumission exercice | instructions, submission (opt), phase (pre/post) | Markdown : guide méthodo ou feedback itératif |
| `debrief` | Module complété | module metadata, scores, path context | Markdown : concepts clés, prépa module suivant |

Contexte RAG injecté dans chaque appel : contents du module, objectives, skills du parcours, profil utilisateur (via `profiles` + `academy_function_users`).

---

## 4. Mode Lecture post-complétion — `ModuleReviewView.tsx`

Nouveau composant. Quand `currentProgress.status === "completed"`, remplace le contenu actif par une vue lecture avec **3 onglets** :

### Onglet "Résultat" (défaut)
Varie selon le type de module, affiche les données de `metadata` :

- **Leçon** : contenu original + badge "Terminé" + temps passé + brief/debrief IA s'ils existent dans metadata
- **Quiz** : chaque question avec la réponse de l'utilisateur (badge vert/rouge), bonne réponse, explication. Score global, stats (streak, XP). Graphique correct/incorrect
- **Exercice** : dernière soumission formatée, feedback IA détaillé (strengths/improvements/score). Historique des tentatives en accordéon
- **Pratique** : charge la session complète depuis `academy_practice_sessions` (messages + évaluation). Affiche la conversation en lecture + radar d'évaluation

### Onglet "Analyse IA"
Appel `academy-tutor` action `debrief` étendu avec metadata complète : patterns d'erreurs, compétences maîtrisées vs à travailler, recommandations. Résultat mis en cache dans metadata.

### Onglet "Knowledge Brief"
Synthèse des concepts clés du module, liens avec les modules suivants, ressources. Appel `academy-tutor` action `debrief` focalisé sur le knowledge.

### Bouton "Refaire"
Visible pour quiz/exercice/pratique. Permet de recommencer tout en gardant l'historique dans metadata (append, pas replace).

---

## 5. Intégration dans les pages module

### `PortalFormationsModule.tsx` + `AcademyModule.tsx`

Modifier `renderContent()` :
```
if (isCompleted && currentProgress?.metadata) {
  return <ModuleReviewView module={module} metadata={currentProgress.metadata}
    contents={contents} enrollment={enrollment} onRefaire={() => { /* reset */ }} />
}
// ... sinon, mode apprentissage actuel (inchangé)
```

Le mode apprentissage actuel reste **strictement identique**. Le mode lecture est un ajout conditionnel.

---

## 6. Impact sur Knowledge IA

Le Knowledge IA (onglet "Analyse & REX" du certificat) appelle `academy-skills-agent` action `knowledge`. On enrichit le contexte RAG injecté pour inclure les **metadata de chaque module** : réponses quiz, soumissions exercice, échanges pratique, analyses IA. Cela permet à l'agent de faire des retours précis basés sur ce que l'apprenant a réellement fait.

Modification dans `academy-skills-agent/index.ts` fonction `knowledgeChat` : requêter `academy_progress.metadata` en plus des contents.

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `supabase/functions/academy-tutor/index.ts` | **Créer** — Agent IA pédagogique (brief, explain, coach, debrief) |
| `src/components/academy/ModuleReviewView.tsx` | **Créer** — Vue lecture post-complétion 3 onglets |
| `src/hooks/useAcademyModule.ts` | Ajouter `metadata` à `saveProgress`, merger avec existant |
| `src/components/academy/AcademyQuiz.tsx` | Persister réponses dans metadata + card "Insight IA" inline après chaque réponse |
| `src/components/academy/AcademyExercise.tsx` | Persister soumissions dans metadata + card "Guide IA" pré-soumission |
| `src/components/academy/AcademyPractice.tsx` | Passer `practice_session_id` dans metadata au onComplete |
| `src/pages/portal/PortalFormationsModule.tsx` | Toggle mode lecture si complété |
| `src/pages/AcademyModule.tsx` | Miroir portail |
| `supabase/functions/academy-skills-agent/index.ts` | Enrichir contexte RAG avec metadata progress |
| `supabase/config.toml` | Ajouter `[functions.academy-tutor]` |

## Ordre d'exécution

1. Modifier `useAcademyModule.ts` — saveProgress avec metadata merge
2. Modifier `AcademyQuiz.tsx` — persistance réponses + IA inline explain
3. Modifier `AcademyExercise.tsx` — persistance soumissions + IA guide
4. Modifier `AcademyPractice.tsx` — lier session_id dans metadata
5. Créer edge function `academy-tutor` (brief, explain, coach, debrief)
6. Créer `ModuleReviewView.tsx` — vue lecture post-complétion
7. Intégrer dans PortalFormationsModule + AcademyModule (toggle lecture/apprentissage)
8. Enrichir `academy-skills-agent` avec metadata dans le contexte RAG

