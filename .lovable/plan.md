

## Renommer "light" en "section" et clarifier les modes

### Constat

Le mode "light" actuel (carte compacte coloree avec fond pilier) est un format que tu aimes. Il ressemble visuellement au mode "gamifie" (tous deux ont un fond colore). Il faut les differencier clairement.

### Modifications

#### `src/components/workshop/CanvasCard.tsx`
- Renommer toutes les references `"light"` en `"section"` dans le type, les conditions, le cycle de modes
- Mettre a jour le type du mode : `"section" | "preview" | "full" | "gamified"`
- Le cycle de basculement devient : section → preview → full → gamified → section
- La largeur pour "section" reste 220px

#### `src/components/workshop/CardSidebar.tsx` (si reference au mode)
- Verifier et mettre a jour les references au mode "light"

#### `src/hooks/useCanvasItems.ts` (si default mode)
- Verifier le mode par defaut

Aucun changement visuel — juste un renommage interne et dans le cycle d'affichage.

