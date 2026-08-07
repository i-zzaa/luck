import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa';

const manifestForPlugin: Partial<VitePWAOptions> = {
  includeAssets: ['favicon.ico', 'logo-mini.png', 'logo-md-write.png'],
  registerType: 'autoUpdate',
  manifest: {
    name: 'ABA | Multi Alcance',
    short_name: 'ABA',
    description: 'App de prontuário multi alcance',
    icons: [
      {
        src: '/logo-mini.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo-mini.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo-mini.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    theme_color: '#662977',
    background_color: '#662977',
    display: 'standalone',
    scope: '/',
    start_url: '/?v=2',
    orientation: 'portrait',
  },
};

export default ({ mode }: any) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    plugins: [react(), reactRefresh(), VitePWA(manifestForPlugin)],
    // manualChunks agrupava cada pacote de node_modules num chunk próprio,
    // mas isso quebrava o code-splitting das rotas lazy (ex: jspdf ficava
    // sendo baixado eager em toda página mesmo só sendo usado dentro da
    // rota /protocolo-av). O chunking automático do Rollup já respeita os
    // limites de import() dinâmico corretamente sem essa configuração.
    build: {},
  });
};
