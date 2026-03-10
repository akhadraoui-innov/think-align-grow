

## Corrections Workshop Canvas — Cartes, Sidebar, Performance

### Probleme 1 : Carte mode "light" grise/blanche illisible

**Cause** : Le mode "light" utilise `bg-card` (blanc) avec du texte standard sombre, mais la barre de couleur pilier ne fait que 2px en haut. Le screenshot montre un fond gris pale avec texte blanc — totalement illisible.

**Cause bonus critique** : `building` mappe vers `"primary"` et `gouvernance` vers `"accent"` dans `PILLAR_GRADIENT_MAP`. Or les CSS variables `--pillar-primary` et `--pillar-accent` **n'existent pas** dans `index.css`. Ces piliers n'ont donc aucune couleur (transparent).

**Fix** :
- `index.css` : ajouter `--pillar-primary` et `--pillar-accent` avec des couleurs distinctes (ex: bleu ardoise pour building, vert fonce pour gouvernance)
- `CanvasCard.tsx` mode light : remplacer le fond blanc par le fond pillar color avec texte blanc, comme le mode gamifie — une mini-carte compacte avec fond colore

### Probleme 2 : Sidebar cartes tronquees, pas de detail au survol

**Cause** : `CardItem` dans `CardSidebar.tsx` tronque le titre (`truncate`) et la definition (`line-clamp-1`). Le bouton "+" est invisible (`opacity-0 group-hover:opacity-100`) et la carte depasse la sidebar (w-72 = 288px).

**Fix** :
- Rendre le bouton "+" toujours visible (ou au moins plus apparent)
- Ajouter un `HoverCard` (Radix) qui s'ouvre apres ~1.5s de survol avec tous les details de la carte : titre, definition complete, phase, pilier, action, KPI
- Corriger le layout pour que les cartes ne debordent pas

### Probleme 3 : Performance deplacement/zoom

Le rAF throttle est deja en place. Le probleme residuel est que `onUpdatePosition` dans `useCanvasItems` appelle `setItems(prev => prev.map(...))` a chaque frame de drag, ce qui re-rend tous les items. Et chaque item utilise `motion.div` avec des animations spring.

**Fix** :
- Retirer `initial`/`animate` des items pendant le drag (ces animations spring de 400 stiffness a chaque render sont couteuses)
- Utiliser `layout={false}` sur les motion.div pendant le drag
- Optionnel : remplacer les `motion.div` des items par des `div` simples (l'animation d'apparition initiale peut etre un simple CSS `@keyframes`)

---

### Plan d'implementation

| Fichier | Modification |
|---|---|
| `src/index.css` | Ajouter `--pillar-primary` (ex: `210 60% 48%` bleu) et `--pillar-accent` (ex: `170 55% 38%` teal) |
| `src/hooks/useToolkitData.ts` | Changer `building → "building"` et `gouvernance → "gouvernance"`, ajouter les CSS vars correspondantes |
| `src/index.css` | Ajouter `--pillar-building` et `--pillar-gouvernance` |
| `src/components/workshop/CanvasCard.tsx` | Mode "light" : fond = pillarColor, texte blanc, supprimer bg-card. Remplacer `motion.div` par `div` avec CSS animation pour l'apparition |
| `src/components/workshop/CardSidebar.tsx` | Ajouter HoverCard avec delai 1500ms sur chaque `CardItem`, affichant titre, pilier, phase, definition, action, KPI complets. Rendre le "+" plus visible |
| `src/components/workshop/StickyNote.tsx` | Remplacer `motion.div` par `div` avec CSS keyframe pour l'apparition |

