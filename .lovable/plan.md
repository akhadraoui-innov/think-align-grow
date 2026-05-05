## Toolkit Playground v2 — plateau thématique + cartes "corporate game" illustrées

Évolution du plan v1 : le plateau s'adapte visuellement à la thématique du toolkit, et chaque carte reçoit un nouveau design "jeu corporate" avec sa propre illustration générée par IA.

---

### 1. Données — illustrations par carte

**Migration** : ajouter à la table `cards`
- `image_url TEXT` — URL publique de l'illustration
- `image_prompt TEXT` — prompt utilisé (pour régénération)
- `image_status TEXT DEFAULT 'pending'` — `pending | generating | ready | failed`

**Storage** : réutiliser `academy-assets` sous `card-illustrations/{toolkit_id}/{card_id}.png`.

**Edge function** `academy-generate` — nouvelles actions :
- `generate-card-illustration` (toolkit_id, card_id) — illustration carrée 1:1, style cohérent avec la cover du toolkit
- `generate-all-card-illustrations` (toolkit_id, force?) — batch via `EdgeRuntime.waitUntil` (concurrence 2, sans bloquer la requête)

**Brief image** : illustration éditoriale carrée (1024×1024), style flat editorial type "Behance corporate game", palette dérivée de la couleur du pilier de la carte, sujet pictographique abstrait incarnant le titre + l'objectif de la carte. **Aucun texte** dans l'image. Cohérence visuelle avec la cover du toolkit (même style/lumière).

**Admin Toolkits** : sur `/admin/toolkits/:id`, ajouter dans la barre :
- bandeau "X / Y cartes sans illustration" + bouton "Générer toutes"
- bouton régénérer par carte dans la liste

---

### 2. Nouveau design carte "Corporate Game"

Composant : `src/components/playground/PlaygroundCard.tsx` (nouveau, ne pas toucher `GameCard` existant utilisé ailleurs).

**Anatomie** (ratio 5:7, ~280×392) :
```text
┌──────────────────────────┐
│ ▌ PILLAR · PHASE   ⚡VAL │  ← bandeau couleur pilier (h-7), uppercase 10px
├──────────────────────────┤
│                          │
│      ILLUSTRATION        │  ← image 1:1 (h-44) avec gradient bas
│                          │
├──────────────────────────┤
│ Titre carte (font-display)│
│ sous-titre court          │
│ ─────────                 │
│ ◆ Action: ...             │  ← icône objectif + 1-2 lignes
│ ◇ KPI: ...                │
└──────────────────────────┘
   [tag] [tag]   ⏱ 15min
```

**Caractéristiques** :
- Encart numéroté discret en bas (`#042`) façon collection trading-card
- Bord 1px couleur pilier + ombre interne subtile, hover lift 4px + glow couleur pilier
- Au clic → flip 3D (back face : définition complète + valorisation + qualification)
- État vide image : placeholder avec icône `icon_name` + dégradé pilier (skeleton shimmer pendant génération)
- Mode draggable conservé pour le deck

**Variantes** :
- `compact` (deck droit, ~180×252)
- `default` (plateau)
- `presentation` (plein écran, ratio préservé, taille max viewport)

---

### 3. Plateau thématique adapté

Le plateau lui-même change d'ambiance selon le toolkit. Chaque toolkit reçoit un **theme dérivé automatiquement** sans nouveau champ DB :
- couleur dominante = couleur du pilier `sort_order=0`
- texture = pattern SVG choisi parmi 4 selon `toolkit.tags` ou hash du slug : `grid` (stratégie) / `dots` (idéation) / `topo` (transformation) / `weave` (collectif)
- titre du plateau = nom du toolkit, display font, taille XL avec emoji

**4 layouts de plateau** sélectionnables (boutons en header), chacun thématisé :

