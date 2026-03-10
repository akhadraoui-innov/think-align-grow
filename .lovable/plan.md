

## Diagnostic : pourquoi le scroll ne fonctionne jamais

Le problème n'est pas dans `ChallengeBoard` ou `SubjectCanvas`. Il est **un niveau au-dessus**, dans `WorkshopRoom.tsx`.

### Cause racine

Ligne 362 de `WorkshopRoom.tsx` :
```tsx
<div className="flex-1 relative overflow-hidden min-h-0">
  <ChallengeView ... />
</div>
```

Ce `div` est un flex-item (son parent est `flex`), donc `flex-1` lui donne bien une hauteur. **MAIS il n'est pas lui-même un flex container** (`display: flex` manque). Or `ChallengeView` utilise `flex-1` pour prendre la hauteur — ce qui ne fonctionne que si le parent est `display: flex`.

Résultat : `ChallengeView` prend sa hauteur naturelle (infinie), puis `overflow-hidden` sur le parent **coupe** le contenu. Le `overflow-y-auto` à l'intérieur ne se déclenche jamais car aucun ancêtre ne contraint la hauteur.

```text
WorkshopRoom
  └─ div.flex-1.flex.min-h-0           ← flex container ✓
       └─ div.flex-1.overflow-hidden    ← PAS flex container ✗  ← ICI
            └─ ChallengeView (flex-1)   ← flex-1 ignoré car parent pas flex
                 └─ overflow-y-auto     ← jamais contraint
```

### Correction

**Un seul changement** — ajouter `flex flex-col` au div conteneur dans `WorkshopRoom.tsx` ligne 362 :

```tsx
<div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
```

Cela rétablit la chaîne flex complète et permet à `ChallengeView` → `ChallengeBoard` → `overflow-y-auto` de fonctionner correctement.

### Fichier impacté

| Fichier | Modification |
|---|---|
| `WorkshopRoom.tsx` ligne 362 | Ajouter `flex flex-col` à la className |

