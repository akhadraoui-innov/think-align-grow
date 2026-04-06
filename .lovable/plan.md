

# Plan — Ajouter les liens de navigation UCM dans le Portal et le Cabinet

## Problème

Les routes UCM existent (`/portal/ucm`, `/portal/ucm/:id`, `/portal/ucm/explorer`, `/admin/ucm`, `/admin/ucm/sectors`, `/admin/ucm/prompts`) mais **aucune navigation ne pointe vers elles** :
- `PortalShell.tsx` → `NAV_TABS` ne contient pas "AI VALUE BUILDER"
- `AppSidebar.tsx` → aucune entrée UCM
- `PortalSidebar.tsx` → config `/portal/ucm` existe déjà (ok)
- `AdminSidebar.tsx` → entrée UCM déjà présente (ok)

## Changements

### 1. `src/components/portal/PortalShell.tsx` — Ajouter l'onglet UCM

Ajouter dans `NAV_TABS` :
```
{ label: "AI VALUE BUILDER", path: "/portal/ucm", matchPrefix: "/portal/ucm" }
```
Cela activera automatiquement le `PortalSidebar` config pour `/portal/ucm` (déjà définie avec "Projets" et "UC Explorer").

### 2. `src/components/layout/AppSidebar.tsx` — Ajouter UCM dans le sidebar Cabinet

Ajouter une section ou un item "AI Value Builder" avec lien vers `/portal/ucm` (redirige vers le portal) ou créer une route cabinet dédiée si pertinent. Vu l'architecture existante (le Cabinet a ses propres routes `/`), le plus cohérent est d'ajouter un lien direct `/portal/ucm` dans les items du sidebar.

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/portal/PortalShell.tsx` | Ajouter entrée NAV_TABS pour UCM |
| `src/components/layout/AppSidebar.tsx` | Ajouter lien UCM dans la navigation |

## Ordre
1. PortalShell (accès portal)
2. AppSidebar (accès cabinet)

