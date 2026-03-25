

# Fix: Vue d'ensemble vide + Matrice de couverture vide

## Diagnostic

**Vue d'ensemble vide** : Les KPIs, le graphique et le fil d'activite dependent de `academy_asset_versions` et `activity_logs`, qui sont tous deux **vides** (0 lignes). Ces tables ne se remplissent qu'au UPDATE d'un asset (pas a la creation initiale). Donc avec des assets uniquement crees et jamais modifies, tout est a zero.

**Matrice de couverture vide** : Le code filtre les assets avec `if (!orgId) return`, or **tous les assets** ont `organization_id = null`. Donc la matrice est systematiquement vide.

## Plan

### 1. Refonder les KPIs sur `observatory_assets`

Les KPIs doivent utiliser `observatory_assets` (qui contient 56 assets) comme source principale, pas `academy_asset_versions` (vide) :

- **Assets total** : `catalogue.length` (deja OK)
- **Versions totales** : somme des `version_count` depuis catalogue (deja OK)
- **Contributeurs actifs** : extraire les `contributor_ids` uniques depuis catalogue au lieu de chercher dans les versions
- **Organisations actives** : compter les org distinctes, en incluant les assets sans org sous "Growthinnov"
- **Modif. aujourd'hui** : compter les assets du catalogue avec `last_modified_at` aujourd'hui (au lieu de chercher dans les versions vides)

### 2. Generer le graphique depuis `observatory_assets`

Le graphique 28 jours doit utiliser `created_at` des assets du catalogue (groupes par jour et par type) au lieu des versions vides. Cela donnera une courbe d'activite de creation.

### 3. Generer le fil d'activite depuis `observatory_assets`

Creer des entrees de timeline synthetiques a partir du catalogue : chaque asset genere une entree "a cree [type]" avec son `last_modified_by` et `created_at`. Fusionner avec les versions/logs existants (pour quand ils auront des donnees).

### 4. Corriger la matrice de couverture

Remplacer `if (!orgId) return` par un regroupement sous un ID synthetique "growthinnov" pour les assets sans `organization_id`. Afficher "Growthinnov" comme nom d'organisation dans la matrice.

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/hooks/useObservability.ts` | Refondre KPIs, chart, timeline et matrice sur `observatory_assets` |
| `src/pages/admin/AdminObservability.tsx` | Aucun changement (consomme deja les memos du hook) |
| `src/pages/admin/AdminObservabilityMatrix.tsx` | Aucun changement (consomme deja `coverageMatrix`) |

