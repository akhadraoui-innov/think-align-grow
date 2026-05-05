## Objectif

Afficher les couvertures `academy_paths.cover_image_url` (mêmes images que le portail — même source DB, même bucket `academy-assets`) sur tous les écrans Academy côté app cabinet, **en miniature dans les cadres existants** sans modifier la densité actuelle, avec un traitement visuel adapté à l'identité orange/noir.

## Principe UX

- **Pas d'agrandissement** des cards : l'image s'inscrit dans la zone bandeau existante (`h-20`/`h-24`/`h-28` selon l'écran) en `object-cover`.
- **Identité cabinet** : overlay subtil noir 20% + ring orange au hover, badges noirs uppercase (au lieu des badges colorés du portail).
- **Fallback uniforme** : si pas de cover, on garde le dégradé difficulté + icône `GraduationCap` actuel — aucune génération auto à la volée (les covers se génèrent déjà via les flows existants côté admin).

## Écrans modifiés

1. **`src/pages/Academy.tsx`** (3 sections : en cours / recommandés / catalogue)
   - Bandeau : remplacer `<div bg-gradient>` par `<img cover_image_url object-cover>` + overlay `bg-gradient-to-t from-black/40` pour lisibilité des badges.
   - Section "en cours" : conserver la barre de progression `h-2` mais la passer **au-dessus** du bandeau image (top de la card), pour ne pas perdre le signal d'avancement.
   - Badges difficulté/Inscrit/Terminé : passer en `bg-black/80 text-white` uppercase tracking-wide pour rester dans l'identité serious game.

2. **`src/pages/AcademyDashboard.tsx`** (parcours en cours + terminés)
   - Ajouter une mini-vignette `h-12 w-16 rounded-md object-cover` à gauche du titre dans chaque ligne (pas de bandeau pleine largeur — le dashboard reste une liste compacte).

3. **`src/pages/AcademyPath.tsx`** (page détail)
   - Vérifier le hero : si `cover_image_url` existe, l'utiliser comme background du header (avec overlay noir pour lisibilité texte).

4. **`src/pages/AcademyCertificates.tsx`**
   - Mini-vignette identique au dashboard (h-12 w-16) dans la liste des certificats.

## Détails techniques

Pattern réutilisé (identique au portail pour cohérence cache) :
```tsx
<img
  src={`${path.cover_image_url}?v=${new Date(path.updated_at || path.created_at).getTime()}`}
  alt={path.name}
  loading="lazy"
  decoding="async"
  className="absolute inset-0 w-full h-full object-cover"
/>
<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
```

Container parent passe en `relative overflow-hidden` (déjà le cas via `overflow-hidden` sur les Cards).

Aucun changement DB, aucune nouvelle requête (`select *` ramène déjà `cover_image_url`, `updated_at`, `created_at`).

## Hors scope

- Génération de nouvelles covers pour les parcours qui n'en ont pas (déjà géré par `AdminAcademyPaths` + bouton batch existant).
- Refonte des cards / changement de densité.
- Modification des écrans portail.

## Fichiers modifiés

- `src/pages/Academy.tsx`
- `src/pages/AcademyDashboard.tsx`
- `src/pages/AcademyPath.tsx`
- `src/pages/AcademyCertificates.tsx`
