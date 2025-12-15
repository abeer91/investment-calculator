# Performance Analysis (Medium)

Context gathered 2024-xx-xx while targeting 120 fps UX for the Investment Strategy Calculator.

## Baseline Build Metrics
- `npm run build`: `dist/assets/index-peDZ2pAr.js` = **572 KB** (gzip 172 KB). Vite warns chunk >500 KB.
- CSS/HTML negligible; JS bundle is dominant payload.
- Assets: `public/header.png` (1536×1024 PNG) served as-is.

## Observed Runtime Considerations (reasoned review)
- `InvestmentCalculator` recalculates `computeStrategyMetrics`, `generateYearlyData`, and `buildChartSeries` on every slider change. Heavy math executes on main thread alongside Recharts renders.
- `generateYearlyData` runs per strategy and per tooltip hover — cost grows linearly with strategy count and interaction speed.
- Recharts renders two full line charts; slider drags cause full re-renders → likely frame drops below 120 fps.
- No worker/off-thread processing, no throttling/debounce for slider change handlers.
- Preview strategy and saved strategies share the same chart data pipeline, so even unsaved adjustments trigger full recalculation.

## Suggested Next Steps
1. **Memoize / Cache Math**
   - Cache `generateYearlyData` results by strategy+inflation key.
   - Debounce slider-driven chart updates (e.g., 100 ms) so calculations don’t fire on every pointer move.
2. **Split Workloads**
   - Move heavy math to a Web Worker if perceived lag remains after memoization.
   - Consider deriving nominal vs real chart data separately to cut duplicate work.
3. **Bundle Optimizations**
   - Code-split Recharts (`manualChunks`) or lazy-load chart components.
   - Compress `header.png` (WebP) and add `loading=\"lazy\"`.
4. **Verification**
   - Automate Lighthouse/perf runs (`npm script`) to capture FPS, CPU, blocking time after each optimization.
   - Target <300 KB gzipped JS (or justify above-threshold chunk with worker offloading).

Use this doc as a living checklist while implementing performance work.
