---
name: Academy path visuals AI
description: Pipeline de génération auto de couverture premium (Nano Banana 2) pour academy_paths via academy-generate
type: feature
---

## Pipeline

- **Edge function** : `supabase/functions/academy-generate/index.ts`
- **Actions** :
  - `generate-cover` (un parcours, params: `path_id`)
  - `generate-all-covers` (batch sur tous les `cover_image_url IS NULL`)
- **Modèle image** : `google/gemini-3.1-flash-image-preview` (Nano Banana 2)
- **Modèle prompt** (depuis v2.9.6) : `google/gemini-2.5-flash` (avant : `flash-lite`, prompts trop courts → covers basiques)

## Style imposé (v2.9.6 — premium editorial)

> Premium e-learning course cover, editorial corporate illustration of Behance/Dribbble quality. Rich, detailed scene combining isometric 3D elements and modern flat-vector business iconography (charts, devices, abstract data flows, silhouettes, tools) directly related to the topic. Cinematic lighting with soft glows and depth, layered foreground/background composition, vibrant but harmonious palette of 2-4 colors with one strong topic-driven accent, subtle gradients, polished shadows. Wide 16:9 aspect, professional and aspirational mood. Absolutely NO text, NO letters, NO words, NO watermark, NO logo.

**Régression à éviter** : ne JAMAIS revenir au style "single icon on flat gradient" (v2.9.4/v2.9.5) qui produisait des visuels pauvres type icône centrée. Le brief doit toujours décrire une scène riche, pas un wallpaper minimaliste.

Cohérent avec `mem://style/academy-path-visuals-standard` (covers sans texte).

## Storage

- Bucket : `academy-assets` (public en lecture depuis v2.9.4, écriture SaaS team only)
- Path : `covers/<path_id>.png`
- URL stockée : `<SUPABASE_URL>/storage/v1/object/public/academy-assets/covers/<path_id>.png` dans `academy_paths.cover_image_url`
- Upload `upsert: true` → idempotent. Côté UI, ajouter `?v=<updated_at>` à l'`<img src>` pour buster le cache navigateur après regen.

## Auto-trigger (depuis v2.9.5)

Dans `src/pages/admin/AdminAcademyPaths.tsx` :
- **Création manuelle** d'un parcours → `generate-cover` automatique (fire-and-forget)
- **Édition** → uniquement si `cover_image_url` est vide
- **Génération IA** (`generate-path`) → `generate-cover` automatique après réussite
- **Bannière contextuelle** "X parcours sans couverture" + bouton batch
- **Bouton single** par carte (depuis v2.9.6) **TOUJOURS visible au hover**, même si une cover existe → permet la régénération à la demande

## Précautions

- L'EF `academy-generate` requiert un JWT utilisateur valide (pas d'appel anon)
- Le batch `generate-all-covers` peut consommer beaucoup de crédits IA — d'où le déclenchement manuel
- En cas de 429/402, l'EF renvoie `200 { fallback: true, error_code, message }` → le client affiche un toast warning sans casser l'UX
