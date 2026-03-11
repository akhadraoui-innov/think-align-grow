

## Diagnostic — Duplication de cartes et bouton suppression dans la Zone de tri

### Cause racine

**Duplication** : `stageCard()` dans `useChallengeStaging.ts` fait un `insert` sans verifier si la carte existe deja en staging. Le guard `handleAddFromSidebar` dans `ChallengeView` verifie `stagedCardIds`, mais il y a une race condition : entre le clic et la mise a jour realtime, plusieurs inserts passent. De plus, il n'y a **aucune contrainte d'unicite** sur la table `challenge_staging` pour `(workshop_id, subject_id, card_id, user_id)`.

**Bouton suppression** : Le `GameCard` en mode board a un `onClick={handleCardClick}` (flip) sur le `motion.div` parent. Le `handleRemoveClick` fait `e.stopPropagation()`, mais l'animation de flip interfere — le clic sur X declenche aussi le flip qui change l'etat, et la carte re-render avant que le delete ne s'execute. De plus, `unstageCard` supprime en DB mais ne fait pas de mise a jour optimiste du state local.

### Corrections

**1. Migration DB** : Ajouter une contrainte UNIQUE sur `challenge_staging(workshop_id, subject_id, card_id, user_id)` pour empecher les doublons au niveau DB.

**2. `useChallengeStaging.ts`** :
- `stageCard` : Verifier localement si `card_id` est deja dans les items avant d'inserer. Utiliser `upsert` au lieu de `insert` pour gerer les race conditions.
- `unstageCard` : Ajouter une suppression optimiste du state local (comme `removeCard` dans `useChallengeData`), avec rollback en cas d'erreur.

**3. `StagingZone.tsx`** :
- Sur le bouton X du `GameCard` (mode board) : s'assurer que `onRemove` est appele sans que le flip ne s'active. Ajouter `onPointerDown={e => e.stopPropagation()}` sur le wrapper du GameCard pour empecher le drag d'interferer avec le clic de suppression.

**4. `ChallengeView.tsx`** :
- Renforcer `handleAddFromSidebar` : filtrer aussi par `subject_id` courant dans `stagedCardIds`.

### Fichiers modifies

| Fichier | Action |
|---------|--------|
| Migration SQL | `UNIQUE(workshop_id, subject_id, card_id, user_id)` sur `challenge_staging` |
| `src/hooks/useChallengeStaging.ts` | Dedup local + optimistic delete + upsert |
| `src/components/challenge/StagingZone.tsx` | Fix propagation evenement suppression en mode board |
| `src/components/challenge/ChallengeView.tsx` | Renforcer guard anti-doublon par subject |

