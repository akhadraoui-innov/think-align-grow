## Problème

Le bouton "Régénérer la couverture" a été ajouté en v2.9.6 dans `src/pages/admin/AdminAcademyPaths.tsx`, mais le portail apprenant utilise un **fichier dupliqué** : `src/pages/portal/PortalAcademiePaths.tsx` (cf. mémoire `technical/portal-architecture-duplication`). Ce fichier a encore l'ancienne logique :

```tsx
{!p.cover_image_url && (
  <Button ... onClick={(e) => generateSingleCover(p.id, e)}>
    <ImageIcon ... />
  </Button>
)}
```

→ aucun bouton regen au hover sur les cartes ayant déjà une cover (ce que l'utilisateur observe sur `/portal/academie/paths`).

## Plan

Aligner `PortalAcademiePaths.tsx` sur `AdminAcademyPaths.tsx` (v2.9.6) :

1. **Bouton regen permanent** : retirer la condition `!p.cover_image_url`, tooltip dynamique "Régénérer la couverture" / "Générer la couverture".
2. **`generateSingleCover` enrichi** : détection regen vs first-gen, toast `loading` persistant, gestion soft du fallback 429/402.
3. **Cache-busting `<img>`** : `?v=<updated_at>` pour forcer le rechargement après regen.

## Hors périmètre

- Pas de refonte de la duplication portail/admin (sujet déjà tracé en mémoire).
- Pas de modifications côté edge function (le style premium v2.9.6 est déjà partagé).

## Release notes

Compléter `docs/releases/v2.9.6-academy-cover-quality-regen.md` en mentionnant que le patch couvre désormais **les deux surfaces** (admin + portail).
