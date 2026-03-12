

## Expérience de génération IA immersive avec suivi en temps réel

### Ce qui change pour vous
Aujourd'hui, quand vous lancez une génération, vous voyez un spinner avec des messages qui tournent sans lien avec la réalité. Vous ne savez pas ce qui se passe, ni où en est l'IA. En plus, la génération s'arrête après le premier pilier (bug de parsing).

Demain : une expérience complète en 3 phases.

**Phase 1 — Progression en direct**
Le dialog se transforme en écran de suivi. Une timeline verticale apparaît avec chaque étape :
- Toolkit créé en base
- Pilier "Thinking" — 20 cartes générées
- Pilier "Innovation" — en cours...
- Pilier "Business" — en attente
- Quiz — en attente

Chaque ligne passe de "en attente" → "en cours" (animation pulse) → "terminé" (check vert + nombre de cartes). Vous voyez exactement où en est la machine.

**Phase 2 — Écran de réussite**
Quand tout est terminé, l'écran bascule vers un récap visuel :
- Emoji + nom du toolkit
- Nombre total de piliers, cartes, questions quiz
- Animation de confettis / celebration
- Bouton principal : "Découvrir le toolkit"
- Bouton secondaire : "Retour à la liste"

**Phase 3 — Correction du bug**
Le moteur IA est corrigé : augmentation de la capacité de réponse, gestion des formats de retour variés, et ajout d'un mécanisme de retry automatique si l'IA échoue sur un pilier.

### Architecture technique

**Edge function `generate-toolkit`** — Réponse en streaming (Server-Sent Events)

Au lieu de tout calculer puis renvoyer une seule réponse, la fonction envoie des événements au fur et à mesure :

```text
data: {"type":"progress","step":"toolkit_created","toolkit_id":"xxx"}
data: {"type":"progress","step":"pillars_generated","pillars":["Thinking","Innovation",...]}
data: {"type":"progress","step":"cards_generating","pillar":"Thinking","index":0,"total":8}
data: {"type":"progress","step":"cards_done","pillar":"Thinking","count":20}
data: {"type":"progress","step":"cards_generating","pillar":"Innovation","index":1,"total":8}
...
data: {"type":"progress","step":"quiz_generating","pillar":"Thinking"}
data: {"type":"progress","step":"quiz_done","pillar":"Thinking","count":4}
data: {"type":"complete","toolkit_id":"xxx","pillars":8,"cards":160,"quiz":32}
```

Corrections incluses :
- `max_tokens` porté à 16000 pour les cartes
- Nettoyage des blocs markdown avant parsing JSON
- Retry automatique (1 tentative) par pilier en cas d'échec
- Logs détaillés pour le debug

**Frontend `AdminToolkits.tsx`** — Timeline de génération immersive

Le hook `generateWithAI` est remplacé par un appel `fetch` direct au stream SSE. Un état local `GenerationState` pilote l'affichage :

```text
type GenerationState = {
  phase: "generating" | "complete" | "error";
  toolkitId?: string;
  pillarNames: string[];
  currentPillarIndex: number;
  completedPillars: Map<string, { cards: number }>;
  quizCompleted: Map<string, number>;
  totalCards: number;
  totalQuiz: number;
};
```

L'UI dans le dialog affiche :
- En haut : barre de progression globale (% basé sur piliers terminés)
- Au centre : timeline scrollable avec chaque étape
- En bas : message contextuel + temps écoulé

Puis à la fin : écran de célébration avec stats et CTA.

### Fichiers

| Fichier | Changement |
|---------|-----------|
| `supabase/functions/generate-toolkit/index.ts` | Refonte en streaming SSE + fix parsing + retry + max_tokens |
| `src/pages/admin/AdminToolkits.tsx` | Timeline de suivi en temps réel + écran de complétion |
| `src/hooks/useAdminToolkits.ts` | Pas de changement (mutation conservée pour invalidation) |

