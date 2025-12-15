# TODO 04 – Stress Test / Chaos Induction (Medium)

## Goal
Allow users to model one or more “bad years” where gold and/or stock returns are below the baseline APRs. This helps assess resilience when the market underperforms.

## Proposed UX
1. **Stress Test Panel** (collapsible like Inflation panel)
   - Mode selector: `None` (default), `Single Bad Year`, `Two Bad Years`, `Custom`.
   - Each bad year entry captures:
     - Year index (1…analysisPeriod)
     - Stock APR override (default e.g. `-15%`)
     - Optional gold APR override or checkbox “Apply to gold”
   - Quick presets (“Early Crash”, “Mid-cycle Slowdown”) prefill year + APR.
   - Show badges on charts (vertical dotted lines) + tooltip text “Stress year: Stock APR = -15%”.
2. **Feedback in Results/Table**
   - Table row indicates which years are stressed.
   - Summary card lists “Stress years: 2025 (-15%), 2027 (-5%)”.

## Implementation Steps
1. **State**: `stressYears = [{ year: number, stockAPR: number, goldAPR?: number }]`.
2. **Math**:
   - Update `generateYearlyData` to accept overrides map.
   - For each year, compute APR = `override` || baseline APR.
   - Document if multi-year effects persist (default: 1-year dip, revert next year).
3. **Chart + Table**:
   - Add markers to chart (custom dot or reference line).
   - Table end row should mention stress config.
4. **Shareable Links**:
   - Extend payload with stress array; update encoding/decoding.
5. **Testing**:
   - Unit tests verifying year-specific APR overrides affect final metrics.
   - Snapshot ensures share link round-trip includes stress years.

## Caveats
- Need to guard against year values > analysisPeriod (auto-clamp).
- Keep max number of stress entries small (≤3) to avoid huge URLs.
- Default overrides should be negative or low positive to reflect underperformance.
- Ensure charts remain performant (compute once, reuse).

Size estimate: Medium (new state, math layer changes, UI + share link updates).
