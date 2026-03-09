

## Workshop Canvas — Refonte complète

### Constat

Le WorkshopRoom actuel est une simple liste accordéon + texte plat. Pas de canvas, pas de drag, pas de cartes riches, pas de post-its, pas de flèches, pas de discussions, pas de données visibles.

### Ce qu'on va construire

Un **workspace interactif type Miro** centré sur les cartes du toolkit CPAM, avec :

1. **Canvas pannable/zoomable** — fond infini, pan au drag sur le fond, zoom molette
2. **Cartes riches draggables** — design premium avec couleur pilier, titre, définition, action, KPI, phase, avatar créateur
3. **Sidebar toolkit** — piliers en accordéon, drag-to-canvas pour poser des cartes
4. **Post-its** — notes libres, couleurs, texte éditable, auteur
5. **Groupes** — rectangles nommés pour regrouper des éléments
6. **Flèches SVG** — connecteurs dynamiques entre items
7. **Toolbar** — modes (sélection, post-it, flèche), zoom, contrôles host
8. **Panel de discussion** — commentaires attachés à chaque élément, attribution
9. **Persistance temps réel** — tout synchro via realtime entre participants
10. **Stats & data** — compteurs d'items par pilier, activité récente, qui a contribué quoi

### Architecture technique

```text
WorkshopRoom.tsx (refonte complète)
├── WorkshopToolbar.tsx        — modes, zoom, timer, participants
├── CardSidebar.tsx            — piliers accordéon, drag source
├── WorkshopCanvas.tsx         — conteneur pan/zoom (CSS transforms)
│   ├── CanvasCard.tsx         — carte riche draggable (pilier, KPI, action, phase)
│   ├── StickyNote.tsx         — post-it éditable
│   ├── CanvasGroup.tsx        — groupe avec titre, contient des items
│   └── CanvasArrow.tsx        — flèche SVG entre 2 items
├── DiscussionPanel.tsx        — commentaires sur l'item sélectionné
└── CanvasStats.tsx            — stats live (items par pilier, contributeurs)
```

### Base de données — 2 nouvelles tables

**`workshop_canvas_items`** — Tous les éléments du canvas
- `id`, `workshop_id`, `type` (enum: card/sticky/group/arrow)
- `card_id` (nullable, FK cards si type=card)
- `x`, `y` (float, position canvas)
- `width`, `height` (nullable, pour groupes)
- `content` (jsonb — texte post-it, config flèche, label groupe)
- `color` (text, nullable)
- `created_by` (uuid)
- `from_item_id`, `to_item_id` (nullable, pour flèches)
- `parent_group_id` (nullable, self-ref)
- `z_index` (int)
- `created_at`, `updated_at`
- Realtime activé, RLS via `is_workshop_participant`

**`workshop_comments`** — Discussions par item
- `id`, `workshop_id`, `canvas_item_id`, `user_id`, `content`, `created_at`
- RLS via `is_workshop_participant`

### Implémentation — 3 étapes

**Etape 1 : Canvas + Cartes riches + Sidebar** (le plus gros)
- Canvas avec `onPointerDown/Move/Up` pour pan, `onWheel` pour zoom
- State local: `viewportX`, `viewportY`, `scale`
- `CanvasCard` : design premium avec bande couleur pilier en haut, sections définition/action/KPI, badge phase, avatar créateur
- `CardSidebar` : accordéon par pilier, bouton "Ajouter au canvas" qui place la carte au centre du viewport
- `StickyNote` : double-click pour éditer, 5 couleurs
- `WorkshopToolbar` : boutons mode + zoom + contrôles host (start/pause/complete) + timer

**Etape 2 : Groupes + Flèches + Persistance DB**
- Migration SQL pour `workshop_canvas_items` + `workshop_comments`
- Hook `useCanvasItems` : CRUD + realtime subscription
- `CanvasGroup` : rectangle avec titre, drag pour déplacer, resize
- `CanvasArrow` : SVG path entre items, calculé depuis positions
- Debounce position updates (300ms) pour ne pas flood

**Etape 3 : Discussions + Stats + Attribution**
- `DiscussionPanel` : panneau latéral droit, commentaires par item
- `CanvasStats` : compteurs items par pilier, participants actifs, dernières actions
- Badge avatar sur chaque item créé/modifié
- Hook `useCanvasComments` : CRUD + realtime

### Détail du design CanvasCard (premium)

```text
┌─────────────────────────────┐
│ ██████ bande couleur pilier │
│                             │
│ PILIER · PHASE              │  ← 10px uppercase tracking
│ TITRE DE LA CARTE           │  ← 18px bold uppercase
│ ─────────────────────────── │
│ Définition texte...         │  ← 13px, 3 lignes max
│                             │
│ ┌─ Action ───────────────┐  │
│ │ Texte de l'action...   │  │  ← fond primary/5
│ └────────────────────────┘  │
│                             │
│ 📊 KPI: texte du KPI       │  ← petit, muted
│                             │
│ [avatar]  ·  il y a 2min    │  ← créateur + timestamp
└─────────────────────────────┘
```

### Contraintes
- Zéro lib externe pour le canvas (CSS transforms + pointer events)
- Flèches en SVG pur (path calculé)
- Positions en coordonnées canvas (pas écran)
- Debounce des updates DB
- Mobile : sidebar en sheet, canvas touch-friendly

