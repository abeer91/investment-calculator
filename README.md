# Investment Strategy Calculator

A single-page React experience that compares loan-based vs SIP-based investment strategies with dual-line charts (nominal vs real) and inflation-adjusted metrics.

## Prerequisites

- Node.js 18+
- npm 10+

Install dependencies once:

```bash
npm install
```

## Local Development

```bash
npm run dev
```

This launches Vite with HMR at the URL printed in the terminal. The entire UI lives inside `src/InvestmentCalculator.jsx`, so you can tweak logic without touching any build plumbing.

## Quality Gates

| Command | Description |
| --- | --- |
| `npm run lint` | ESLint (flat config) over the whole repo |
| `npm run test` | Vitest + Testing Library smoke tests (jsdom) |

Both commands run quickly and require no additional setup.

## Production Build

```bash
npm run build
npm run preview   # optional smoke test of the built bundle
```

The optimized assets land in `dist/` and can be deployed to Netlify, Vercel, S3, etc.

## Share / Deploy to CodePen · StackBlitz · JSFiddle

1. Run the deploy helper:
   ```bash
   npm run deploy:share
   ```
2. Grab the generated `shareable/codepen.html`.
3. Share it:
   - **CodePen** – paste the entire HTML file into the HTML panel (it already includes the `<script type="module">` block that loads React, Lucide, and Recharts from esm.sh).
   - **JSFiddle** – choose the HTML pane and paste the same file contents; no additional JS/CSS panels required.
   - **StackBlitz** – create a “Vanilla JS” or “HTML” project and drop `codepen.html` in as `index.html`, or import the full repo to keep the Vite dev workflow.

The generated file is self-contained (no build step, no npm install) and is ideal for sharing a live demo link quickly.

## Files of Note

- `src/InvestmentCalculator.jsx` – the full calculator logic & UI.
- `scripts/generate-shareable.mjs` – transforms the component into a CDN-ready HTML asset for pen/fiddle platforms.
- `shareable/codepen.html` – output from `npm run deploy:share`, ready to paste into online sandboxes.
- `public/` – static assets copied as-is during `npm run build`.

## GitHub Pages Deployment

This repository is already wired for GitHub Pages:

1. Vite’s `base` is set to `/investment-calculator/` in `vite.config.js` so assets load from the Pages path.
2. `.github/workflows/deploy.yml` builds the site (`npm ci && npm run build`) and uses `actions/deploy-pages@v4` to publish `dist/`.
3. Pages is served from `https://abeer91.github.io/investment-calculator/`. Any push to `main` automatically rebuilds and redeploys.

If you fork the repo:

- Update the `base` path to match your repo name.
- In **Settings → Pages**, choose **GitHub Actions** as the source (no template needed).
- Keep the existing workflow or regenerate it with your preferred Node version.

Happy investing! 🧮📈
