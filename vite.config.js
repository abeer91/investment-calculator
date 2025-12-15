import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/investment-calculator/',
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
  },
});
