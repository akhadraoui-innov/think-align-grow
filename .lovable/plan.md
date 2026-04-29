
## Diagnostic

Les images du **catalogue Formations** (`/portal/formations`) ne correspondent pas à celles affichées dans les **parcours détail** (`/portal/path/:id` et listes Academy admin/portal).

### Cause racine

Dans `src/pages/portal/PortalFormations.tsx`, la fonction `getCoverImage` (ligne 136) renvoie `cover_image_url` **brut** sans paramètre de cache-busting :

```ts
return (path as any).cover_image_url || STATIC_COVERS[path.id] || null;
```

Alors que toutes les autres surfaces (`AdminAcademyPaths`, `PortalAcademiePaths`) utilisent depuis v2.9.6 :
```ts
src={`${cover_image_url}?v=${new Date(updated_at || created_at).getTime()}`}
```

Conséquence : après régénération IA d'une couverture, le navigateur sert l'ancienne version mise en cache pour le catalogue, mais affiche la nouvelle dans le détail/admin → **images incohérentes**.

Vérifications faites :
- Les 8 parcours mappés dans `STATIC_COVERS` ont tous un `cover_image_url` IA en base ✅
- La query `select("*")` ramène bien `cover_image_url`, `updated_at`, `created_at` ✅
- La map `STATIC_COVERS` n'agit qu'en fallback (jamais déclenchée pour ces 8 parcours)

## Correction (1 seul fichier)

### `src/pages/portal/PortalFormations.tsx` ligne 136-138

Remplacer par :
```ts
const getCoverImage = (path: any): string | null => {
  const dbUrl = (path as any).cover_image_url;
  if (dbUrl) {
    const v = new Date(path.updated_at || path.created_at || Date.now()).getTime();
    return `${dbUrl}?v=${v}`;
  }
  return STATIC_COVERS[path.id] || null;
};
```

C'est strictement la même formule de cache-busting que `AdminAcademyPaths` et `PortalAcademiePaths`, garantissant la cohérence visuelle entre toutes les surfaces.

## Documentation associée

- Mettre à jour `docs/releases/v2.9.7-portal-admin-parity-audit.md` (ajout d'une note "Hotfix cache-busting catalogue Formations")
- Pas besoin de release dédiée : c'est un hotfix d'1 ligne du même périmètre que v2.9.6

## Hors scope

- La map `STATIC_COVERS` est conservée comme fallback de sécurité (utile si l'IA n'a jamais été générée pour un parcours)
- Pas de changement sur l'edge function `academy-generate`
- Pas de changement sur les autres pages (déjà conformes)
