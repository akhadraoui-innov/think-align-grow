

# Diagnostic & Correction — Dernière pratique absente de l'historique

## Problemes potentiels identifiés

### 1. Session non complétée (cause la plus probable)
Si l'utilisateur a fermé la session avant que l'IA ne génère l'évaluation finale (bloc ````evaluation`), `completeSession` n'est jamais appelé. La session peut être soit :
- Jamais insérée (si aucun `persistSession` n'a eu le temps de s'exécuter — le debounce de 500ms peut être interrompu)
- Insérée sans `completed_at` ni `score` — elle apparaîtrait comme "En cours" dans l'historique

### 2. Debounce trop lent
`persistSession` utilise un `setTimeout(500ms)`. Si l'utilisateur navigue avant que le timeout ne se déclenche, la session n'est jamais écrite en base.

### 3. Edge function erreur 500
L'edge function `academy-practice` a renvoyé une erreur 500 (Missing practice_id) lors de sessions précédentes — ce qui a pu empêcher la session de produire une évaluation, donc pas de `completeSession`.

## Plan de correction

### Étape 1 — Requête diagnostic en base
Vérifier les sessions existantes de l'utilisateur pour identifier si la session est absente ou incomplète.

### Étape 2 — Insérer la session manquante
Si aucune session n'existe pour la dernière pratique, insérer manuellement un enregistrement complet dans `academy_practice_sessions` avec messages, évaluation et score, correspondant à la pratique que l'utilisateur a réalisée en dernier.

### Étape 3 — Corriger le debounce (robustesse)
Dans `useSimulatorSession.ts`, ajouter un `persistSession` immédiat (sans debounce) au premier message, pour garantir qu'au moins un enregistrement existe dès le début de la session. Le debounce ne s'applique qu'aux mises à jour suivantes.

### Étape 4 — Flush avant navigation
Dans `SimulatorEngine.tsx`, s'assurer que si `completeSession` n'est pas appelé (utilisateur ferme), un `persistSession` immédiat est déclenché via un `useEffect` cleanup ou un `beforeunload` listener.

## Fichiers impactés

| Fichier | Modification |
|---------|-------------|
| Base de données | INSERT session manquante |
| `src/hooks/useSimulatorSession.ts` | Persistence immédiate au 1er message + cleanup |
| `src/components/simulator/SimulatorEngine.tsx` | Flush on unmount |

## Ordre d'exécution

1. Diagnostic DB — identifier la session manquante
2. INSERT de la session avec données complètes
3. Fix useSimulatorSession — persistence immédiate + flush
4. Fix SimulatorEngine — cleanup on unmount

