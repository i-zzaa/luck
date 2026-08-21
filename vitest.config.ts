import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // fastRefresh: false só aqui (não em vite.config.ts, que é o build/dev
  // real) — o Vitest não injeta o preamble de HMR que o React Refresh
  // espera (não existe página HTML/dev-server real no ambiente de teste),
  // e sem isso todo componente que usa JSX falha com "can't detect
  // preamble" ao ser importado num teste.
  plugins: [react({ fastRefresh: false })],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // e2e/ roda por conta própria via Playwright (npm run test:e2e), não
    // faz sentido pro Vitest tentar coletar esses arquivos como unitário.
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    css: false,
  },
});