1. **Atelier** (défaut) — masonry libre, fond papier kraft texturé léger, cartes flottantes avec ombre douce
2. **Kanban Phases** — 4 colonnes (Foundations / Modèle / Croissance / Exécution), fond ardoise texturé, en-têtes colorés
3. **Constellation** — vue radiale par pilier (cartes en arc autour du nom du pilier), fond sombre + halos couleur pilier
4. **Carrousel scénique** — une carte centrale agrandie, voisines en perspective (CSS 3D), nav flèches/clavier

Le bandeau header du playground utilise la **cover_image_url** du toolkit en parallax léger (translate Y au scroll), avec overlay dégradé couleur dominante.

---

### 4. Sidebar filtres (gauche, collapsible)

- Recherche plein-texte (titre + sous-titre + définition + tags)
- Chips piliers (couleur réelle + compteur)
- Chips phases avec PHASE_LABELS
- Chips difficulté
- Slider valorisation min
- Toggle "Avec illustration uniquement"
- Reset

Animations `framer-motion` `layout` lors du re-shuffle.

---

### 5. Deck personnel (droite, collapsible)

- Drop-zone "Glissez vos cartes ici"
- Persistance `localStorage` `toolkit-deck:{toolkitId}`
- Cartes en variante `compact`, réordonnables, bouton retirer
- Compteur + valorisation totale du deck
- "Mode présentation" → plein écran avec carte `presentation`, navigation ←/→/espace, échap quitte

---

### 6. Boutons d'accès depuis `/portal/workshops/toolkits`

- Card grid : CTA secondaire "✨ Terrain de jeu" sur la cover (stopPropagation)
- List : icône bouton dédiée
- Vue détail panneau : CTA principal en tête

---

### 7. Architecture fichiers

```
src/pages/portal/PortalToolkitPlayground.tsx        (nouveau, route /portal/workshops/toolkits/:toolkitId/playground)
src/components/playground/PlaygroundCard.tsx        (nouveau)
src/components/playground/PlaygroundBoard.tsx       (nouveau, dispatch des 4 layouts)
src/components/playground/boards/AtelierBoard.tsx
src/components/playground/boards/KanbanBoard.tsx
src/components/playground/boards/ConstellationBoard.tsx
src/components/playground/boards/CarouselBoard.tsx
src/components/playground/PlaygroundFilters.tsx
src/components/playground/PlaygroundDeck.tsx
src/components/playground/PresentationMode.tsx
src/lib/toolkitTheme.ts                             (dérivation theme + pattern SVG inline)
```

Modifications :
- Migration SQL ajoutant `image_url`, `image_prompt`, `image_status` à `cards`
- `supabase/functions/academy-generate/index.ts` : 2 nouvelles actions
- `src/pages/portal/PortalToolkits.tsx` : 3 boutons d'accès
- `src/pages/admin/AdminToolkits.tsx` (ou détail) : déclencheur batch illustrations
- `src/App.tsx` : nouvelle route

---

### 8. Performance & robustesse

- Lazy-load des layouts non actifs (`React.lazy`)
- Image cache-bust via `?v=${updated_at}` cohérent avec les covers
- `IntersectionObserver` : illustration en `loading="lazy"` + skeleton tant que `image_status !== 'ready'`
- Génération batch en `EdgeRuntime.waitUntil` pour rester sous la limite CPU
- Toast après lancement batch + invalidation différée 30s (pattern déjà appliqué aux covers)

### Hors scope
- Édition des cartes
- Sauvegarde serveur du deck (localStorage suffit v1)
- Co-présence temps réel
- Export PDF du deck

### Acceptance
- Chaque carte affiche son illustration unique cohérente avec la cover
- Le plateau change visuellement (palette + pattern + titre) selon le toolkit
- 4 layouts sélectionnables, switch fluide
- Bouton sur chaque toolkit pour lancer le playground
- Drag d'une carte vers le deck persisté localStorage
- Mode présentation plein écran fonctionne au clavier
- Admin peut lancer un batch d'illustrations qui tourne en arrière-plan