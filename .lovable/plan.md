

## Corrections et améliorations du Challenge Canvas

### Problèmes identifiés

1. **Scroll cassé** : Le conteneur `flex-1 relative` dans `WorkshopRoom` n'a pas `overflow-auto` ni `min-h-0`, et les vues internes (`SubjectCanvas`, `ChallengeBoard`) utilisent `h-full` sans que la chaîne flex soit complète.

2. **Duplication de cartes** : `placeCard` dans `useChallengeData.ts` supprime toutes les réponses du même slot+user avant d'insérer, ce qui empêche les slots multi-cartes. Il ne devrait supprimer que pour les slots "single".

3. **Suppression cassée** : `removeCard` fonctionne par `id` mais le drag-reorder dans `DropSlot` propage l'événement drop au parent, ce qui re-déclenche `onDrop` et recrée la carte — le `stopPropagation` manque sur certains chemins.

4. **Reorder dans DropSlot** : Le reorder par drag natif HTML entre en conflit avec le drop principal du slot (les deux écoutent `onDrop`). Il faut distinguer clairement les deux types de drop via les dataTransfer types.

5. **Zone de tri** : Pas de classement possible, trop petite, pas de GameCards en mode board.

### Plan de corrections

#### 1. Fix scroll — `WorkshopRoom.tsx` + vues
- Ajouter `overflow-hidden min-h-0` sur le conteneur `flex-1 relative` (ligne 362)
- Les vues `SubjectCanvas` et `ChallengeBoard` gardent `overflow-auto` sur leur zone de contenu

#### 2. Fix placeCard — `useChallengeData.ts`
- Passer `slotType` en paramètre de `placeCard`
- Ne supprimer les réponses existantes QUE si `slotType === 'single'`
- Pour multi/ranked : insérer directement avec `rank = max(existingRanks) + 1`

#### 3. Fix suppression et reorder — `DropSlot.tsx`
- Dans `handleDrop` : vérifier si `e.dataTransfer` contient `reorder-idx` → si oui, traiter comme reorder et `stopPropagation` ; sinon traiter comme nouveau drop de carte
- Fusionner la logique drop/reorder dans un seul handler sur le conteneur pour éviter les conflits
- Le `SlotCard` ne doit plus avoir son propre `onDrop` — le reorder est géré au niveau du slot par la position de drop

#### 4. Staging Zone améliorée — `StagingZone.tsx`
- Déplacer en **bas** des deux vues (après les slots/zones, pas avant)
- Agrandir : `min-h-[160px]` au lieu de `80px`
- Afficher les `GameCard` en mode board (passer un prop `viewMode`)
- Ajouter tri automatique par pilier (grouper les cartes par pillar_id)
- Permettre le drag-reorder entre cartes dans la zone de tri

#### 5. Staging en bas — `SubjectCanvas.tsx` + `ChallengeBoard.tsx`
- Déplacer le bloc `<StagingZone>` après la grille de slots au lieu d'avant
- Passer `viewMode` pour adapter le rendu (compact en liste, GameCards en board)

### Fichiers impactés

| Fichier | Changement |
|---|---|
| `src/pages/WorkshopRoom.tsx` | `overflow-hidden min-h-0` sur conteneur |
| `src/hooks/useChallengeData.ts` | Fix `placeCard` pour multi-cartes, passer slot_type |
| `src/components/challenge/DropSlot.tsx` | Fusionner drop/reorder, fix suppression, stopPropagation |
| `src/components/challenge/StagingZone.tsx` | Plus grande, tri par pilier, support GameCard, reorder |
| `src/components/challenge/SubjectCanvas.tsx` | Staging en bas |
| `src/components/challenge/ChallengeBoard.tsx` | Staging en bas avec GameCards |
| `src/components/challenge/ChallengeView.tsx` | Passer viewMode au staging |

