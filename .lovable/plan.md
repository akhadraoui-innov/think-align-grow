

## Plan : Ajouter une barre de navigation verticale (haut/bas) dans la zone de contenu

### Problème
Le scroll vertical ne fonctionne pas dans la zone des blocs (Board/List). L'utilisateur ne peut pas atteindre les blocs du bas.

### Solution
Ajouter une barre flottante avec des boutons haut/bas sur le côté droit de la zone de contenu. Ces boutons scrollent programmatiquement le conteneur via `scrollBy()` avec un `ref`.

### Modifications

**`ChallengeBoard.tsx`** et **`SubjectCanvas.tsx`** :
- Ajouter un `useRef` sur le `div` scrollable (`overflow-y-auto`)
- Ajouter deux boutons flottants (ChevronUp / ChevronDown) positionnés en `absolute` à droite du conteneur
- Les boutons appellent `ref.current.scrollBy({ top: ±300, behavior: 'smooth' })`
- Masquer le bouton haut quand on est en haut, le bouton bas quand on est en bas (via `onScroll` listener)
- Style : petits boutons ronds semi-transparents, `fixed` dans le coin bas-droit de la zone

### Structure visuelle
```text
┌─────────────────────────────────┐
│  Subject header                 │
├─────────────────────────────────┤
│                            [▲]  │  ← boutons flottants
│  Grid de BoardZones             │     positionnés absolute
│  ...                            │     dans le conteneur scroll
│                            [▼]  │
└─────────────────────────────────┘
```

### Fichiers impactés
| Fichier | Modification |
|---|---|
| `ChallengeBoard.tsx` | Ref + boutons flottants haut/bas |
| `SubjectCanvas.tsx` | Idem |

