## Refactor `/admin/toolkits` to align with `/admin/academy/paths`

The current Toolkits admin page is still a flat data table with a tiny 40×56 thumbnail. The Academy Paths admin uses a much richer editorial grid (cover hero + badges + per-card actions + view toggle). Goal: harmonize Toolkits admin with that pattern while keeping toolkit-specific signals (pillars/cards counts, status, slug, emoji fallback).

### Scope

File to modify:
- `src/pages/admin/AdminToolkits.tsx`

No DB or edge function changes (covers, batch button and `cover_image_url` already exist).

### Changes

1. **View toggle** (Grid / Table), default Grid, persisted in `useState`. Same pattern/components as `AdminAcademyPaths` (LayoutGrid / List buttons).

2. **Filters bar** above the content:
   - Search input (replaces DataTable internal search)
   - Status select: Tous / Brouillon / Publié / Archivé
   - Difficulty select (if `difficulty_level` exists on toolkits — verify; otherwise skip)
   - View mode toggle on the right

3. **Grid view** — cards `h-[380px]`, rounded-2xl, hover lift:
   - **Cover hero** `h-36`:
     - `cover_image_url` with cache-bust + `object-cover` + group-hover scale
     - Fallback: gradient (toolkit pillar color or neutral) + large emoji centered
     - Top-left badges: status (Brouillon/Publié) + pillar count chip
     - Top-right hover actions: regenerate cover (Wand2), edit, delete
   - **Body**:
     - Title (line-clamp-2), slug muted mono, description (line-clamp-2)
     - Footer: piliers / cartes / date créée with icons, separated by border-t

4. **Table view** — keep existing columns but slightly enhance thumbnail to `h-12 w-16` to match Paths admin.

5. **Header banner** (missing covers) — keep as-is, already aligned visually.

6. **Empty state** — dashed Card matching Paths admin pattern.

7. **Loading state** — 6 skeleton cards (Grid) / spinner (Table).

8. **Per-card actions** wired to:
   - Regenerate cover → existing `triggerCover(id)`
   - Edit → navigate to `/admin/toolkits/:id`
   - Delete → reuse `useAdminToolkits` remove (add if missing — verify hook)

### Visual reference

```text
┌─────────────────────────────────┐
│ [cover image 16:9, h-36]        │
│  [Publié] [12 piliers]   [✎][🗑]│
├─────────────────────────────────┤
│ Conception & lancement offres   │
│ conception-lancement-offres     │
│ Description courte sur 2 lignes │
│                                 │
│ 📚 12 piliers  🃏 0 cartes  05  │
└─────────────────────────────────┘
```

### Out of scope
- Pagination redesign (DataTable handles table mode; grid uses simple list)
- Bulk operations beyond existing "Générer toutes"
- New DB columns

### Acceptance
- Toolkits admin shows a Grid view by default with cover heroes, identical density and rhythm as `/admin/academy/paths`
- Status / search filters operate client-side
- Toggle to Table view restores enriched table
- Hover actions on cards work without triggering row navigation