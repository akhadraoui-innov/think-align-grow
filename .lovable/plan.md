

## Corrections finales — 3 bugs + 1 feature

### Bug 1 : Post-it rond → carré après édition — CAUSE RACINE

Dans `useCanvasItems.ts` ligne 150-158, `updateContent` a un **bug de race condition** :

```typescript
let mergedContent = content;  // = { text: "hello" }
setItems(prev => prev.map(item => {
  if (item.id === itemId) {
    mergedContent = { ...item.content, ...content }; // merge avec sticky_shape
    return { ...item, content: mergedContent };
  }
  return item;
}));
// React 18 auto-batching : le callback ci-dessus peut NE PAS avoir exécuté ici
await supabase.update({ content: mergedContent }); // envoie { text: "hello" } SANS sticky_shape !
```

Le `mergedContent` est assigné dans le callback de `setItems`, mais React 18 peut batcher cet update. Résultat : la DB reçoit `{ text: "hello" }` sans `sticky_shape: "round"`, le realtime renvoie cette donnée, et le post-it redevient carré (default = `"square"`).

**Fix** : Utiliser un `itemsRef` pour lire les items de façon synchrone, calculer le merge AVANT `setItems`, puis envoyer le résultat correct à la DB.

#### `useCanvasItems.ts`
- Ajouter `const itemsRef = useRef(items)` + sync via `useEffect`
- Refactorer `updateContent` :
```typescript
const updateContent = useCallback(async (itemId, content) => {
  const current = itemsRef.current.find(i => i.id === itemId);
  const merged = current ? { ...current.content, ...content } : content;
  setItems(prev => prev.map(item => 
    item.id === itemId ? { ...item, content: merged } : item
  ));
  await supabase.from("workshop_canvas_items").update({ content: merged }).eq("id", itemId);
}, []);
```

---

### Bug 2 : Couleurs des post-its trop pastel

L'utilisateur veut des couleurs primaires/vives. Passer de `*-200` à `*-400`.

#### `StickyNote.tsx`
```text
yellow-200 → yellow-300    pink-200 → pink-300
green-200 → green-300      blue-200 → blue-300
purple-200 → purple-300    orange-200 → orange-300
```

Les couleurs de texte `*-900` restent inchangées pour le contraste.

---

### Bug 3 : Flèches invisibles

Le SVG utilise `style={{ width: "1px", height: "1px", overflow: "visible" }}`. Le CSS `overflow: visible` n'est pas garanti sur SVG. Il faut utiliser l'**attribut SVG** `overflow="visible"` directement.

#### `WorkshopCanvas.tsx`
```html
<svg 
  overflow="visible"           ← attribut SVG natif
  style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
  width="0" height="0"         ← attributs SVG, pas CSS
>
```

---

### Feature : Points d'ancrage des flèches (style PowerPoint)

Permettre de choisir d'où part et arrive la flèche sur chaque élément.

#### Concept
4 points d'ancrage par élément : `top`, `right`, `bottom`, `left`. Quand le mode flèche est actif, les 4 points apparaissent au survol/clic de chaque élément. L'utilisateur clique un point sur la source, puis un point sur la cible.

#### `CanvasArrow.tsx`
- Ajouter les props `fromAnchor` et `toAnchor` (optionnels, défaut calculé automatiquement)

#### `WorkshopCanvas.tsx`
- Fonction `getAnchorPosition(item, anchor)` qui calcule les coordonnées pixel :
  - `top` → `(x + w/2, y)`
  - `right` → `(x + w, y + h/2)`
  - `bottom` → `(x + w/2, y + h)`
  - `left` → `(x, y + h/2)`
- Remplacer les calculs hardcodés `fromItem.x + width/2, fromItem.y + 60` par `getAnchorPosition`
- Afficher les anchor handles (petits cercles) sur les items quand `mode === "arrow"`
- Stocker `from_anchor` et `to_anchor` dans `arrow.content`

#### `ArrowToolbar.tsx`
- Ajouter des boutons pour changer `from_anchor` / `to_anchor` après création

#### Nouveau composant : `AnchorHandles.tsx`
- 4 petits cercles positionnés sur les bords de l'élément
- Visibles uniquement en mode flèche
- Au clic, déclenchent `onArrowClick` avec l'info d'ancrage

---

### Plan d'implémentation

| Fichier | Modification |
|---|---|
| `useCanvasItems.ts` | Ajouter `itemsRef`, corriger `updateContent` pour merge synchrone |
| `StickyNote.tsx` | Couleurs `*-200` → `*-300` |
| `WorkshopCanvas.tsx` | SVG `overflow="visible"` attribut natif + `getAnchorPosition` + anchor handles en mode flèche |
| `CanvasArrow.tsx` | Props `fromAnchor`/`toAnchor` |
| `ArrowToolbar.tsx` | Boutons changement d'ancrage |

