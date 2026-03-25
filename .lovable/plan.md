

# Corrections du Catalogue + 5 vues alternatives

## Problemes identifies

1. **Nom tronque** : `max-w-[200px] truncate` coupe les titres longs
2. **Organisation vide** : `organization_id` est NULL pour la majorite des assets -- afficher "Growthinnov" par defaut
3. **Version 0** : le seed met `version_count = 0` -- afficher "1.0" minimum (version initiale)
4. **Contributeur 0** : `contributor_count = 0` -- afficher 1 minimum (le createur)
5. **Collapse vide** : `academy_asset_versions` est vide car les triggers ne capturent qu'au UPDATE -- le collapse doit generer une "v0 - Creation" synthetique a partir du snapshot
6. **Filtres limites** : pas de filtre par difficulte, mode de generation, statut, tags

## Plan

### 1. Corrections donnees (page catalogue)

- **Nom** : retirer `max-w-[200px] truncate`, utiliser `max-w-[350px]` avec tooltip au hover
- **Organisation** : si `organization_id` est null, afficher "Growthinnov" avec le logo/couleur
- **Version** : afficher `Math.max(1, version_count)` et label "v1.0"
- **Contributeur** : afficher `Math.max(1, contributor_count)`
- **Collapse** : si `academy_asset_versions` retourne 0 lignes, generer une entree synthetique "v1.0 — Creation initiale" avec la date `created_at` de l'asset et le `last_modified_by` ou "Systeme"

### 2. Filtres supplementaires

Ajouter dans la barre de filtres :
- **Statut** : draft / published / active
- **Difficulte** : beginner / intermediate / advanced (extrait du snapshot)
- **Mode de generation** : manual / ai (extrait du snapshot)

Ces filtres operent cote client sur les champs du snapshot deja charge.

### 3. Cinq vues alternatives du catalogue

Ajouter un toggle de vue (icones) dans le header, pattern deja utilise dans l'admin :

| Vue | Description |
|-----|-------------|
| **Tableau** (actuel) | Table avec colonnes KPI, collapse versioning |
| **Grille** | Cards riches par asset avec badge type, KPIs, tags, miniature snapshot |
| **Timeline** | Axe chronologique vertical par date de creation, groupe par jour |
| **Kanban** | Colonnes par statut (draft / published / active), drag disabled (lecture seule) |
| **Treemap** | Blocs proportionnels par type d'asset, colores, avec count par org |

Chaque vue partage les memes filtres et les memes donnees (`filtered`).

### Fichiers modifies

| Fichier | Action |
|---------|--------|
| `src/pages/admin/AdminObservabilityCatalogue.tsx` | Corrections affichage + ajout filtres + 5 vues avec toggle |

### Details techniques

**Toggle de vue** : state local `viewMode: "table" | "grid" | "timeline" | "kanban" | "treemap"` avec des icones `Table2, LayoutGrid, Clock, Columns3, BarChart3`.

**Vue Grille** : grid responsive `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` avec Card contenant type badge, nom complet, org, KPIs en row, tags extraits du snapshot.

**Vue Timeline** : groupement par `format(created_at, "dd MMMM yyyy")`, items verticaux avec dot + ligne.

**Vue Kanban** : 3 colonnes (draft/published/active), cards compactes avec type + nom + org.

**Vue Treemap** : rectangles CSS proportionnels (flex-wrap) colores par type, taille proportionnelle au count, cliquable pour filtrer.

**Filtres snapshot** : extraction via `(asset.snapshot as any)?.difficulty` etc., filtrages `useMemo` cote client.

