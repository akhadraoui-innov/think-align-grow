

# Plan — Livret de cours complet, lecture pleine page, et évaluation finale du parcours

## Analyse des demandes

1. **Le guide actuel est une fiche technique** (structure du parcours, compétences, objectifs). L'utilisateur veut un **livret de restitution complet** : tout le contenu pédagogique documenté, illustré, annoté — comme un livre de cours que le formateur donnerait.
2. **Ouverture en mode lecture pleine page** (pas dans une card inline) — expérience "livre premium".
3. **Évaluation finale globale du parcours** visible comme une section dédiée après les étapes du programme (pas cachée dans un module).

## Changements

### 1. Nouvelle page `/portal/guide/:pathId` — Lecture en mode livre

Créer `src/pages/portal/PortalGuideReader.tsx` : une page pleine largeur dédiée à la lecture du livret.

- Layout : fond blanc pur, `max-w-4xl`, `prose prose-lg` avec typographie magazine
- Header : titre du parcours, metadata (durée, niveau, fonction), bouton retour, bouton "Recevoir par email"
- Body : rendu `EnrichedMarkdown` du contenu du livret
- Si le livret n'existe pas encore : bouton "Générer le livret" centré avec loading state
- Route : `/portal/guide/:pathId` dans `App.tsx`

### 2. Enrichir le prompt de `academy-path-document` — Livret complet (pas fiche technique)

Le prompt actuel génère une fiche technique (couverture, objectifs, programme, évaluation). Il faut le transformer en **livret de cours complet** :

- Inclure le **contenu réel de chaque module** (leçons, quiz, exercices) en chargeant `academy_contents` pour chaque module
- Structure du livret :
  1. Couverture (titre, sous-titre, cible, durée)
  2. Introduction et enjeux
  3. **Pour chaque module** : chapitre complet avec le contenu rédigé, les exercices, les points clés annotés, les illustrations conceptuelles
  4. Référentiel de compétences
  5. Glossaire et ressources
- Augmenter `max_tokens` à 12000 (livret de 8-15 pages)
- Le livret est un document de **restitution** du contenu, pas un résumé

### 3. Section "Évaluation finale" sur la page parcours `PortalFormationsPath.tsx`

Après la section "Programme" (syllabus), ajouter une section visible uniquement quand `progressPct === 100` :

- Card "Évaluation finale du parcours" avec design premium (gradient emerald, border-l-4)
- Auto-génération via `academy-tutor` action `debrief` mode `evaluation` avec `module_id = null` et `path_id` (évaluation globale du parcours, pas d'un module)
- Persisté dans `academy_paths.guide_document.path_evaluation` ou dans une colonne séparée sur `academy_enrollments`
- Contenu : synthèse de tous les scores par module, maîtrise globale, points forts, axes d'amélioration, recommandations
- Rendu avec `EnrichedMarkdown` + executive card style

### 4. Modifier `GuideSection` → lien vers page lecture

Le composant `GuideSection` ne montre plus le contenu inline. Il devient un lien vers la page de lecture :
- Affiche le titre "Livret de cours complet"
- Bouton "Consulter le livret" → `navigate(/portal/guide/${pathId})`
- Bouton "Recevoir par email" reste
- Si pas encore généré : bouton "Générer le livret"

### 5. Enrichir `academy-tutor` — Mode évaluation parcours (pas module)

Ajouter une branche dans `handleDebrief` quand `module_id` est null mais `path_id` est fourni :
- Charger tous les `academy_progress` de l'enrollment
- Agréger scores, metadata, quiz_answers de tous les modules
- Prompt : "Rédige une évaluation finale complète du parcours {path.name} pour {firstName}. Couvre : synthèse globale, score par module, compétences acquises, points forts, axes d'amélioration, recommandations pour la suite professionnelle."

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/pages/portal/PortalGuideReader.tsx` | Créer — page lecture pleine page |
| `src/App.tsx` | Ajouter route `/portal/guide/:pathId` |
| `src/components/academy/GuideSection.tsx` | Modifier — lien vers page lecture au lieu de contenu inline |
| `supabase/functions/academy-path-document/index.ts` | Enrichir — charger contenu modules, prompt livret complet |
| `src/pages/portal/PortalFormationsPath.tsx` | Ajouter section évaluation finale après Programme |
| `supabase/functions/academy-tutor/index.ts` | Enrichir — mode évaluation parcours global (module_id null) |

## Ordre d'exécution

1. Enrichir `academy-tutor` (évaluation parcours global)
2. Enrichir `academy-path-document` (livret complet avec contenu)
3. Créer `PortalGuideReader.tsx` (page lecture mode livre)
4. Ajouter route dans `App.tsx`
5. Modifier `GuideSection.tsx` (lien vers page)
6. Ajouter section évaluation finale dans `PortalFormationsPath.tsx`

