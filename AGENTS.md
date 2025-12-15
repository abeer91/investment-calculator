# AGENTS.md

Guidance for any future AI or human contributors who are updating the **Investment Strategy Calculator**. Accuracy matters – this tool compares loan-based and SIP-based strategies with inflation adjustments, so please treat the underlying math with the same rigor as production finance software.

---

## 1. Repository Snapshot

- **Framework:** React 18 + Vite.
- **Entry points:** `src/main.jsx` → `src/App.jsx` → `src/InvestmentCalculator.jsx`.
- **Styling:** Inline styles (system-ui fonts, neutral palette).
- **Assets:** `public/header.png` (Ashoka Chakra hero image), referenced through `import.meta.env.BASE_URL`.
- **Disclaimers:** Located at the bottom of `InvestmentCalculator.jsx`. Any UI changes must preserve the “not financial advice / non-commercial” copy.

### Key Supporting Files
| Path | Purpose |
| --- | --- |
| `src/lib/finance.js` | **Single source of truth** for all financial math: EMI, SIP FV, CAGR, real values, yearly chart data, etc. |
| `src/lib/finance.fixtures.js` | Golden dataset for regression testing (loan + SIP scenarios). |
| `src/lib/finance.test.js` | Vitest coverage validating the math against the golden dataset. |
| `src/InvestmentCalculator.test.jsx` | UI smoke tests (renders hero art, strategy toggle). |
| `.github/workflows/deploy.yml` | GitHub Pages deployment (builds on pushes to `main`). |
| `scripts/generate-shareable.mjs` | Produces a self-contained `shareable/codepen.html` via CDN imports. |

Never duplicate math formulas in components. Import helpers from `src/lib/finance.js`.

---

## 2. Commands & Tooling
| Command | Description |
| --- | --- |
| `npm run dev` | Local Vite dev server. |
| `npm run lint` | ESLint (flat config). Required before PRs/commits touching JS/JSX. |
| `npm run test` | Vitest (jsdom). Includes math regression tests – **must run** when touching finance logic or fixtures. |
| `npm run build` | Production bundle (outputs to `dist/`). |
| `npm run deploy:share` | Generates `shareable/codepen.html` for CodePen/StackBlitz/etc. |

**CI:** GitHub Actions builds and deploys to Pages automatically after each push to `main`. Do not break the workflow or `vite.config.js` `base` setting unless you coordinate docs + deploy updates.

---

## 3. Financial Math Expectations
- All core formulas (EMI, SIP future value, CAGR, inflation deflation) live in `src/lib/finance.js`.
- `generateYearlyData` now emits `{ portfolioValue, netValue, realValue }`. Charts plot `portfolioValue` so the curve shows account balance rather than net gain/loss.
- `computeStrategyMetrics` routes based on `STRATEGY_TYPES` (`LOAN`/`SIP`) and returns consistent metric objects used by the UI.
- **When altering any formula**, update:
  1. `finance.js` (no component-specific math elsewhere).
  2. `finance.fixtures.js` golden outputs.
  3. `finance.test.js` (extend or adjust tests to reflect expectation changes).
  4. Any derived UI text that references formula details (e.g., disclaimers, modeling copy).

If you add new strategy types, extend `STRATEGY_TYPES`, fixtures, and tests before touching UI rendering.

---

## 4. UI Considerations
- Hero image is optional; if it fails to load a fallback `<h1>` appears. Tests check the alt text, so keep it accurate.
- Modeling presets below the gold/stock sliders rely on `RETURN_MODELING`. Preserve symmetry between Strategy A (loan) and Strategy B (SIP).
- Strategy naming auto-increments; when removing strategies we decrement the counter (`new length + 1`).
- Chart section renders two separate cards: nominal performance and inflation impact (dotted). Any chart change must respect `chartStrategies` (preview vs saved) and the shared tooltip code.
- Saved strategy table uses `METRIC_DETAILS` for headers/tooltips; update that object if you rename metrics.

---

## 5. Testing Checklist Before Committing
1. `npm run lint`
2. `npm run test`
3. If finances change: verify golden dataset expectations and add new fixtures.
4. For visual changes affecting shareable output, run `npm run deploy:share` and sanity check `shareable/codepen.html`.

Do not skip tests. This is necessary to ensure financial outputs remain consistent.

---

## 6. Deployment Notes
- GitHub Pages runs via `.github/workflows/deploy.yml`.
- Vite `base` is `/investment-calculator/`. If you fork or rename the repo, update `vite.config.js` and README’s Pages section accordingly.
- Public files (`public/*`) are copied as-is. Compress images before committing to keep bundle sizes reasonable.

---

## 7. Common Pitfalls
- **Duplicated math:** Resist writing ad-hoc calculations in components. Always extend `finance.js`.
- **Breaking preview mode:** Charts must render even when no strategies are saved. Ensure `chartStrategies` always has at least one entry.
- **Accessibility regressions:** Keep alt text, headings, and disclaimers intact. Tests expect hero alt text.
- **State coupling:** Strategy A’s loan term doubles as analysis period; Strategy B uses the “Investment Period” slider. If you modify scheduling logic ensure both UI and math state stay in sync.

---

## 8. Communication
If you’re unsure about a change’s downstream impact (e.g., altering ROI definitions, adding new modeling presets, integrating external data), escalate in comments or issues before implementing. Financial accuracy comes first; favor conservative changes with thorough tests.

Happy hacking! 🧮📈
