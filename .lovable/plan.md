

# Corrections : Nom du createur + Dates

## Diagnostic

**Pourquoi "Utilisateur" au lieu de "Ammar Khadraoui" :**

La `profileMap` est indexee par `profiles.user_id` (`315af24d`). Or certains `created_by` dans `academy_paths` stockent `fe415f6a` qui est le `profiles.id` (et non `user_id`). Donc `profileMap.get("fe415f6a")` retourne `undefined` et le fallback "Utilisateur" s'affiche.

De plus, pour les quiz/exercise/practice, `last_modified_by` est NULL car le backfill via `snapshot->>'created_by'` a echoue (ces tables n'ont pas ce champ).

**Pourquoi les dates sont fausses :**

`last_modified_at` vaut `2026-03-25 13:44:32` pour TOUS les assets car c'est le `now()` du moment ou la migration de backfill a ete executee. La vraie date de derniere modification devrait etre `updated_at` ou `created_at` de la table source.

## Plan

### 1. Migration de donnees (INSERT tool)

**Backfill quiz/exercise/practice** via la hierarchie module → path :

```sql
UPDATE observatory_assets oa
SET last_modified_by = p.created_by,
    contributor_ids = ARRAY[p.created_by],
    contributor_count = 1
FROM academy_quizzes q
JOIN academy_modules m ON q.module_id = m.id
JOIN academy_path_modules pm ON m.id = pm.module_id
JOIN academy_paths p ON pm.path_id = p.id
WHERE oa.asset_type = 'quiz' AND oa.asset_id = q.id AND oa.last_modified_by IS NULL;
-- idem pour exercises et practices
```

**Corriger les dates** : remettre `last_modified_at` a la valeur reelle depuis le snapshot :

```sql
UPDATE observatory_assets
SET last_modified_at = COALESCE(
  (snapshot->>'updated_at')::timestamptz,
  (snapshot->>'created_at')::timestamptz,
  created_at
);
```

### 2. Double index dans profileMap (UI)

Le `profileMap` doit etre indexe aussi par `profiles.id` en plus de `profiles.user_id` pour gerer les deux formats de `created_by`.

**Fichier** : `src/hooks/useObservability.ts`

Modifier la query profiles pour inclure `id`, et construire la map avec deux cles :
```typescript
profiles.forEach(p => {
  map.set(p.user_id, p);
  map.set(p.id, p);  // aussi par profile.id
});
```

### 3. Supprimer les fallbacks ambigus

**Fichier** : `src/components/admin/catalogue/CatalogueTableView.tsx`

- Remplacer `"Utilisateur"` par le `display_name` ou `email` resolve depuis la double-cle
- Remplacer les initiales `"?"` par `"--"` en dernier recours

### 4. Corriger le trigger pour les futures insertions

**Fichier** : migration SQL

Mettre a jour `sync_observatory_asset()` pour utiliser `COALESCE(NEW.updated_at, NEW.created_at)` comme `last_modified_at` au lieu de `now()` lors de l'INSERT initial.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| SQL (insert tool) | Backfill creator via hierarchie + corriger dates |
| SQL (migration) | Mettre a jour `sync_observatory_asset()` pour dates correctes |
| `src/hooks/useObservability.ts` | Double-cle profileMap (user_id + id) |
| `src/components/admin/catalogue/CatalogueTableView.tsx` | Supprimer fallbacks "?" et "Utilisateur" |

