

## Audit - Challenge & Design Innovation: End-to-End Issues

### Critical Bug 1: ChallengeRoom uses WRONG template

**File**: `src/pages/ChallengeRoom.tsx` (lines 33, 39-43, 132)

The ChallengeRoom completely ignores `workshop.config.template_id`. Instead it:
1. Calls `useToolkit()` with no args → gets the **first published toolkit** (arbitrary)
2. Calls `useChallengeTemplates(toolkit?.id)` → gets templates for that ONE toolkit only
3. Auto-selects the **first** template from the list (line 40-43)

This means: no matter which challenge template the user chose when creating the session, the room always displays the first template of the first published toolkit. This is the primary reason new challenges "don't work".

**Fix**: Read `workshop.config.template_id` directly and fetch that specific template + its structure. Remove `useToolkit()` and the broken auto-select logic.

### Critical Bug 2: ChallengeRoom fetches cards from wrong toolkit

**File**: `src/pages/ChallengeRoom.tsx` (lines 31-32)

`useCards()` and `usePillars()` are also scoped to the first published toolkit (via `useToolkit()`). If the challenge uses cards from a different toolkit, the drag-and-drop board will show wrong cards or no cards at all.

**Fix**: Once we have the correct `template_id`, derive the `toolkit_id` from the template and pass it to `useCards(toolkitId)` and `usePillars(toolkitId)`.

### Bug 3: Toolkit selection "reverts" in ChallengeInfoTab

**File**: `src/components/admin/ChallengeInfoTab.tsx`

The `useEffect` (line 32-40) resets the form from `template` prop on every re-render. After `handleSave` → `onUpdate()` → `invalidateAll()`, React Query refetches and the component re-renders with fresh data. If the update actually persisted, it should show the new value. Two possible sub-causes:
- The update silently fails due to RLS (unlikely for saas_team)
- The `useEffect` dependency `[template]` fires on every object reference change, resetting in-flight form state

**Fix**: Use a stable comparison (e.g. `template.id + template.toolkit_id`) as the useEffect dependency, or use a `lastSavedRef` to avoid resetting after save.

### Bug 4: Single toolkit_id column (no multi-toolkit support)

**Schema**: `challenge_templates.toolkit_id` is a single UUID column (NOT NULL).

The user expects to associate multiple toolkits per challenge template. This requires:
1. New junction table `challenge_template_toolkits`
2. Migrate existing `toolkit_id` data
3. Keep `toolkit_id` as "primary toolkit" for backward compatibility (RLS, card loading)
4. Multi-select UI in ChallengeInfoTab and creation wizard
5. Update `/challenge` page filtering to match templates where ANY linked toolkit is active for the org

### Bug 5: RLS cascade blocks visibility

RLS on `challenge_subjects`, `challenge_slots` requires `toolkits.status = 'published'`. If a template's toolkit is `draft`, the challenge room will load but subjects/slots return empty — a silent failure with no error message.

---

## Implementation Plan

### Step 1: Fix ChallengeRoom template resolution (highest priority)

In `ChallengeRoom.tsx`:
- Extract `template_id` from `workshop?.config?.template_id`
- Fetch the specific template: `useChallengeTemplates()` then find by id, OR create a dedicated `useChallengeTemplate(id)` hook
- Derive `toolkit_id` from the resolved template
- Pass that `toolkit_id` to `useCards(toolkitId)` and `usePillars(toolkitId)` (requires updating these hooks to accept an optional toolkit ID override)
- Remove the broken `selectedTemplateId` state and auto-select useEffect

### Step 2: Update useToolkitData hooks to accept toolkit ID

In `src/hooks/useToolkitData.ts`:
- `useCards(toolkitId?)` and `usePillars(toolkitId?)` — if a toolkitId is passed, fetch cards/pillars for that specific toolkit instead of the default first-published one

### Step 3: Fix ChallengeInfoTab toolkit update persistence

In `ChallengeInfoTab.tsx`:
- Change useEffect dependency from `[template]` to `[template.id]` or a serialized key
- Add optimistic UI: after save success, don't re-trigger form reset until the refetched data arrives with the new value

### Step 4: Create multi-toolkit junction table

Database migration:
```sql
CREATE TABLE challenge_template_toolkits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES challenge_templates(id) ON DELETE CASCADE,
  toolkit_id uuid NOT NULL REFERENCES toolkits(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_id, toolkit_id)
);

ALTER TABLE challenge_template_toolkits ENABLE ROW LEVEL SECURITY;

-- Saas team full access
CREATE POLICY "Saas team can manage" ON challenge_template_toolkits
  FOR ALL TO authenticated USING (is_saas_team(auth.uid()))
  WITH CHECK (is_saas_team(auth.uid()));

-- Authenticated can view if at least one toolkit is published
CREATE POLICY "View via published toolkit" ON challenge_template_toolkits
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM toolkits t WHERE t.id = toolkit_id AND t.status = 'published')
  );

-- Migrate existing data
INSERT INTO challenge_template_toolkits (template_id, toolkit_id)
SELECT id, toolkit_id FROM challenge_templates;
```

### Step 5: Multi-select UI in admin

- **ChallengeInfoTab**: Replace single `Select` with a multi-select (checkbox list or badge toggle). On save, upsert rows in `challenge_template_toolkits`. Keep `toolkit_id` column synced to the first selected toolkit (backward compat).
- **AdminDesignInnovation creation wizard**: Allow selecting multiple toolkits in the Configuration step.
- **AdminDesignInnovation list**: Show all associated toolkit names/emojis, not just one.

### Step 6: Update /challenge filtering for multi-toolkit

In `useOrgChallengeTemplates`:
- Query `challenge_template_toolkits` joined with `organization_toolkits` to find templates where at least one linked toolkit is active for the org
- Fallback: also check `challenge_templates.toolkit_id` for templates not yet migrated

### Step 7: Add toolkit status indicator in admin list

In `AdminDesignInnovation.tsx`:
- Show a badge (published/draft) next to each toolkit name so admins immediately see why a challenge might be invisible to users.

### Files impacted
- `src/pages/ChallengeRoom.tsx` — fix template resolution (Step 1)
- `src/hooks/useToolkitData.ts` — parameterize cards/pillars by toolkit (Step 2)
- `src/components/admin/ChallengeInfoTab.tsx` — fix useEffect + multi-select (Steps 3, 5)
- `src/hooks/useChallengeData.ts` — org filtering via junction table (Step 6)
- `src/pages/admin/AdminDesignInnovation.tsx` — multi-toolkit in creation + status badge (Steps 5, 7)
- `src/hooks/useAdminChallenges.ts` — join junction table in queries (Step 5)
- Database migration for junction table (Step 4)

