

## Diagnostic — Regression couleurs et formats dans Workshop

### Cause racine identifiée

La colonne `pillar.color` en base contient des **valeurs hexadécimales** (`#8B5CF6`, `#F59E0B`, `#E8552D`, etc.), mais la fonction `getPillarGradient()` retourne ces valeurs telles quelles. Ensuite, tous les composants construisent des variables CSS comme :

```text
hsl(var(--pillar-#8B5CF6))   ← CSS invalide, aucune couleur rendue
```

Les variables CSS définies dans `index.css` sont nommées `--pillar-thinking`, `--pillar-business`, etc. — jamais avec des codes hex.

**Résultat** : toutes les cartes du Workshop (et CardSidebar, CardContextSheet) perdent leurs couleurs de pilier.

### Composants affectés

| Composant | Utilise `getPillarGradient` | Cassé |
|-----------|---------------------------|-------|
| `CanvasCard.tsx` | Oui — `hsl(var(--pillar-${gradient}))` | Oui |
| `CardSidebar.tsx` | Oui — idem | Oui |
| `CardContextSheet.tsx` | Oui — idem | Oui |
| `GameCard.tsx` (Challenge) | Oui — idem | Oui |
| `FlipCard.tsx` (Explore) | Oui — idem | Oui |
| `GradientIcon.tsx` | Oui — Tailwind `from-pillar-${gradient}` | Oui |

### Correction proposée

**1. Refactorer `useToolkitData.ts`** — Modifier `getPillarGradient()` pour **ignorer les couleurs hex** et ne retourner que des tokens CSS valides. Ajouter une nouvelle fonction `getPillarHexColor()` qui retourne la couleur hex de la DB ou un fallback.

```typescript
// getPillarGradient : retourne TOUJOURS un token CSS (jamais un hex)
export function getPillarGradient(slug: string, dbColor?: string | null): string {
  // Si dbColor est un token CSS valide (pas un hex), l'utiliser
  if (dbColor && !dbColor.startsWith('#')) return dbColor;
  return PILLAR_GRADIENT_FALLBACK[slug] || "primary";
}

// Nouvelle : retourne la couleur utilisable directement (hex ou hsl var)
export function getPillarCssColor(slug: string, dbColor?: string | null): string {
  if (dbColor?.startsWith('#')) return dbColor;
  const token = PILLAR_GRADIENT_FALLBACK[slug] || "primary";
  return `hsl(var(--pillar-${token}))`;
}
```

**2. Mettre à jour les composants** qui construisent manuellement `hsl(var(--pillar-${gradient}))` pour utiliser `getPillarCssColor()` à la place, tout en gardant `getPillarGradient()` pour les classes Tailwind de `GradientIcon`.

Composants à modifier :
- `CanvasCard.tsx` : remplacer `pillarColor` par `getPillarCssColor()`
- `CardSidebar.tsx` : idem
- `CardContextSheet.tsx` : idem  
- `GameCard.tsx` : idem
- `FlipCard.tsx` : idem

**3. Pas de regression de format** à proprement parler — les 4 modes (section, preview, full, gamified) sont toujours implémentés dans `CanvasCard.tsx` et `getItemDimensions`. La régression visuelle des formats est une conséquence directe de l'absence de couleurs (les modes section et gamified utilisent la couleur comme fond, donc sans couleur ils apparaissent transparents/blancs).

### Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `src/hooks/useToolkitData.ts` | Fix `getPillarGradient` + ajouter `getPillarCssColor` |
| `src/components/workshop/CanvasCard.tsx` | Utiliser `getPillarCssColor` |
| `src/components/workshop/CardSidebar.tsx` | Idem |
| `src/components/workshop/CardContextSheet.tsx` | Idem |
| `src/components/challenge/GameCard.tsx` | Idem |
| `src/components/ui/FlipCard.tsx` | Idem |

