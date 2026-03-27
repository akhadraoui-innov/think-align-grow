

# Diagnostic : Historique vide — Analyse des causes racines

## Problemes identifiés

### 1. Sessions standalone jamais sauvegardées
Dans `SimulatorSession.tsx` ligne 27 : `previewMode={!simConfig.practiceId}`. Si aucun `practiceId` n'est fourni, `previewMode=true` et le hook `useSimulatorSession` court-circuite toute persistence (ligne 30 : `if (previewMode || !user) return`). Les sessions lancées depuis le catalogue sans practice DB ne sont jamais enregistrées.

### 2. `practice_id` est UUID — incompatible avec `"__standalone__"`
La colonne `practice_id` de `academy_practice_sessions` est de type `uuid NOT NULL`. Le string `"__standalone__"` ne peut pas y etre inseré — l'insert Supabase echoue silencieusement.

### 3. Pas de navigation automatique vers le rapport
`SimulatorEngine.handleComplete` appelle `completeSession` mais n'utilise pas le `sessionId` retourné pour naviguer vers `/simulator/session/:id/report`. L'utilisateur reste sur ScoreReveal et doit cliquer manuellement.

## Plan de correction

### Bloc 1 — Permettre la persistence des sessions standalone

**`src/pages/SimulatorSession.tsx`** :
- Supprimer `previewMode={!simConfig.practiceId}` — toujours `false` pour un utilisateur connecté
- Garder `previewMode` uniquement pour le PracticeTestDialog admin

**`src/hooks/useSimulatorSession.ts`** :
- Accepter `practice_id` nullable : si pas de practice DB, insérer `practice_id = null`

**Migration SQL** :
- `ALTER TABLE academy_practice_sessions ALTER COLUMN practice_id DROP NOT NULL;`
- Rendre `practice_id` nullable pour supporter les sessions standalone

### Bloc 2 — Navigation automatique vers le rapport

**`src/components/simulator/SimulatorEngine.tsx`** :
- Injecter `useNavigate`
- Dans `handleComplete`, après `completeSession`, naviguer vers `/simulator/session/${returnedId}/report`
- Passer le `sessionId` retourné, pas celui du state (qui peut etre null au moment de l'insert)

### Bloc 3 — Historique : gérer les sessions sans practice

**`src/pages/SimulatorHistory.tsx`** :
- Adapter la query pour accepter `practice_id IS NULL`
- Afficher "Session libre" comme titre quand `practice` est null
- Grouper les sessions sans practice sous un groupe "Sessions libres"

### Bloc 4 — Rapport : gérer les sessions sans practice

**`src/pages/SimulatorReport.tsx`** :
- Utiliser `.maybeSingle()` au lieu de `.single()` pour la query practice (ligne 93)
- Fallback "Session de simulation" quand practice est null

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| Migration SQL | `practice_id` nullable |
| `src/pages/SimulatorSession.tsx` | Supprimer previewMode pour users connectés |
| `src/hooks/useSimulatorSession.ts` | Gérer practice_id nullable |
| `src/components/simulator/SimulatorEngine.tsx` | Navigation auto vers rapport |
| `src/pages/SimulatorHistory.tsx` | Support sessions sans practice |
| `src/pages/SimulatorReport.tsx` | `.maybeSingle()` + fallback |

## Ordre

1. Migration SQL (practice_id nullable)
2. useSimulatorSession (persistence nullable)
3. SimulatorSession (supprimer previewMode)
4. SimulatorEngine (navigation auto)
5. SimulatorHistory + SimulatorReport (fallbacks)

