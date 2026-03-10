

## Diagnostic des bugs de fleches et points d'ancrage

### Cause racine

Le probleme vient de **dimensions hardcodees incorrectes** dans `getAnchorCoords()` et dans le placement des anchor handles :

1. **`getAnchorCoords`** utilise des dimensions par defaut (240x120 pour les cartes) qui ne correspondent PAS aux dimensions reelles. Les cartes font 220px, 280px, 420px ou 240px selon le `displayMode`, et leur hauteur est dynamique (souvent 300-400px). Resultat : les coordonnees des fleches sont completement decalees.

2. **Les anchor handles** dans `WorkshopCanvas.tsx` (ligne 493-494) utilisent les memes mauvaises dimensions hardcodees. Les points ne sont donc pas centres sur les bords reels des elements.

3. **Les cartes ne stockent pas `width`/`height`** en base — `item.width` est `null`. Il faut calculer la largeur a partir du `display_mode` du contenu.

### Solution

Creer une fonction utilitaire `getItemDimensions(item, cards?)` qui calcule les vraies dimensions de chaque type d'element, et l'utiliser partout :

#### Nouvelle fonction `getItemDimensions`
```typescript
function getItemDimensions(item: CanvasItem): { w: number; h: number } {
  if (item.width && item.height) return { w: item.width, h: item.height };
  switch (item.type) {
    case "card": {
      const mode = item.content?.display_mode || "preview";
      const w = mode === "section" ? 220 : mode === "full" ? 420 : mode === "gamified" ? 240 : 280;
      const h = mode === "section" ? 90 : mode === "gamified" ? 320 : mode === "full" ? 450 : 280;
      return { w, h };
    }
    case "sticky": {
      const size = item.content?.sticky_size || "medium";
      const sizes = { small: { w: 120, h: 80 }, medium: { w: 180, h: 140 }, large: { w: 260, h: 200 } };
      return sizes[size] || sizes.medium;
    }
    case "icon": return { w: 48, h: 48 };
    case "text": return { w: 200, h: 40 };
    case "group": return { w: item.width || 400, h: item.height || 300 };
    default: return { w: 240, h: 120 };
  }
}
```

#### Fichiers modifies

| Fichier | Modification |
|---|---|
| `AnchorHandles.tsx` | Remplacer `getAnchorCoords` pour utiliser `getItemDimensions` au lieu des dimensions hardcodees |
| `WorkshopCanvas.tsx` | Utiliser `getItemDimensions` pour les anchor handles overlay (lignes 493-494) au lieu des mauvais fallbacks |

Cela garantit que les points d'ancrage et les coordonnees des fleches utilisent exactement les memes dimensions que les composants visuels.

