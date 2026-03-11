

## Verification: Dynamic Toolkit Integration

### Status: All modules correctly use DB hooks

| Module | Hook chain | Verdict |
|--------|-----------|---------|
| **Explore** | `usePillars()` + `useCards()` via `useToolkit()` | DB-driven, no hardcoded data |
| **WorkshopRoom** | `useCards()` + `usePillars()` + `useToolkit()` + `useChallengeTemplates(toolkit?.id)` | DB-driven |
| **ChallengeRoom** | Same hook chain as WorkshopRoom | DB-driven |
| **ChallengeView** | Receives `cards` and `pillars` as props from parent | DB-driven |
| **Lab/Quiz** | `useQuizQuestions()` + `usePillars()` | DB-driven |
| **Plans** | `useGamePlans()` + `useGamePlanSteps()` | DB-driven |

### One gap found: `pillar.color` never passed through

All 10 call sites of `getPillarGradient(pillar.slug)` only pass the slug — none pass `pillar.color` as the second argument. The function supports it (`getPillarGradient(slug, dbColor?)`) but the DB value is always ignored, falling back to the hardcoded map.

**Affected files** (10 call sites):
- `Explore.tsx` (3 calls)
- `CardSidebar.tsx` (2 calls)
- `CanvasCard.tsx`, `CanvasStats.tsx`, `CardContextSheet.tsx`
- `GameCard.tsx`, `DropSlot.tsx`, `StagingZone.tsx`, `DraggableCard.tsx`

### Fix

Simple find-and-replace pattern across all files:
```
// Before
getPillarGradient(pillar.slug)

// After
getPillarGradient(pillar.slug, pillar.color)
```

Same for `getPillarIconName` — update calls to pass `pillar.icon_name`.

No other issues. No DB migration needed. No mock data remaining.

