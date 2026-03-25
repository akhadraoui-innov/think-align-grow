

# Module Observabilite — Page admin dediee

## Vue d'ensemble

Nouvelle page `/admin/observability` accessible depuis la sidebar sous "Parametres" dans la categorie Systeme. Ce module centralise le suivi de tout le cycle de vie des contenus pedagogiques et structurels a travers les organisations.

## Architecture des donnees

Deux sources de donnees combinees :
- **`academy_asset_versions`** : snapshots automatiques (quiz, exercise, practice, path, persona, campaign) avec `changed_by`, `asset_type`, `asset_id`, `change_summary`, `created_at`
- **`activity_logs`** : actions generales (created, updated, deleted) avec `user_id`, `entity_type`, `entity_id`, `organization_id`, `metadata`

Pas de nouvelle table DB necessaire. Tout repose sur l'agregation de ces deux sources existantes.

## Structure de la page — 4 sections interactives

### Section 1 : KPI Cards (haut de page)
4 compteurs animes avec tendance :
- Total versions enregistrees (toutes entites)
- Contributeurs actifs (distinct `changed_by` sur 30j)
- Organisations actives (distinct `organization_id` sur 30j)
- Modifications aujourd'hui

### Section 2 : Graphique d'activite (Recharts AreaChart)
- Axe X : jours (28 derniers jours)
- Series empilees par `asset_type` (path, quiz, exercise, practice, persona, campaign)
- Toggle pour basculer entre "versions" et "activity_logs"

### Section 3 : Fil d'activite en temps reel (timeline)
- Fusion chronologique des `academy_asset_versions` + `activity_logs` filtres sur les entites academy
- Chaque entree affiche : avatar/initiale utilisateur, nom utilisateur, action, type d'asset, organisation, horodatage relatif
- Resolution des `changed_by` / `user_id` via `profiles`
- Resolution des `organization_id` via `organizations`
- Lazy-load avec "Charger plus" (pagination curseur)

### Section 4 : Matrice de couverture Organisation x Type
- Tableau croise : lignes = organisations, colonnes = types d'assets (path, quiz, exercise, practice, persona, campaign)
- Cellules = nombre de versions/modifications
- Heatmap visuel (intensite de couleur proportionnelle au volume)
- Clic sur cellule = filtre la timeline sur cette combinaison

## Filtres globaux (barre superieure)
- Organisation (select multi)
- Type d'asset (select multi)
- Utilisateur (search autocomplete)
- Periode (date range picker)
- Export CSV de la vue filtree

## Fichiers a creer / modifier

| Fichier | Action |
|---------|--------|
| `src/pages/admin/AdminObservability.tsx` | Creer — page principale avec les 4 sections |
| `src/hooks/useObservability.ts` | Creer — hook centralisant les requetes (versions + logs + profiles + orgs) avec filtres |
| `src/components/admin/AdminSidebar.tsx` | Modifier — ajouter lien "Observabilite" dans systemItems sous Parametres |
| `src/components/admin/AdminShell.tsx` | Modifier — ajouter breadcrumb |
| `src/App.tsx` | Modifier — ajouter route `/admin/observability` |

## Sidebar : positionnement

```text
Systeme
  ├── Credits & Abonnements
  ├── Logs d'activite
  ├── Parametres
  └── Observabilite        ← NOUVEAU (icone: Activity)
```

Permission requise : `admin.logs.view` (meme perimetre que les logs d'audit).

## Details techniques

- **Hook `useObservability`** : 
  - Query 1 : `academy_asset_versions` avec jointure sur `profiles` via `changed_by`, filtre par `asset_type`, periode, pagination
  - Query 2 : `activity_logs` filtres sur `entity_type IN ('academy_path', 'academy_quiz', ...)` avec jointure `organizations(name)`
  - Query 3 : Agregation pour KPIs (count distinct)
  - Query 4 : Agregation pour le graphique (group by date + asset_type)
  - Query 5 : Matrice croisee (group by organization_id + asset_type)

- **Graphique** : Recharts `AreaChart` avec `stackedArea`, 6 couleurs distinctes par type
- **Matrice heatmap** : Rendu via `<table>` avec `bg-primary/[opacity]` dynamique
- **Timeline** : Composant vertical avec dot + ligne, resolution lazy des noms utilisateurs/orgs
- **Export CSV** : meme pattern que `useAdminLogs.exportCsv`

