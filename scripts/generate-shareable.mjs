import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const componentPath = path.join(projectRoot, 'src', 'InvestmentCalculator.jsx');
const shareableDir = path.join(projectRoot, 'shareable');

let component = readFileSync(componentPath, 'utf8')
  .replace(/^import .*;\n/gm, '')
  .replace(
    'export default function InvestmentCalculator() {',
    'function InvestmentCalculator() {',
  );

const moduleSnippets = [
  "import React from 'https://esm.sh/react@18.2.0';",
  "import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client';",
  "import * as LucideReact from 'https://esm.sh/lucide-react@0.561.0';",
  "import {",
  '  LineChart,',
  '  Line,',
  '  XAxis,',
  '  YAxis,',
  '  Tooltip,',
  '  ResponsiveContainer,',
  '  Legend,',
  '  CartesianGrid,',
  "} from 'https://esm.sh/recharts@3.5.1';",
  '',
  'const { useState, useMemo } = React;',
  'const {',
  '  TrendingUp,',
  '  Plus,',
  '  Trash2,',
  '  Calculator,',
  '  PiggyBank,',
  '  Wallet,',
  '  BarChart3,',
  '  Info,',
  '  HelpCircle,',
  '} = LucideReact;',
  '',
  component,
  '',
  "createRoot(document.getElementById('root')).render(<InvestmentCalculator />);",
].join('\n');

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Investment Strategy Calculator</title>
    <style>
      :root {
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
      }
      body {
        margin: 0;
        background: linear-gradient(180deg, #fafafa 0%, #f5f5f4 100%);
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
${moduleSnippets}
    </script>
  </body>
</html>
`;

mkdirSync(shareableDir, { recursive: true });
const outputPath = path.join(shareableDir, 'codepen.html');
writeFileSync(outputPath, html);

console.log(`✅ Shareable asset written to ${path.relative(projectRoot, outputPath)}`);
