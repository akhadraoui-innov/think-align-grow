
# Plateau de jeu V2 — board libre, thématisé, historisé

Refonte du plan suite au challenge expert.

## 1. Layout général

```text
┌────────────────────────────────────────────────────────────────┐
│ Header (inchangé) + Sélecteur de plateau + bouton "Sauver"     │
├────────────────────────────────────────────────────────────────┤
│  CATÉGORIES (chips horizontaux, scroll-x, cliquables)          │
│  [Tous 240] [Foundations 60] [Model 50] ...  [Pilier A 30] ... │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│         PLATEAU LIBRE (≈ 65% h, pleine largeur)                │
│         - fond thématique du toolkit (serious-game)            │
│         - dépôt libre x/y, cartes redimensionnables             │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│   MAIN — 2 lignes scroll-x, cartes filtrées par la catégorie  │
└────────────────────────────────────────────────────────────────┘
```

Le sélecteur dans le header propose 5 layouts : Atelier, Phases, Constellation, Scène, **Plateau** (nouveau).

## 2. Catégories cliquables (remplace les filtres)

- Bandeau de **chips** (`Badge` style) horizontalement scrollable, juste sous le header quand layout = `plateau`.
- Format de chaque chip explicite et lisible :
  ```
  [icône phase/pilier]  Nom de la catégorie   ·   24
  ```
- Trois groupes empilés visuellement (label en petit caps devant) :
  - **Tout** — `Toutes les cartes · N`
  - **Phases** — Foundations / Model / Growth / Execution avec couleur dérivée du thème.
  - **Piliers** — un chip par pilier avec sa couleur native (`pillar.color`).
- Sélection **mono-catégorie** (clic = remplace). Chip actif : fond plein de sa couleur, texte blanc, ring. Inactif : outline + couleur en accent.
- Le panneau `PlaygroundFilters` reste utilisé par les autres layouts ; il est masqué uniquement en layout `plateau`.

## 3. Plateau — drag & drop libre

- Surface : `position: relative`, hauteur fixe (`h-[65vh]` du body), largeur 100%.
- Fond thématique (cf. §5).
- **Dépôt libre** : on capture la position de la souris à `onDrop` et on stocke `(x, y)` en pourcentage de la surface (résilient au resize fenêtre).
  ```ts
  const rect = boardRef.current.getBoundingClientRect();
  const xPct = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
  const yPct = ((e.clientY - rect.top  - dragOffset.y) / rect.height) * 100;
  ```
