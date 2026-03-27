

# Audit E2E du flux Pratique → Rapport → Historique — Bugs identifiés & Corrections

## Bugs critiques identifiés

### Bug 1 — Messages incomplets dans la session persistée
**ChatMode.tsx ligne 175** : `onComplete(evalData.score, updatedMessages, evalData)` — `updatedMessages` ne contient que les messages jusqu'au dernier message utilisateur. La réponse assistant (contenant l'évaluation) n'est PAS incluse. Le transcript sauvegardé en DB est donc tronqué.

**Fix** : Au moment de l'appel `onComplete`, construire la liste complète incluant le message assistant final avec `fullContent`.

### Bug 2 — ScoreReveal sans sessionId → bouton "Voir rapport" invisible
**ChatMode.tsx ligne 291** : `<ScoreReveal ... />` ne reçoit pas la prop `sessionId`. Or le sessionId est dans `SimulatorEngine` via `useSimulatorSession`, jamais transmis aux modes enfants.

**Fix** : Ajouter une prop `sessionId` dans les modes. SimulatorEngine expose `sessionId` depuis le hook et le passe via `modeProps`.

### Bug 3 — Double navigation potentielle
SimulatorEngine.handleComplete navigue vers `/report` après 600ms. Mais ScoreReveal s'affiche aussi dans ChatMode. Si ScoreReveal a un sessionId, l'utilisateur pourrait cliquer "Voir rapport" pendant le timeout.

**Fix** : Supprimer le `setTimeout` navigate dans SimulatorEngine. Laisser ScoreReveal gérer la navigation via son bouton "Voir le rapport complet". OU supprimer ScoreReveal inline et naviguer directement.

**Choix** : Naviguer directement vers le rapport (pas de ScoreReveal intermédiaire) — c'est le flux validé dans le plan.

### Bug 4 — `onMessagesChange` appelé avec messages incomplets
**ChatMode.tsx ligne 176** : `onMessagesChange(updatedMessages)` est appelé APRÈS le streaming, mais avec `updatedMessages` (snapshot pré-assistant). Les messages persistés via `persistSession` sont donc aussi incomplets.

**Fix** : Appeler `onMessagesChange` avec la liste complète incluant l'assistant.

### Bug 5 — Standalone practices (`__standalone__`) non retrouvées en historique
Le `SimulatorHistory` fait un join `academy_practices(title, practice_type, difficulty)`. Pour les sessions `__standalone__`, `practice_id = "__standalone__"` ne correspond à aucune practice en DB → le join échoue silencieusement, la session apparaît sans titre.

**Fix** : Gérer le fallback pour practice_id `__standalone__` dans l'historique (afficher le titre depuis les messages ou un label générique).

## Plan de corrections

### Fichier 1 — `src/components/simulator/modes/ChatMode.tsx`
- Ligne 175 : Construire `allMessages = [...updatedMessages, { id: assistantMsg.id, role: "assistant", content: fullContent, timestamp: assistantMsg.timestamp }]` et passer `allMessages` à `onComplete` et `onMessagesChange`
- Ajouter prop `sessionId?: string` à `ChatModeProps`
- Passer `sessionId` au ScoreReveal (ligne 291)

### Fichier 2 — `src/components/simulator/SimulatorEngine.tsx`
- Exposer `sessionId` depuis `useSimulatorSession`
- Passer `sessionId` dans `modeProps`
- Retirer le `setTimeout(() => navigate(...))` dans handleComplete — la navigation se fait via ScoreReveal ou directement

### Fichier 3 — `src/components/simulator/modes/CodeMode.tsx` et `AnalysisMode.tsx`
- Même fix : prop `sessionId`, messages complets dans onComplete/onMessagesChange

### Fichier 4 — `src/pages/SimulatorHistory.tsx`
- Gérer le cas `practice_id === "__standalone__"` : afficher "Session libre" au lieu d'un titre vide
- Utiliser un left join ou un fallback sur le titre

### Fichier 5 — `src/pages/SimulatorReport.tsx`
- Gérer le cas où `practice` est null (session standalone) : afficher un titre fallback

## Ordre d'exécution

1. ChatMode — fix messages complets + prop sessionId
2. CodeMode + AnalysisMode — même pattern
3. SimulatorEngine — exposer sessionId, retirer navigate auto
4. SimulatorHistory — fallback standalone
5. SimulatorReport — fallback standalone

