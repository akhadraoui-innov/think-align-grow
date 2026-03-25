

# Sous-menu "Catalogue des Assets" dans Observabilité

## Objectif

Ajouter une 5e section sous la matrice de couverture : un tableau listant chaque asset unique (dédupliqué par `asset_id`) avec des KPIs en ligne et un collapse montrant l'historique complet de versioning + utilisation.

## Architecture des données

Les données existent déjà dans le hook `useObservability` via `versionsQuery.data`. On agrège par `asset_id` :

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Type │ Nom (snapshot.name) │ Org │ Versions │ Contributeurs │ Last │
├─────────────────────────────────────────────────────────────────────┤
│ ▶ Parcours  │ Onboarding RH     │ Acme  │ 12 │ 3 │ il y a 2h    │
│   └─ v12  2h ago  "status, difficulty"  par Jean Dupont           │
│   └─ v11  3j ago  "name, description"   par Marie Martin          │
│   └─ ...                                                           │
├─────────────────────────────────────────────────────────────────────┤
│ ▶ Quiz      │ Quiz Sécurité     │ Beta  │  5 │ 2 │ il y a 1j    │
└─────────────────────────────────────────────────────────────────────┘
```

## Modifications

### 1. `src/hooks/useObservability.ts`

Ajouter un `useMemo` `assetCatalogue` qui :
- Groupe toutes les versions par `asset_id`
- Pour chaque asset, calcule : nom (du dernier snapshot), type, org, nombre de versions, set de contributeurs distincts, date de dernière modification, date de création (plus ancienne version)
- Trie par dernière modification descendante
- Expose aussi la liste complète des versions par asset pour le collapse

### 2. `src/pages/admin/AdminObservability.tsx`

Ajouter une section "Catalogue des Assets" après la matrice :
- Tableau avec colonnes : Type (badge coloré), Nom, Organisation, Nb versions, Nb contributeurs, Dernière modif, Créé le
- Chaque ligne est un `Collapsible` : au clic, déplie la timeline verticale de toutes les versions (version_number, date, change_summary, contributeur avec avatar)
- Filtres globaux déjà en place s'appliquent (type, org, période)
- Recherche textuelle sur le nom de l'asset

### Fichiers modifiés

| Fichier | Action |
|---------|--------|
| `src/hooks/useObservability.ts` | Ajouter `assetCatalogue` computed + l'exposer |
| `src/pages/admin/AdminObservability.tsx` | Ajouter section Catalogue avec table collapsible |

