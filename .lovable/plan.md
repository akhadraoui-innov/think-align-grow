

## Diagnostic rigoureux — 3 bugs identifies

### Bug 1 : Cartes section/gamifie GRISES — Cause racine trouvee

Dans `CanvasCard.tsx` ligne 96 et 180 :
```
background: `linear-gradient(145deg, ${pillarColor}, ${pillarColor}dd)`
```
`pillarColor` = `hsl(var(--pillar-thinking))`. Donc le second stop devient `hsl(var(--pillar-thinking))dd` — **CSS totalement invalide**. Le navigateur ignore tout le `background`, resultat : fond transparent/gris.

De plus, le fallback dans `getPillarGradient` renvoie `"primary"` → `hsl(var(--pillar-primary))` qui **n'existe pas** dans le CSS (la variable s'appelle `--primary`, pas `--pillar-primary`).

**Fix** :
- `CanvasCard.tsx` : remplacer `${pillarColor}dd` par la syntaxe correcte `hsl(var(--pillar-xxx) / 0.87)` pour l'alpha
- `useToolkitData.ts` : changer le fallback de `"primary"` a une couleur valide, ou creer `--pillar-primary` dans le CSS
- Utiliser une variable intermediaire pour la couleur brute (sans `hsl()`) pour construire les gradients correctement

Approche : stocker la valeur brute du CSS var et construire les couleurs ainsi :
```typescript
const gradientName = pillar ? getPillarGradient(pillar.slug) : "primary";
const colorVar = `var(--pillar-${gradientName})`;
// Usage dans style:
background: `linear-gradient(145deg, hsl(${colorVar}), hsl(${colorVar} / 0.85))`
```

### Bug 2 : Fleches invisibles

Le SVG dans `WorkshopCanvas.tsx` ligne 337 :
```html
<svg style={{ width: 0, height: 0, overflow: "visible" }}>
```
Un SVG avec `width: 0, height: 0` ne cree pas de viewport de rendu. Certains navigateurs ignorent `overflow: visible` quand les dimensions sont nulles. Les paths sont generes mais pas rendus.

**Fix** : Donner au SVG des dimensions qui couvrent tout le canvas, ou utiliser `width: "100%", height: "100%"` avec position absolute. Alternativement, utiliser un SVG avec des dimensions tres grandes (10000x10000) et `overflow: visible`.

### Bug 3 : Post-it rond → carre a l'edition

Dans `StickyNote.tsx`, le conteneur a un `height` fixe en mode rond (ligne 85). Mais quand le textarea s'affiche, le `min-h-[60px]` / `min-h-[40px]` ne respecte pas le cercle. Le vrai probleme : la textarea a `resize-none` mais le contenu peut deborder, et le container `div` n'a pas `overflow-hidden` (retire dans un fix precedent). Le `height` est fixe en inline style, mais la classe `rounded-full` reste. Le probleme est que la textarea/texte n'est pas contraint dans le cercle.

Apres investigation plus poussee : le conteneur utilise `height: dimension` pour le rond, mais `minHeight` pour le carre. Quand le contenu (textarea) pousse au-dela de `dimension`, le container grandit et perd sa forme circulaire car `rounded-full` ne fonctionne visuellement que sur un carre parfait.

**Fix** : Ajouter `overflow-hidden` uniquement sur le contenu interieur du post-it rond (pas sur le parent, pour que la toolbar reste visible). Forcer `maxHeight: dimension` sur le conteneur interieur en mode rond.

---

### Plan d'implementation

| Fichier | Modification |
|---|---|
| `CanvasCard.tsx` | Refactorer `pillarColor` pour separer la variable CSS brute de la construction `hsl()`. Corriger tous les gradients avec la syntaxe `hsl(var / alpha)` |
| `useToolkitData.ts` | Ajouter `--pillar-primary` au fallback ou mapper vers une variable existante |
| `index.css` | Ajouter `--pillar-primary: 22 95% 52%` pour le fallback |
| `WorkshopCanvas.tsx` | Changer le SVG des fleches : supprimer `width:0, height:0`, utiliser `position: absolute, inset: 0` avec des dimensions qui couvrent le canvas |
| `StickyNote.tsx` | Ajouter `overflow-hidden` et `maxHeight` sur le conteneur de contenu (pas le parent) en mode rond |

