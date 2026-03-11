

## Audit : Workshop & Challenge pointent-ils sur le deck DB ?

### Resultat

**Workshop et Challenge utilisent bien la DB** — ils importent `useCards()`, `usePillars()`, `useToolkit()` depuis `useToolkitData.ts` qui requete les tables `toolkits`, `pillars`, `cards` via la base de donnees. Aucun des deux modules n'importe `mockCards.ts` ou `mockQuiz.ts`.

### Problemes identifies

| # | Probleme | Fichier | Impact |
|---|----------|---------|--------|
| 1 | **Slug hardcode** `TOOLKIT_SLUG = "bootstrap-in-business"` | `useToolkitData.ts:11` | Tous les modules (Explore, Workshop, Challenge, Lab, Plans) sont verrouilles sur un seul toolkit. Impossible d'utiliser un autre toolkit meme s'il est cree en admin. |
| 2 | **Fichiers mock inutilises** `mockCards.ts` (107 lignes) et `mockQuiz.ts` (104 lignes) | `src/data/` | Code mort — plus importe nulle part, mais reste dans le repo. |
| 3 | **Maps visuelles hardcodees** `PILLAR_ICON_MAP` et `PILLAR_GRADIENT_MAP` (10 entrees chacune) | `useToolkitData.ts:115-139` | Si un pilier a un slug different des 10 prevus, il obtient un fallback generique. Les piliers ont deja `color` et `icon_emoji` en DB — ces maps devraient en deriver. |
| 4 | **`PHASE_LABELS` hardcode** (4 entrees) | `useToolkitData.ts:150-155` | Les phases sont figees. Si un toolkit utilise d'autres phases, les labels seront manquants. |

### Ce qui n'est PAS prevu dans Sprint 5

Sprint 5 (plan.md) couvre uniquement **Facturation/abonnements** et **Logs/audit**. Aucun sprint ne prevoit :
- La suppression du slug hardcode
- Le nettoyage des fichiers mock
- La dynamisation des maps visuelles

### Plan d'implementation

**1. Supprimer le slug hardcode** — `useToolkitData.ts`
- Remplacer `TOOLKIT_SLUG` par un parametre dynamique : `useToolkit(slug?: string)` qui accepte un slug ou recupere le premier toolkit actif de l'organisation courante
- Pour l'instant (mono-toolkit), recuperer le premier toolkit `status = 'published'` au lieu d'un slug en dur
- Propager le changement dans les hooks dependants (`usePillars`, `useCards`, etc.) — aucun changement car ils dependent deja de `useToolkit()`

**2. Supprimer les fichiers mock** — `src/data/mockCards.ts`, `src/data/mockQuiz.ts`
- Suppression pure, aucune reference existante

**3. Dynamiser les maps visuelles** — `useToolkitData.ts`
- `getPillarGradient(slug)` : utiliser `pillar.color` de la DB avec fallback sur la map actuelle
- `getPillarIconName(slug)` : utiliser `pillar.icon_emoji` de la DB avec fallback
- Garder les maps comme fallback pour retrocompatibilite

**4. Mettre a jour plan.md** — ajouter ces taches comme "Sprint 4.2 - Nettoyage"

### Fichiers modifies

| Action | Fichier |
|--------|---------|
| Edit | `src/hooks/useToolkitData.ts` — slug dynamique + maps dynamiques |
| Delete | `src/data/mockCards.ts` |
| Delete | `src/data/mockQuiz.ts` |
| Edit | `.lovable/plan.md` — documenter Sprint 4.2 |

Aucune migration DB. Aucun changement dans Workshop/Challenge/Explore (ils consomment deja les hooks).

