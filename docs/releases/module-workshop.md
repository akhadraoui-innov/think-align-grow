# Module — Workshop Canvas

> Espace **collaboratif infini** type Miro pour assembler cartes, sticky notes, flèches, groupes et icônes en sessions stratégiques temps réel.

## 🎯 Vision

Permettre aux facilitateurs et participants de **manipuler les cartes des toolkits** sur un canvas pannable/zoomable, avec collaboration temps réel, livrables IA (SWOT, BMC, Pitch Deck, Plan d'action).

## 🏛️ Jalons majeurs

### 2026-03-09 — Diagnostic & refonte canvas
- Audit utilisateur : *« c'est immature, impossible à utiliser, le toolkit n'est pas valorisé »*.
- Décision : refonte vers une **expérience Miro-like** avec canvas infini pannable + zoom.

### 2026-03-09 — Workshop mode avec livrables
Spécifications validées :
- **Format** : hybride temps réel (host + participants).
- **Taille de groupe** : solo à 30+.
- **Livrables auto** : SWOT, Business Model Canvas, Pitch Deck, Plan d'action.
- **Coach IA temps réel** : activable, consomme des crédits.

### 2026-03-09 — Implémentation Canvas
- `WorkshopCanvas.tsx` : canvas infini avec CSS transforms (`scale`, `translate`) et Pointer Events natifs.
- Composants drag-and-drop :
  - `CanvasCard.tsx` (cartes du toolkit).
  - `StickyNote.tsx` (post-it colorés).
  - `CanvasArrow.tsx` (flèches avec ancres dynamiques).
  - `CanvasGroup.tsx` (groupes redimensionnables).
  - `CanvasIcon.tsx` (icônes Lucide).
  - `CanvasText.tsx` (zones texte libres).
  - `CanvasStats.tsx` (widgets KPI).
- `AnchorHandles.tsx` : poignées d'ancrage sur les bords des éléments pour connecter des flèches.
- `ArrowToolbar.tsx` : sélecteur de style (droite, courbe, pointillé).
- `WorkshopToolbar.tsx` : zoom in/out, fit-to-screen, snap-to-grid, export PNG.

### 2026-03-09 — Persistance & Realtime
- Tables : `workshops`, `workshop_participants`, `canvas_items`, `canvas_comments`.
- Hooks : `useWorkshop.ts`, `useCanvasItems.ts`, `useCanvasComments.ts`.
- Realtime via Supabase channels : chaque déplacement/ajout est broadcasté.
- RLS : fonctions `is_workshop_host()` et `is_workshop_participant()` SECURITY DEFINER (anti-récursion).

### 2026-03 — Sidebar des cartes & Context Sheet
- `CardSidebar.tsx` : navigation dans les cartes du toolkit avec filtres pillar/phase.
- `CardContextSheet.tsx` : panneau latéral détaillant la carte sélectionnée (mode Full).
- Drag depuis la sidebar vers le canvas : crée une instance positionnée.

### 2026-03 — Discussion panel
- `DiscussionPanel.tsx` : chat de session avec commentaires ancrés à des items canvas.
- Messages persistés dans `canvas_comments` avec lien `item_id` optionnel.

### 2026-03-11 — Workshop Room
- `WorkshopRoom.tsx` + `PortalWorkshopRoom.tsx` : route dédiée par session avec URL partageable.
- Host controls : verrouiller/débloquer le canvas, exporter, fermer.
- Participant view : positions synchronisées + chat live.

### 2026-04 — Contraintes layout
Le canvas est **exclu du layout global** (pas de sidebar, pas de header). `WorkshopCanvas.tsx` rend en `fixed inset-0` pour garantir l'immersion.

## 📦 État actuel

- ✅ Canvas infini opérationnel avec 7 types d'items.
- ✅ Realtime synchro multi-participants.
- ✅ RLS sécurisée (anti-récursion).
- ✅ Toolbar complète (zoom, snap, export).
- ✅ Discussion ancrée aux items.
- 🚧 Livrables IA (SWOT/BMC/Pitch) : socle prêt, génération IA à finaliser.

## 🧠 Références mémoire

- `mem://features/workshop-canvas` — Canvas infini Miro-like
- `mem://technical/architecture` — Realtime + RLS
- `mem://technical/rls-policies` — Anti-récursion workshop_participants
