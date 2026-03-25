

# Plan : Filtres avances pour Actifs Pedagogiques

## Objectif

Remplacer la barre de filtres actuelle (recherche + org uniquement) par une barre multi-filtres complete : Organisation, Type d'actif, Theme (parcours source). Supprimer les compteurs inutiles.

## Filtres a implementer

| Filtre | Source | Valeurs |
|--------|--------|---------|
| Organisation | `organizations` table | Toutes / Public / [liste orgs] |
| Type | Onglet actif (quiz/exercice/pratique) | Deja gere par les tabs — pas besoin d'un filtre supplementaire |
| Theme (Parcours) | `academy_paths.name` via jointure | Tous / [liste des parcours distincts] |
| Difficulte | `academy_paths.difficulty` ou `academy_practices.difficulty` | Tous / beginner / intermediate / advanced / expert |
| Mode de generation | `generation_mode` sur chaque table | Tous / manual / ai |

## Modification

**Fichier unique** : `src/pages/admin/AdminAcademyAssets.tsx`

### FilterBar enrichie

Ajouter 3 filtres Select supplementaires a cote de l'existant :
- **Parcours** : dropdown avec les noms de parcours distincts extraits des donnees chargees (pas de requete supplementaire — on deduit depuis `extractContext`)
- **Difficulte** : dropdown statique (beginner, intermediate, advanced, expert)
- **Mode** : dropdown statique (manual, ai)

Layout : barre flex-wrap avec les 4 filtres + recherche, style aligne sur le pattern admin existant.

### Logique de filtrage

Chaque tab (`QuizTab`, `ExercisesTab`, `PracticesTab`) recoit les nouveaux filtres en props et les applique dans le `.filter()` existant :
- `pathFilter` : compare `ctx.pathName` au filtre
- `difficultyFilter` : compare `item.difficulty` (practices) ou `path.difficulty` (quiz/exercises)
- `modeFilter` : compare `item.generation_mode`

### Collapsible detail (bonus)

Remplacer les View dialogs par des lignes expansibles : clic sur une ligne toggle un detail row avec le contenu complet (instructions, scenario, questions). State `expandedId` par tab.

### Edit → navigation

Le bouton Pencil navigue vers `/admin/academy/modules/:moduleId` au lieu d'ouvrir un dialog. Suppression des edit dialogs et de tout leur state.

## Section technique

```tsx
// FilterBar enrichie
<div className="flex flex-wrap items-center gap-3 mb-4">
  <Input ... /> {/* recherche */}
  <Select orgFilter ... />
  <Select pathFilter ... />  {/* noms de parcours distincts */}
  <Select difficultyFilter ... />  {/* beginner/intermediate/advanced/expert */}
  <Select modeFilter ... />  {/* manual/ai */}
</div>
```

Les parcours distincts sont calcules via `useMemo` sur les donnees deja chargees (quizzes + exercises + practices), en extrayant les `pathName` uniques depuis `extractContext`.

