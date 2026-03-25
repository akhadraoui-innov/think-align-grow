

# P2 : Tags transversaux + Statistiques d'utilisation

## 1. Migration DB — Ajouter `tags text[]` sur les 3 tables

```sql
ALTER TABLE academy_quizzes ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE academy_exercises ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE academy_practices ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
```

## 2. Statistiques d'utilisation

Ajouter un hook `useAssetStats` qui requete `academy_progress` groupe par `module_id` pour obtenir :
- Nombre de tentatives
- Taux de completion
- Score moyen

Afficher ces stats dans le `DetailRow` de chaque actif + badges "Populaire" (>10 tentatives) et "Nouveau" (<7 jours) dans la ligne du tableau.

## 3. UI — Filtre Tags + Edition inline

**FilterBar** : Ajouter un filtre multi-tag (simple Select pour v1 — "Tous" ou un tag specifique). Les tags disponibles sont derives dynamiquement des donnees chargees.

**DetailRow** : Ajouter une section "Tags" editable avec des badges cliquables + input pour ajouter un tag. Mutation `updateTags` sur la table correspondante.

**applyFilters** : Ajouter `matchTags` dans la logique de filtrage.

## 4. Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| Migration SQL | 3 colonnes `tags text[]` |
| `AdminAcademyAssets.tsx` | Hook stats, filtre tags, badges Populaire/Nouveau, edition tags inline dans DetailRow |

