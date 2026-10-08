import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa';

// `base` vem de VITE_BASE (padrão '/'); permite servir o app fora da raiz.
const manifestForPlugin = (base: string): Partial<VitePWAOptions> => ({
  includeAssets: ['favicon.ico', 'logo-mini.png', 'logo-md-write.png'],
  registerType: 'autoUpdate',
  // "generateSW" (o padrão, usado até aqui) gera o service worker inteiro
  // automaticamente a partir de regras de cache — não dá pra adicionar
  // código próprio nele. Notificação push exige um SW que escute os
  // eventos "push"/"notificationclick" (ver src/sw.ts), então precisa da
  // estratégia "injectManifest": o plugin injeta a lista de precache
  // (self.__WB_MANIFEST) dentro do NOSSO arquivo, em vez de gerar um do
  // zero.
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'sw.ts',
  injectManifest: {
    // mesmas libs workbox já usadas no modo generateSW anterior, pinadas
    // pra Node 18 (ver overrides/resolutions em package.json) — sem essa
    // versão, workbox-build exige Node 20+.
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
  },
  manifest: {
    name: 'ABA | Multi Alcance',
    short_name: 'ABA',
    description: 'App de prontuário multi alcance',
    icons: [
      {
        src: `${base}logo-mini.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${base}logo-mini.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${base}logo-mini.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    theme_color: '#662977',
    background_color: '#662977',
    display: 'standalone',
    scope: base,
    start_url: `${base}?v=2`,
    orientation: 'portrait',
  },
});

export default ({ mode }: any) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const base = process.env.VITE_BASE || '/';

  return defineConfig({
    base,
    plugins: [react(), reactRefresh(), VitePWA(manifestForPlugin(base))],
    // manualChunks agrupava cada pacote de node_modules num chunk próprio,
    // mas isso quebrava o code-splitting das rotas lazy (ex: jspdf ficava
    // sendo baixado eager em toda página mesmo só sendo usado dentro da
    // rota /protocolo-av). O chunking automático do Rollup já respeita os
    // limites de import() dinâmico corretamente sem essa configuração.
    build: {},
  });
};
