## Problème

Les couvertures Academy générées récemment sont basiques (icône + gradient plat = image 2), alors que les premières étaient riches et professionnelles (rendus 3D / isométriques / illustrations éditoriales = image 1). Deux causes :

1. **Prompt appauvri** dans `supabase/functions/academy-generate/index.ts` (`generateCover` + `generateAllCovers`) :
   > "Clean illustration with a single dominant color palette ... A few simple, recognizable flat icons or shapes related to the subject ... Very clean composition, no clutter."
   → Ce style produit littéralement les visuels "icône centrée sur gradient" qu'on voit dans l'image 2.

2. **Bouton regen invisible si l'image existe déjà** : dans `AdminAcademyPaths.tsx` (ligne 435), le bouton `ImageIcon` (regen) est rendu sous `{!p.cover_image_url && ...}` → on ne peut PAS regénérer une image jugée moche, seulement combler une absence.

## Plan

### 1. Restaurer un style "pro" cohérent avec les anciennes covers

Dans `supabase/functions/academy-generate/index.ts`, remplacer le prompt `newStyle` (utilisé dans `generateCover`, `generateAllCovers`, et la version équivalente ligne 1082) par un brief riche, ex :

> "Premium e-learning course cover, editorial corporate illustration. Rich, detailed scene combining isometric 3D elements, modern flat-vector business icons (charts, devices, abstract data, people silhouettes) related to the topic. Cinematic lighting, depth, soft glows, vibrant but harmonious color palette (2-4 colors with one strong accent matching the topic), subtle gradients, layered composition with foreground/background. Professional Behance/Dribbble quality. 16:9 wide, no text, no letters, no watermark."

- Conserver l'instruction "no text" (mémoire `mem://style/academy-path-visuals-standard`).
- Mémoriser ce brief dans `.lovable/memory/features/academy/path-visuals-ai.md` pour figer la cohérence.
- Optionnel mais recommandé : passer le modèle prompt-writer de `gemini-2.5-flash-lite` à `gemini-2.5-flash` pour des prompts image plus riches.

### 2. Bouton "Regénérer la couverture" toujours accessible

Dans `src/pages/admin/AdminAcademyPaths.tsx` :
- Retirer la condition `!p.cover_image_url` autour du bouton regen ligne 435 → le bouton apparaît au hover sur **toutes** les cartes.
- Changer son tooltip / icône en `RefreshCw` (lucide) si une cover existe déjà, sinon garder `ImageIcon`.
- Adapter `generateSingleCover` pour afficher "Régénération…" / "Couverture régénérée !" quand une image existait déjà.

### 3. Légère amélioration UX

- Ajouter un état "loading par carte" (`Set<string>` d'IDs en cours) pour griser uniquement la carte concernée pendant la regen, plutôt qu'un toast global.
- Forcer le refresh visuel après regen en bustant le cache navigateur : `<img src={url + '?v=' + updated_at}>` ou recharger via `qc.invalidateQueries`.

### 4. Release notes

Créer `docs/releases/v2.9.6-academy-cover-quality-regen.md` documentant :
- Restauration du style premium (illustration éditoriale riche vs icône-flat).
- Bouton regen disponible en permanence.
- Mise à jour mémoire `path-visuals-ai`.

## Hors périmètre

- Pas de regen automatique de masse des covers existantes (consommation crédits + l'utilisateur décide cover par cover via le nouveau bouton).
- Pas de champ "brief image custom" (toujours dans le backlog v2.9.5).
