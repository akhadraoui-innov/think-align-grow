---
name: Academy path visuals AI
description: Pipeline de génération automatique de couverture pour academy_paths via academy-generate (Nano Banana 2)
type: feature
---

## Pipeline

- **Edge function** : `supabase/functions/academy-generate/index.ts`
- **Actions** :
  - `generate-cover` (un parcours, params: `path_id`)
  - `generate-all-covers` (batch sur tous les `cover_image_url IS NULL`)
- **Modèle image** : `google/gemini-3.1-flash-image-preview` (Nano Banana 2)
- **Modèle prompt** : `google/gemini-2.5-flash-lite` génère le prompt image à partir du nom + description du parcours

## Style imposé (constraint mémoire)

> Professional e-learning course cover. Clean illustration with a single dominant color palette matching the topic. Soft gradient background transitioning between 2-3 harmonious colors. A few simple, recognizable flat icons or shapes related to the subject, well-spaced. Very clean composition, no clutter. Absolutely NO text, NO letters, NO words. Bright, optimistic, corporate feel. 16:9.

Cohérent avec `mem://style/academy-path-visuals-standard` (covers sans texte).

## Storage

- Bucket : `academy-assets` (public en lecture depuis v2.9.4, écriture SaaS team only)
- Path : `covers/<path_id>.png`
- URL stockée : `<SUPABASE_URL>/storage/v1/object/public/academy-assets/covers/<path_id>.png` dans `academy_paths.cover_image_url`
- Upload `upsert: true` → idempotent

## Auto-trigger (depuis v2.9.5)

Dans `src/pages/admin/AdminAcademyPaths.tsx` :
- **Création manuelle** d'un parcours → `generate-cover` automatique (fire-and-forget)
- **Édition** → uniquement si `cover_image_url` est vide
- **Génération IA** (`generate-path`) → `generate-cover` automatique après réussite
- **Bannière contextuelle** "X parcours sans couverture" + bouton batch
- **Bouton single** par carte au survol pour regen manuelle (toujours dispo)

## Précautions

- L'EF `academy-generate` requiert un JWT utilisateur valide (pas d'appel anon)
- Le batch `generate-all-covers` peut consommer beaucoup de crédits IA (1 prompt + 1 image par parcours) — d'où le déclenchement manuel
- Les fichiers existent en storage même si l'URL en DB est vide → si on regen, l'`upsert` écrase
