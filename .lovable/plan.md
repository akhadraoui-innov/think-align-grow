

# Plan — Fix data sync, totals consistency, and corporate document rendering

## Problems identified

1. **Data not updating on save/regenerate**: `AdminQuotePreview` receives data via `navigate({ state })` — a frozen snapshot. When regenerating or editing, `state.totals` and `state.generatePayload` remain the original values. Changes never flow back.

2. **Totals mismatch between sidebar and document**: The sidebar reads `state.totals` (frozen), while the AI-generated markdown may compute different numbers. After regeneration, the sidebar still shows old totals.

3. **Document not corporate enough**: Basic `prose prose-sm` wrapper with minimal styling. No letterhead, no visual hierarchy, no professional framing.

## Solution

### 1. Load quote from DB instead of frozen state

Refactor `AdminQuotePreview.tsx` to:
- Accept only the quote `id` via route params or navigation state
- Fetch the full quote record from `business_quotes` on mount
- Rebuild `totals` and `generatePayload` from the stored config fields (`role_configs`, `selected_setup_ids`, `selected_service_ids`, `engagement_months`, etc.)
- This ensures save, regenerate, and sidebar always reflect the latest data

### 2. Fix save to persist all fields

When saving from the preview page:
- Save `quote_markdown` AND recalculated `totals` back to DB
- After regeneration, auto-save the new markdown + totals
- When returning to the configurator, reload from DB (already works via `fetchQuotes`)

### 3. Fix regeneration payload

Instead of using a frozen `generatePayload`, rebuild it from the DB-stored config fields using the same logic as `buildGeneratePayload()` in `BusinessQuoteTab`. Extract this logic into a shared utility or duplicate it in the preview page.

### 4. Corporate document rendering

Upgrade the preview page with:
- **Letterhead area**: Logo placeholder, "GROWTHINNOV" branding, document reference number, date
- **Professional typography**: `prose-lg` with custom heading styles, tighter leading, corporate colors
- **Section dividers**: Subtle horizontal rules with primary accent between major sections
- **Page margins**: Print-friendly padding (48px+ sides), max-width 850px for A4 feel
- **Footer**: Confidentiality notice, page reference, version stamp
- **Financial sidebar**: Gradient accent on total, better visual hierarchy with background fills on key numbers
- **Print styles**: `@media print` rules for clean PDF export

## Files impacted

| File | Action |
|---------|--------|
| `AdminQuotePreview.tsx` | **Rewrite** — DB-driven data, corporate layout, recalculated totals |
| `BusinessQuoteTab.tsx` | **Minor** — Pass only quote ID to preview, extract totals calculation if needed |
| `businessConfig.ts` | **Minor** — Export a `computeQuoteTotals()` utility if centralizing calculation |

## Execution order
1. Extract totals calculation into reusable function
2. Rewrite `AdminQuotePreview` to load from DB and recalculate
3. Upgrade document rendering with corporate design
4. Fix navigation to pass only ID

