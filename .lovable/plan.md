

## Diagnostic des problemes

### 1. Boutons inoperants (cartes et post-its) — BUG CRITIQUE

**Cause racine** : `handleItemDragStart` dans `WorkshopCanvas.tsx` appelle `containerRef.current?.setPointerCapture(e.pointerId)` immediatement au `pointerdown`. Cela capture TOUS les events pointer vers le container, ce qui empêche les `click` sur les boutons enfants (supprimer, changer format, ouvrir fiche, couleurs, forme) de se declencher.

**Fix** : Ne pas capturer le pointer immediatement. Utiliser un seuil de mouvement (5px) avant de capturer — tant que l'utilisateur n'a pas bouge, c'est un clic, pas un drag.

```text
pointerdown → enregistrer position de depart, NE PAS capturer
pointermove → si distance > 5px → setPointerCapture + demarrer drag
pointerup sans mouvement → c'est un clic normal, les boutons fonctionnent
```

### 2. Post-it rond qui redevient carre — BUG

**Cause** : Le composant `StickyNote` a `overflow-hidden` sur le conteneur. La toolbar (couleurs, forme, taille, supprimer) est positionnee a `absolute -top-10` — elle est donc clippee et invisible. L'utilisateur ne voit jamais les boutons.

De plus, quand le textarea s'ouvre en mode edition, le contenu peut deborder du cercle fixe.

**Fix** : Retirer `overflow-hidden` du conteneur du sticky. La toolbar et le contenu deviennent visibles.

### 3. Performance trackpad/zoom lente

**Cause** : Chaque event `wheel` et `pointermove` appelle `onViewportChange` → `setViewport` → re-render de TOUS les items du canvas. Avec framer-motion sur chaque element, c'est lourd.

**Fix** :
- Utiliser `requestAnimationFrame` pour throttler les mises a jour du viewport pendant le pan/zoom
- Stocker le viewport dans un `useRef` et ne mettre a jour le state qu'en fin de geste (ou toutes les 16ms via rAF)

---

### Plan d'implementation

| Fichier | Modification |
|---|---|
| `WorkshopCanvas.tsx` | Remplacer la capture pointer immediate par un seuil de drag (5px). Ajouter rAF throttle pour pan/zoom viewport |
| `StickyNote.tsx` | Retirer `overflow-hidden` du conteneur principal |

### Detail technique

**WorkshopCanvas.tsx — Drag threshold** :
- Nouveau ref `dragIntent = useRef({ id, startX, startY, captured: false })`
- `handleItemDragStart` : stocker l'intention sans capturer
- `handlePointerMove` : si `dragIntent` existe et distance > 5px → `setPointerCapture` + demarrer le vrai drag
- `handlePointerUp` : si pas de drag effectif → ne rien faire (le clic natif passe aux boutons enfants)

**WorkshopCanvas.tsx — rAF throttle** :
- `viewportRef = useRef(viewport)` synchronise avec le state
- `handleWheel` et `handlePointerMove` (pan) ecrivent dans `viewportRef` et programment un seul `rAF` pour `setViewport`
- Resultat : max 60 updates/sec au lieu d'un re-render par event

**StickyNote.tsx** :
- Retirer `overflow-hidden` de la classe du conteneur `motion.div`

