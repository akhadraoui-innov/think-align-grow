

# Audit complet — Workspace Apprenant Academy

## Etat actuel du code

Le workspace 2 panneaux (sidebar + contenu principal) et la refonte ChatGPT-like de la Pratique IA sont en place. Voici les problemes identifies par fichier.

---

## Bugs critiques

| # | Probleme | Fichier | Cause |
|---|----------|---------|-------|
| B1 | **Double header** : AppShell affiche son header (SidebarTrigger + breadcrumb, h-12) AU-DESSUS du top bar du module (h-~44px). 2 barres empilees = ~96px perdus. | `AppShell.tsx` | `/academy/module/:id` n'est pas exclu du layout desktop comme `/workshop/:id` ou `/admin` |
| B2 | **Breadcrumb incorrect** : affiche "Hack & Show" au lieu de "Academy" car la route `/academy/module/xxx` n'est pas dans le `map` du breadcrumb | `AppShell.tsx` l.77-85 | Map ne contient que des routes statiques |
| B3 | **Evaluation overlay deborde** : l'overlay Practice utilise `absolute inset-0` mais le parent `div.flex.flex-col.h-full` n'a pas `relative` | `AcademyPractice.tsx` l.202 | Parent manque `position: relative` |
| B4 | **Console warning forwardRef** : `PageTransition` est un function component sans `forwardRef`, utilise dans `AnimatePresence` qui tente de passer un ref | `PageTransition.tsx` | Pas de `forwardRef` |
| B5 | **Score "%" vide dans sidebar** : quand `score` est null, le code l.246-248 affiche quand meme `%` car le check `!= null` est correct mais le rendu est a l'interieur du block `status === "completed"` — or un module peut etre completed avec score=null (lessons) | `AcademyModule.tsx` l.244-249 | Le check est correct, mais le bloc parent `status === "completed"` s'affiche et le `<div className="shrink-0">` est rendu vide |

## Problemes UX / Navigation

| # | Probleme | Impact |
|---|----------|--------|
| U1 | **Pas de bouton "Terminer la session"** dans Practice avant `maxExchanges` | Apprenant piege dans la conversation |
| U2 | **Locking trop strict** : `getModuleStatus` verifie seulement le module precedent immédiat. Si un module intermediaire n'a pas de record progress, les suivants sont locks meme si l'apprenant a progresse plus loin | Navigation bloquee injustement |
| U3 | **Quiz/Exercise sans max-width** : rendus dans `p-6 md:p-8` sans `max-w-3xl mx-auto`, contrairement aux lessons. Sur grand ecran, le contenu s'etale | Incoherence visuelle |
| U4 | **Exercise textarea en `font-mono`** (l.240) : l'apprenant redige du texte libre, pas du code | Experience de redaction degradee |
| U5 | **Pas de transition entre modules** : navigation = full re-mount sans animation de fade | Experience saccadee |
| U6 | **Sidebar items en `text-xs`** (l.235) : titres de modules trop petits pour scanner | Lisibilite insuffisante |
| U7 | **Progress dots quasi invisibles** : h-1.5 et w-1.5 avec gap-0.5 (l.394-404) | Difficiles a voir |
| U8 | **Mobile** : double systeme sidebar (AppShell sidebar + module sidebar Sheet) potentiellement en conflit | UX confuse |

## Plan de corrections

### Vague A — Corrections critiques

1. **`AppShell.tsx`** : Ajouter `const isAcademyModule = location.pathname.startsWith("/academy/module/")` et l'inclure dans la condition d'exclusion du shell (comme workshop room). Ajouter `/academy` dans le breadcrumb map.

2. **`AcademyPractice.tsx`** : Ajouter `relative` au div parent (l.202). Ajouter un bouton "Terminer la session" dans le header quand `exchangeCount >= 3 && !isFinished`.

3. **`AcademyModule.tsx`** :
   - Fix score vide : ne rendre le `<div className="shrink-0">` que si `score != null`
   - Wrapper quiz/exercise dans `max-w-3xl mx-auto`
   - Ameliorer locking : un module est "available" si TOUS les modules precedents sont completed (pas juste l'immediat)
   - Sidebar items : `text-xs` → `text-sm` pour les titres
   - Progress dots : `h-1.5` → `h-2`, `w-1.5` → `w-2`

4. **`AcademyExercise.tsx`** : Retirer `font-mono` du textarea (l.240)

5. **`PageTransition.tsx`** : Ajouter `React.forwardRef` pour eliminer le warning console

### Vague B — Polish UX

6. **Transition entre modules** : Ajouter une animation `key={id}` sur le contenu avec `AnimatePresence` + fade in/out quand `id` change

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/components/layout/AppShell.tsx` | Exclure `/academy/module/` du shell, fix breadcrumb |
| `src/pages/AcademyModule.tsx` | Fix score, max-width wrapper, locking, sidebar sizing, dots, transition |
| `src/components/academy/AcademyPractice.tsx` | Fix overlay relative, bouton terminer session |
| `src/components/academy/AcademyExercise.tsx` | Retirer font-mono |
| `src/components/ui/PageTransition.tsx` | Ajouter forwardRef |

