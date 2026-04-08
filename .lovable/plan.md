

# Plan — Aligner le style des couvertures IA sur les 3 originales

## Approche

Les 3 images originales (Process Mining, Premiers Pas IA, Stratégie COMEX) sont toujours disponibles dans `src/assets/covers/`. On va les utiliser comme **référence visuelle directe** pour le modèle d'image IA en les envoyant comme exemple dans le prompt.

### Stratégie en 2 volets

#### 1. Réécrire le prompt dans `academy-generate/index.ts`

Le prompt actuel est trop verbeux et donne trop de liberté au modèle. On le remplace par un prompt court et directif qui reproduit le style observé des originales :

**Nouveau prompt de style** :
```
Professional e-learning course cover. Clean illustration with a single dominant color palette matching the topic. Soft gradient background transitioning between 2-3 harmonious colors. A few simple, recognizable flat icons or shapes related to the subject, well-spaced. Very clean composition, no clutter. Absolutely NO text, NO letters, NO words. Bright, optimistic, corporate feel. 16:9.
```

**Nouveau system prompt** :
```
You create short image prompts for course covers. Style: clean gradient background with 2-3 colors, few simple flat icons, lots of space, no text. Output ONLY the prompt.
```

Le changement clé : passer de "colorful isometric icons clearly representing the topic (e.g. gears for process, brain for AI)" (trop littéral, trop d'éléments) à "few simple flat icons, well-spaced, single dominant color palette" (suggestif, aéré).

#### 2. Régénérer les 9 couvertures

- Reset `cover_image_url = NULL` pour tous les parcours
- Appeler `generate-all-covers` pour régénérer avec le nouveau style
- Les 3 parcours originaux (Process Mining, Premiers Pas IA, Stratégie COMEX) conservent leurs images statiques en fallback dans `STATIC_COVERS` si le résultat IA ne convient toujours pas

## Fichier impacté

| Fichier | Action |
|---------|--------|
| `supabase/functions/academy-generate/index.ts` | Réécrire les prompts (lignes 1297-1301 et 1364-1368) |

## Après déploiement

1. Migration : `UPDATE academy_paths SET cover_image_url = NULL;`
2. Appel batch `generate-all-covers` pour les 9 parcours