- `dragOffset` capturé à `onDragStart` (point d'accroche dans la carte) → la carte se pose **exactement là où le pointeur est lâché**, pas ailleurs.
- Cartes posées : `position: absolute; left/top en %`. Re-draggables sur le plateau pour déplacement (même logique).
- Suppression : bouton `×` au survol (top-right de la carte posée). Touche `Suppr` quand sélectionnée.
- Pas de zones/slots imposés — board libre, l'utilisateur compose.

## 4. Cartes redimensionnables (toutes : main ET plateau)

- **Slider global** dans la barre header du plateau : "Taille des cartes" 60% → 140% → applique un `--card-scale` CSS variable scoped au plateau.
- `PlaygroundCard` reçoit un `scale` prop, applique `transform: scale(var(--card-scale))` ou ajuste `width/height` directement (préférable pour le hit-test du drop).
- Sur le plateau, chaque carte posée a en plus un **handle de resize individuel** (coin bas-droit, `resize: both` ou poignée custom) : permet d'agrandir une carte précise pour l'emphaser sans toucher aux autres. Stocké dans `placement.scale`.
- La main respecte uniquement le `--card-scale` global, pas de resize per-card (sinon casse la grille 2 lignes).

## 5. Esthétique des plateaux — serious-game corporate

Principes (épurés, pas chargés, alignés thème) :
- **Toile** : fond clair `#FAFAF7` ou sombre selon préférence du toolkit (déduit de `theme.accent` luminance), bordure intérieure `inset 0 0 0 1px rgba(0,0,0,.06)` + ombre douce, radius `2xl`.
- **Pattern thématique** déjà calculé dans `getToolkitTheme` (`grid` / `dots` / `topo` / `weave`) en opacité **très faible** (≤ 8%).
- **Marqueurs serious-game discrets** :
  - Coins : 4 petits triangles ou crochets façon "tapis de table" en `theme.accent`.
  - Centre : un **emblème** (mono-color, ≤ 15% opacité) dérivé du toolkit :
    - icône emoji du toolkit (`toolkit.icon_emoji`) en très grand format watermark
    - ou un cercle gradué (façon roulette stratégique)
  - Optionnel : ligne médiane fine ou cercle directeur, mais **un seul ornement majeur**.
- **Variantes** par toolkit, déterministes (hash sur `toolkit.slug`), exposées via `getBoardSkin(toolkit, theme)` qui retourne `{ background, overlayEmblem, cornerMark, surfaceTone }`.
- Aucun bruit visuel : pas de dégradés multiples, pas d'icônes flottantes, pas de motifs concurrents. Corporate = restraint.

## 6. Historisation des parties

### Schéma DB

Migration : nouvelle table `playground_sessions`.

```sql
create table public.playground_sessions (
  id uuid primary key default gen_random_uuid(),
  toolkit_id uuid not null references public.toolkits(id) on delete cascade,
  user_id uuid not null,                    -- auth.uid()
  org_id uuid,                              -- multi-tenant
  name text not null default 'Partie sans nom',
  layout text not null default 'plateau',
  card_scale_global numeric not null default 1,
  placements jsonb not null default '[]'::jsonb,
  -- [{ card_id, x_pct, y_pct, scale, z, rotation }]
  category jsonb,                           -- { type:'all'|'phase'|'pillar', value:string|null }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.playground_sessions enable row level security;
create policy "owner can crud" on public.playground_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "org members can read" on public.playground_sessions
  for select using (org_id is not null and is_org_member(auth.uid(), org_id));

create index on public.playground_sessions (toolkit_id, user_id, updated_at desc);
```

(`is_org_member` est déjà SECURITY DEFINER côté projet ; on le réutilise.)

### UX historique

- Bouton **"Sauver"** (header plateau) → si pas de session active, ouvre dialog "Nom de la partie", crée la row. Si session active, update.
- Bouton **"Mes parties"** → drawer latéral droit listant les sessions du toolkit pour l'user (nom, date, miniature simple = nb cartes posées + chip catégorie). Clic = charge.
- **Auto-save** debounce 2s sur changement de `placements` quand une session est active (évite la perte).
- Bouton **"Nouvelle partie"** = reset placements + clear session active.
- Suppression d'une partie depuis le drawer (confirm).

## 7. État & structure technique

```ts
type Placement = {
  card_id: string;
  x_pct: number;     // 0-100, position du coin top-left
  y_pct: number;
  scale: number;     // 0.6 - 1.6, multiplie le scale global
  z: number;         // ordre d'empilement
  rotation?: number; // V2 future, pas exposé maintenant
};

type PlaygroundSession = {
  id: string;
  name: string;
  toolkit_id: string;
  card_scale_global: number;
  placements: Placement[];
  category: { type: "all" | "phase" | "pillar"; value: string | null };
};
```

**Fichiers créés**
- `src/components/playground/PlateauBoard.tsx` — surface plateau + DnD libre + resize per-card.
- `src/components/playground/PlateauHand.tsx` — main 2 lignes scroll-x, cartes draggables.
- `src/components/playground/PlateauCategoryBar.tsx` — chips Tout/Phases/Piliers.
- `src/components/playground/PlateauSessionDrawer.tsx` — historique + load/delete.
- `src/components/playground/boardSkins.ts` — `getBoardSkin(toolkit, theme)` (corporate, épuré).
- `src/hooks/usePlaygroundSessions.ts` — CRUD Supabase + auto-save debounce.

**Fichiers modifiés**
- `src/components/playground/PlaygroundBoard.tsx` — branche `layout === "plateau"` → `<PlateauBoard …/>`.
- `src/components/playground/PlaygroundCard.tsx` — accepte `scale`, applique width/height.
- `src/pages/portal/PortalToolkitPlayground.tsx` :
  - Ajoute `Plateau` dans `LAYOUTS`.
  - En layout `plateau` : masque `PlaygroundFilters`, affiche `PlateauCategoryBar` + barre slider taille + boutons Sauver / Mes parties / Nouvelle.
  - "Présenter" : ordre = z-index croissant des placements, sinon `filtered`.

**Migration**
- `supabase/migrations/<ts>_playground_sessions.sql` — table + RLS + index ci-dessus.

## 8. Détails de robustesse

- DnD HTML5 natif (déjà en place pour `text/card-id`), avec en plus `text/placement-id` quand on déplace une carte déjà posée → permet de distinguer "ajout depuis main" vs "déplacement sur plateau".
- `dragImage` : `e.dataTransfer.setDragImage(node, ox, oy)` avec l'élément réel, pour cohérence visuelle.
- Resize per-card : poignée custom (mousedown → mousemove → set scale via `rect.width / baseWidth`), borné `0.6–2.0`. Pas de `resize: both` natif (rendu inégal cross-browser).
- `placements` borné implicitement (pas de limite dure, mais auto-save reste léger : JSONB compact).
- Plateau responsive : positions en `%`, le resize fenêtre conserve la composition relative.

## Hors scope (V2 ultérieur)
- Multi-joueur temps réel (Realtime sur `playground_sessions`).
- Rotation des cartes.
- Export image PNG du plateau.
- Templates de plateau pré-remplis.
