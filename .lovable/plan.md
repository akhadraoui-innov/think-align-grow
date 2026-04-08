

# Plan — Améliorer la qualité des images de couverture générées par IA

## Problème

Le prompt actuel dans `generateCover` produit des images sombres, abstraites et peu lisibles (style "deep blues, purples, teals, abstract geometric shapes"). Les 3 images statiques précédentes (`src/assets/covers/`) étaient épurées, colorées, claires et thématiques — bien plus adaptées à des apprenants.

## Solution

Réécrire le prompt d'image pour obtenir un style cohérent avec les couvertures précédentes : fond clair ou pastel, illustrations flat/isométriques, couleurs vives et saturées, iconographie explicite du sujet, sans texte.

### Modifications dans `academy-generate/index.ts`

Remplacer le prompt de style dans les deux fonctions (`generateCover` et `generateAllCovers`) :

**Ancien style** :
> "modern gradient background (deep blues, purples, teals), abstract geometric shapes..."

**Nouveau style** :
> "Clean flat illustration style. Bright pastel background (soft white, light blue, or light peach). Colorful isometric or flat icons clearly representing the topic (e.g. gears for process, brain for AI, charts for strategy). Vibrant saturated colors (orange, teal, purple, coral). Professional corporate training aesthetic. NO text, NO letters, NO words in the image. Simple, modern, airy composition with plenty of white space. Suitable for e-learning platform aimed at business professionals. 16:9 aspect ratio."

### Régénérer les 9 couvertures

Après déploiement, appeler `generate-all-covers` pour écraser les images existantes avec le nouveau style. Les anciennes images statiques dans `src/assets/covers/` resteront comme fallback mais ne seront plus utilisées une fois les `cover_image_url` remplies.

## Fichier impacté

| Fichier | Action |
|---------|--------|
| `supabase/functions/academy-generate/index.ts` | Réécrire les prompts de style (lignes 1298-1303 et 1364-1369) |

## Après déploiement

Appeler `generate-all-covers` pour régénérer toutes les couvertures avec le nouveau style épuré et coloré.

