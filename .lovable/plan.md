

## Diagnostic : pourquoi ça échoue depuis 5 tentatives

### Cause racine 1 — Le scroll est cassé par AnimatePresence

Le problème fondamental que toutes les tentatives ont manqué :

```text
ChallengeView (flex-1 flex flex-col min-h-0)
  └─ <AnimatePresence mode="wait">        ← PAS de flex-1, PAS de min-h-0
       └─ <ChallengeBoard>               ← flex-1 ne sert à RIEN
            └─ overflow-y-auto            ← jamais contraint en hauteur
```

`AnimatePresence` de framer-motion **ne transmet pas les propriétés flex** à ses enfants. Il crée un conteneur intermédiaire invisible. Résultat : `flex-1` sur `ChallengeBoard`/`SubjectCanvas` ne s'applique jamais car leur parent n'est pas un flex container avec hauteur contrainte. Le contenu prend sa hauteur naturelle (infinie) et `overflow-y-auto` ne déclenche jamais de scroll.

**Fix** : Envelopper le contenu de `AnimatePresence` dans un `div` avec `className="flex-1 flex flex-col min-h-0 overflow-hidden"`.

### Cause racine 2 — Les données de drag sont contradictoires

Dans `BoardZone`, chaque carte envoie **3 types** de données drag simultanément (lignes 156-160) :
- `card-id` → traité comme "nouvelle carte depuis la sidebar"
- `source-response-id` → traité comme "déplacement entre slots"
- `reorder-response-id` → traité comme "réordonnancement interne"

Quand on dépose une carte sur le fond de la zone (pas sur une autre carte), le handler du slot (`handleDrop` ligne 43) voit `reorder-response-id` et fait `return` (ligne 51). MAIS il voit aussi `source-response-id`, ce qui déclenche `onMoveToSlot` → la carte est supprimée puis recréée au même endroit = duplication apparente ou perte.

**Fix** : Séparer strictement les types de drag. Un drag interne au slot ne doit définir QUE `reorder-response-id`. Un drag entre slots ne doit définir QUE `card-id` + `source-response-id`.

### Cause racine 3 — Le reorder dans DropSlot (vue Liste) utilise un type différent

`DropSlot` utilise `reorder-id` (lignes 167, 171, 179) tandis que `BoardZone` utilise `reorder-response-id`. Incohérence qui empêche de détecter correctement le type de drag.

### Plan de correction définitif

#### 1. Fix scroll — `ChallengeView.tsx` (lignes 196-205)

Remplacer le `AnimatePresence` nu par un wrapper flex :

```tsx
<div className="flex-1 flex flex-col min-h-0 overflow-hidden">
  <AnimatePresence mode="wait">
    {currentSubject && (
      viewMode === "list" ? (
        <SubjectCanvas key={...} {...canvasProps} />
      ) : (
        <ChallengeBoard key={...} {...canvasProps} />
      )
    )}
  </AnimatePresence>
</div>
```

Et dans `ChallengeBoard`/`SubjectCanvas`, le `motion.div` racine doit utiliser `className="flex flex-col h-full"` (pas `flex-1` car le parent fixe déjà la taille).

#### 2. Fix drag — `BoardZone.tsx`

**onDragStart** des cartes placées dans un slot :
- Définir UNIQUEMENT `reorder-response-id` (PAS `card-id` ni `source-response-id`)
- Ajouter un second handler pour le drag **hors du slot** : on gère ça dans `handleDrop` du slot parent en vérifiant si le drag vient du même slot ou d'un autre

Concrètement :
- `onDragStart` met `reorder-response-id` = resp.id ET `card-id` = card.id ET `source-slot-id` = slot.id
- `handleDrop` vérifie : si `source-slot-id === slot.id` → c'est un reorder, sinon c'est un move

#### 3. Fix reorder — `DropSlot.tsx`

Même logique : utiliser `source-slot-id` pour distinguer reorder vs move, au lieu de types différents (`reorder-id` vs `card-id`).

#### 4. Fix suppression — `GameCard.tsx`

La suppression fonctionne déjà dans le code (le `handleRemoveClick` fait `stopPropagation`), mais le `draggable` sur le div parent intercepte le mousedown. Ajouter `onPointerDown={(e) => e.stopPropagation()}` sur le bouton X.

### Fichiers impactés

| Fichier | Modification |
|---|---|
| `ChallengeView.tsx` | Wrapper flex autour de AnimatePresence |
| `ChallengeBoard.tsx` | `h-full` au lieu de `flex-1` sur motion.div racine |
| `SubjectCanvas.tsx` | Idem |
| `BoardZone.tsx` | Refonte complète du système de drag : `source-slot-id` pour distinguer reorder vs move |
| `DropSlot.tsx` | Même refonte drag avec `source-slot-id` |
| `GameCard.tsx` | `onPointerDown` stopPropagation sur le bouton X |

