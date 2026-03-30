

# Plan — Workspace ACADEMIE dans le portail

## Scope

Dupliquer les 11 pages `/admin/academy/*` en pages portail `/portal/academie/*`, ajouter l'onglet ACADEMIE dans le header (après CHALLENGES), et configurer la sidebar contextuelle.

## Pages admin → pages portail (11 pages)

| Admin source | Nouvelle route portail | Sidebar label |
|---|---|---|
| `AdminAcademy.tsx` | `/portal/academie` | Vue d'ensemble |
| `AdminAcademyMap.tsx` | `/portal/academie/map` | Cartographie |
| `AdminAcademyFunctions.tsx` | `/portal/academie/functions` | Fonctions |
| `AdminAcademyFunctionDetail.tsx` | `/portal/academie/functions/:id` | (detail) |
| `AdminAcademyPersonae.tsx` | `/portal/academie/personae` | Personae |
| `AdminAcademyPaths.tsx` | `/portal/academie/paths` | Parcours |
| `AdminAcademyPathDetail.tsx` | `/portal/academie/paths/:id` | (detail) |
| `AdminAcademyCampaigns.tsx` | `/portal/academie/campaigns` | Campagnes |
| `AdminAcademyTracking.tsx` | `/portal/academie/tracking` | Suivi |
| `AdminAcademyAssets.tsx` | `/portal/academie/assets` | Actifs pédagogiques |
| `AdminAcademyModuleDetail.tsx` | `/portal/academie/modules/:id` | (detail) |

## Modifications par fichier

### 1. `PortalShell.tsx`
- Ajouter onglet `{ label: "ACADEMIE", path: "/portal/academie", matchPrefix: "/portal/academie" }` après CHALLENGES
- Ajouter les routes académie dans la regex `isImmersive` si nécessaire (module detail)

### 2. `PortalSidebar.tsx`
- Ajouter config sidebar pour `/portal/academie` avec 8 items : Vue d'ensemble, Cartographie, Fonctions, Personae, Parcours, Campagnes, Suivi, Actifs pédagogiques

### 3. Créer 11 pages portail dans `src/pages/portal/`
Chaque page sera un wrapper qui :
- Importe le contenu du composant admin correspondant (réutilise les hooks/queries)
- Remplace `AdminShell` par `PortalShell`
- Remappe les `navigate("/admin/academy/...")` vers `navigate("/portal/academie/...")`

Fichiers créés :
- `PortalAcademie.tsx` — dashboard KPIs
- `PortalAcademieMap.tsx` — cartographie
- `PortalAcademieFunctions.tsx` — liste fonctions
- `PortalAcademieFunctionDetail.tsx` — detail fonction
- `PortalAcademiePersonae.tsx` — liste personae
- `PortalAcademiePaths.tsx` — liste parcours
- `PortalAcademiePathDetail.tsx` — detail parcours
- `PortalAcademieCampaigns.tsx` — campagnes
- `PortalAcademieTracking.tsx` — suivi
- `PortalAcademieAssets.tsx` — actifs pédagogiques
- `PortalAcademieModuleDetail.tsx` — detail module

### 4. `App.tsx`
- Importer les 11 nouvelles pages
- Ajouter 11 routes `/portal/academie/*`

## Stratégie de duplication

Chaque page admin sera copiée et adaptée :
1. Retirer `<AdminShell>` wrapper (le `PortalShell` est déjà appliqué par `AppShell`)
2. Remplacer toutes les navigations `/admin/academy/` → `/portal/academie/`
3. Conserver les mêmes queries Supabase, hooks, composants UI, fonctionnalités IA
4. Les données sont identiques (mêmes tables, mêmes RLS policies)

## Ordre d'exécution

1. `PortalShell.tsx` + `PortalSidebar.tsx` — ajout onglet + sidebar
2. Créer les 11 pages portail (par lots parallèles)
3. `App.tsx` — ajouter les routes

