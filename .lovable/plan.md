

## Plan : Scrollbar native discrète

Oui, les modifications précédentes (ScrollArea de Radix) seront supprimées et remplacées.

### Changements

**`ChallengeBoard.tsx`** — Remplacer `<ScrollArea className="flex-1">` par `<div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">`, supprimer l'import `ScrollArea`.

**`SubjectCanvas.tsx`** — Même remplacement exact.

**`src/index.css`** — Ajouter dans `@layer utilities` les styles de scrollbar personnalisée :
- Largeur 6px, track transparent, thumb arrondi couleur `--border`, hover légèrement plus visible
- Support Firefox via `scrollbar-width: thin`

Aucun autre fichier n'est touché. Le stepper horizontal en haut reste inchangé.

