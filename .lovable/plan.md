## Contexte

Sur l'onglet **Cartes → Visuel** (`ToolkitCardsBrowser`), 5 formats existent (Game / Section / Preview / Full / Gamifié) mais :
1. Le **"Preview"** dans le sélecteur de format est un *layout statique* — il n'y a pas de bouton pour ouvrir la carte en grand (preview plein écran avec son illustration réelle).
2. Aucune vue **"Plateau"** ne permet de voir les cartes disposées comme dans le Terrain de jeu (kanban / atelier).

Le bouton "Terrain de jeu" existe en haut à droite, mais il ouvre un nouvel onglet — l'utilisateur veut un **preview inline**.

## Changements (frontend uniquement)

### 1. Nouveau format "Plateau" dans `ToolkitCardsBrowser.tsx`

Ajouter `"plateau"` au type `CardFormat` et une entrée dans le `<Select>` (icône `LayoutDashboard`).
Quand sélectionné, rendre `<PlaygroundBoard>` (déjà existant dans `src/components/playground/`) avec :
- sous-sélecteur de layout : **Atelier / Kanban / Constellation / Carrousel** (state local)
- `cards` filtrées + `pillars` + `accent` du toolkit (couleur primaire par défaut)
- mode lecture seule (drag-and-drop désactivé : on ignore `onDragStart` côté preview)

Le `groupBy` est masqué quand `format === "plateau"` (le plateau gère son propre groupement).

### 2. Bouton **"Aperçu"** par carte (dans tous les formats sauf plateau)

Sur chaque carte rendue par `renderCard`, ajouter un bouton flottant (top-right, opacity-0 group-hover:opacity-100, icône `Eye`) qui ouvre un `<Dialog>` plein écran montrant :
- l'illustration via `<CardThumb imageUrl imageStatus title pillarColor />` en grand format (aspect 4/3, max-w-2xl)
- titre, sous-titre, pilier, phase, objective, definition, action, KPI (réutiliser le rendu "Full" existant)
- badge de statut illustration (ready / generating / failed) + bouton "Relancer" si failed (réutilise `generate-card-illustration`)

State : `const [previewCard, setPreviewCard] = useState<Tables<"cards"> | null>(null)`

### 3. Rendre le bouton existant plus discoverable

Dans `AdminToolkitDetail.tsx` ligne 184-191, renommer **"Terrain de jeu"** → **"Aperçu Playground"** avec icône `Eye` au lieu de `Gamepad2`, et le déplacer juste à côté du sélecteur de vue dans `ToolkitCardsTab` (en plus du header), pour qu'il soit visible quand on est sur l'onglet Cartes.

## Fichiers touchés

- `src/components/admin/ToolkitCardsBrowser.tsx` — ajout format "plateau", bouton Aperçu par carte, dialog preview
- `src/components/admin/ToolkitCardsTab.tsx` — bouton "Aperçu Playground" supplémentaire à côté du toggle Tableau/Visuel
- `src/pages/admin/AdminToolkitDetail.tsx` — renommer/réicôner le bouton existant (cosmétique)

Aucun changement DB, edge function, types Supabase, ou logique de génération.

## Détails techniques

- `PlaygroundBoard` accepte déjà `cards`, `pillars`, `accent`, `layout` — réutilisation directe.
- Pour désactiver le drag en mode preview, on peut envelopper dans une div avec `onDragStart={(e) => e.preventDefault()}` au niveau du conteneur, ou passer un flag `readOnly` (mineur — sinon on laisse le drag inerte puisqu'aucun drop target n'existe dans le browser).
- Le bouton Aperçu par carte utilise `e.stopPropagation()` pour ne pas déclencher d'autres handlers (drag).
- Le preview dialog est responsive : `max-w-3xl max-h-[85vh] overflow-y-auto`.
