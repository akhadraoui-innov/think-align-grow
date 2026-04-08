

# Plan — Images de couverture pour les parcours (Admin + IA auto-gen)

## Diagnostic

- 9 parcours en DB, **0** avec `cover_image_url` rempli (tous `null`)
- 3 images statiques existent en `src/assets/covers/` pour 3 parcours spécifiques (Process Mining, Premiers Pas IA, Stratégie COMEX) — utilisées uniquement côté portail formations via `STATIC_COVERS`
- L'admin (`AdminAcademyPaths.tsx` et `PortalAcademiePaths.tsx`) n'affiche **aucune image** — cards = texte pur avec `border-l-4`
- Edge function `academy-generate` a déjà un pipeline d'image IA fonctionnel (`generate-illustrations`) utilisant `google/gemini-3.1-flash-image-preview` + stockage `academy-assets`

## Plan en 3 parties

### 1. Ajouter l'action `generate-cover` dans l'edge function `academy-generate`

Nouvelle branche dans le routeur qui :
- Prend `path_id` en entrée
- Lit le nom + description du parcours
- Génère un prompt de couverture via le modèle texte (style "corporate training visual, gradient background, thematic icons")
- Appelle `gemini-3.1-flash-image-preview` pour générer l'image
- Upload dans le bucket `academy-assets` sous `covers/{path_id}.png`
- Met à jour `academy_paths.cover_image_url` avec l'URL publique
- Retourne l'URL

Ajout aussi d'un batch `generate-all-covers` qui itère sur tous les parcours sans `cover_image_url`.

### 2. Modifier les cards dans `AdminAcademyPaths.tsx` et `PortalAcademiePaths.tsx`

Cards enrichies avec zone image (même design que `PortalFormations.tsx`) :

```text
┌──────────────────────────────┐
│  ┌────────────────────────┐  │
│  │   COVER IMAGE          │  │  ← 140px, cover_image_url ou gradient
│  │   ou gradient+icône    │  │
│  └────────────────────────┘  │
│  Statut · Difficulté · 🏆   │
│  Titre du parcours           │
│  Description...              │
│  📎 Fonction  👤 Persona     │
│  ──────────────────────────  │
│  📖 5 modules  ⏱ 8h     ✏️🗑│
└──────────────────────────────┘
```

- Si `cover_image_url` existe → `<img>` avec `object-cover`
- Sinon → gradient dynamique par difficulté + icône `GraduationCap`
- Hauteur fixe de card pour homogénéité

### 3. Ajouter la génération IA dans le dialog de création/édition

- Dans le dialog Create/Edit : bouton "🎨 Générer la couverture" à côté du titre
- Appelle `academy-generate` avec `action: "generate-cover"` et le `path_id` (donc disponible seulement en édition, ou déclenché après la création)
- Affiche un preview de l'image dans le dialog
- Dans le header de la page : bouton "🖼️ Générer toutes les couvertures" qui lance le batch pour les parcours sans image

### 4. Générer immédiatement les 9 couvertures manquantes

Après déploiement de la fonction, lancer le batch `generate-all-covers` via un appel pour peupler les images existantes.

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `supabase/functions/academy-generate/index.ts` | Ajouter branches `generate-cover` et `generate-all-covers` |
| `src/pages/admin/AdminAcademyPaths.tsx` | Cards avec zone image + boutons gen cover |
| `src/pages/portal/PortalAcademiePaths.tsx` | Cards avec zone image + boutons gen cover |

## Ordre : 1 (edge function) → 2 (UI cards) → 3 (boutons IA) → 4 (batch gen)

