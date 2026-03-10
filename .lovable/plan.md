

## Corrections finales — 3 bugs

### Bug 1 : Fleches invisibles — Cause racine trouvee

Le SVG est positionne a `left: -5000px, top: -5000px`. Les coordonnees des fleches sont en espace canvas (ex: x=300, y=400). Mais dans le SVG, le point (300, 400) correspond a la position canvas (-5000+300, -5000+400) = (-4700, -4600) — completement hors ecran.

**Fix** : Replacer le SVG a `left: 0, top: 0` avec `width: 1px, height: 1px, overflow: visible`. Les coordonnees canvas seront alors correctement alignees.

### Bug 2 : Post-it rond → carre apres edition

Le conteneur exterieur a `height: dimension` et `rounded-full`, mais PAS `overflow-hidden` (car la toolbar est a l'interieur du meme div, en `absolute -top-10`). Quand le contenu (textarea) depasse visuellement, le navigateur peut ne pas clipper correctement.

**Fix** : Restructurer le composant avec un wrapper englobant (position relative, pas d'overflow) qui contient :
1. Le cercle (div avec `rounded-full overflow-hidden` et dimensions fixes)
2. La toolbar (en dehors du cercle, positionnee en absolu par rapport au wrapper)

### Bug 3 : Pas de feedback visuel pendant le deplacement

Le drag met `opacity-90` — quasiment invisible comme difference. Il faut un retour visuel fort.

**Fix** : Ajouter pendant le drag sur les cartes, post-its et groupes :
- `scale(1.03)` + ombre portee renforcee
- `opacity: 0.85` plus visible
- `z-index` tres eleve pour que l'element soit toujours au-dessus
- Transition CSS sur transform pour un effet fluide

### Plan d'implementation

| Fichier | Modification |
|---|---|
| `WorkshopCanvas.tsx` | SVG arrows : `left: 0, top: 0, width: 1, height: 1, overflow: visible` |
| `StickyNote.tsx` | Restructurer avec wrapper parent + cercle overflow-hidden + toolbar separee |
| `CanvasCard.tsx` | Renforcer les styles `isDragging` (scale, shadow, opacity) |

