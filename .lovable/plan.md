

## Audit Front-End du Workshop Canvas

Apres analyse complete de toutes les couches (WorkshopCanvas, WorkshopToolbar, CanvasCard, StickyNote, CanvasGroup, CanvasIcon, CanvasText, DiscussionPanel, CanvasStats, WorkshopRoom), voici les problemes identifies et le plan de correction.

---

### Bugs critiques

**1. Indicateur fleche duplique et casse**
- `WorkshopCanvas.tsx` ligne 321 : un `<div className="fixed ...">` est rendu DANS le conteneur transforme (`translate + scale`). CSS `fixed` ne fonctionne pas dans un parent avec `transform` → l'indicateur est mal positionne ou invisible.
- Le meme indicateur existe deja dans `WorkshopRoom.tsx` ligne 396. Le doublon dans WorkshopCanvas doit etre supprime.

**2. Perte de capture pointer sur les elements enfants**
- `handleItemDragStart` fait `(e.target as HTMLElement).setPointerCapture(e.pointerId)` — si l'utilisateur clique sur un element enfant (texte, icone, badge), la capture est mise sur cet enfant et non sur le conteneur. Quand le pointer bouge hors de ce petit element, le drag cesse brusquement.
- Fix : capturer sur `containerRef.current` au lieu de `e.target`.

**3. Resize des groupes perd les events**
- Le resize handler dans `CanvasGroup` ecoute `onPointerMove/Up` sur le handle lui-meme (div 24x24px). Si le curseur sort de ce petit element pendant le resize, les events sont perdus.
- Fix : le resize doit aussi utiliser `setPointerCapture` sur le handle pour garantir le tracking.

**4. Margin-top hardcodee pour le canvas**
- `WorkshopRoom.tsx` ligne 322 : `mt-[60px]` ou `mt-[92px]` selon le statut. Tout changement de hauteur de toolbar ou banniere casse le layout.
- Fix : utiliser un layout flex naturel sans margin-top fixe (la toolbar doit etre dans le flux flex, pas absolute).

---

### Ameliorations UX majeures

**5. Zoom au scroll (sans Ctrl)**
- Actuellement le scroll sans Ctrl ne fait rien. Sur un canvas infini, le scroll devrait panner le canvas (standard Figma/Miro).
- Ajouter : scroll = pan, Ctrl+scroll = zoom.

**6. Pinch-to-zoom / Touch**
- Aucun support tactile pour le zoom ou le pan a deux doigts. Sur tablette/mobile le canvas est inutilisable.
- Ajouter la gestion des `touchstart/touchmove` pour pinch-zoom et pan 2 doigts.

**7. Raccourcis clavier**
- Pas de `Delete`/`Backspace` pour supprimer l'element selectionne
- Pas de `Escape` pour deselectionner
- Ajouter ces raccourcis dans WorkshopCanvas via `useEffect` + `keydown`.

**8. Snap-to-grid optionnel**
- Ajouter un snap magnetique lors du drag (arrondir x/y au multiple de 20px le plus proche quand actif).
- Toggle dans la toolbar.

**9. Fit-to-content / Reset view**
- Le bouton "%" reset a `{x:0, y:0, scale:1}` ce qui ne correspond pas forcement au contenu.
- Ajouter un bouton "Fit" qui calcule le bounding box de tous les items et ajuste viewport pour tout afficher.

---

### Corrections mineures

**10. SVG arrows container trop grand**
- `width: 10000px, height: 10000px` est excessif. Utiliser `width: 0, height: 0` avec `overflow: visible` suffit.

**11. Performance du drag**
- Le debounce DB est a 300ms mais le state local est mis a jour a chaque pointermove. C'est correct, mais `onUpdatePosition` dans `useCanvasItems` declenche un re-render de la liste entiere. Pas critique pour < 100 items.

---

### Plan d'implementation

| Fichier | Modifications |
|---|---|
| `WorkshopCanvas.tsx` | Supprimer indicateur fleche duplique, fix pointer capture sur containerRef, ajouter scroll=pan, pinch-zoom, keydown (Delete/Escape), snap-to-grid, fit-to-content |
| `WorkshopRoom.tsx` | Retirer mt-[60px]/mt-[92px], rendre toolbar dans le flux flex (retirer position absolute), ajouter snap toggle dans toolbar state |
| `WorkshopToolbar.tsx` | Retirer `absolute top-0`, rendre en flux flex, ajouter bouton Fit + toggle Snap |
| `CanvasGroup.tsx` | Fix resize avec setPointerCapture sur le handle |
| `CanvasArrow.tsx` | SVG container : passer a width/height 0 |

Environ 7 fichiers touches, principalement WorkshopCanvas et WorkshopRoom.

