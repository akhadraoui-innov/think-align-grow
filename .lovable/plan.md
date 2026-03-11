

## Fix drag & drop between blocks (slots) in list mode

### Problem

In **list mode** (`SubjectCanvas` + `DropSlot`), dragging a card from one slot to another does not work properly. `DropSlot` receives `source-slot-id` and `source-response-id` from the drag data, but has no `onMoveToSlot` callback — so it either ignores the drop or creates a duplicate via `onDrop`.

In **board mode** (`ChallengeBoard` + `BoardZone`), `onMoveToSlot` is already wired correctly.

### Fix

**1. `DropSlot.tsx`** — Add `onMoveToSlot` prop. In `handleDrop`, when `sourceSlotId` and `sourceResponseId` are present and the source slot differs from the target, call `onMoveToSlot(sourceResponseId, slot.id, cardId)` instead of `onDrop`.

**2. `SubjectCanvas.tsx`** — Add `onMoveToSlot` to the interface and forward it to each `DropSlot`. Wire `handleSlotDrop` to handle both new drops and cross-slot moves.

### Files modified

| File | Change |
|------|--------|
| `src/components/challenge/DropSlot.tsx` | Add `onMoveToSlot` prop, use it in `handleDrop` for cross-slot drags |
| `src/components/challenge/SubjectCanvas.tsx` | Accept and forward `onMoveToSlot` to `DropSlot` |

