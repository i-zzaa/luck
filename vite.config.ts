import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa';

const manifestForPlugin: Partial<VitePWAOptions> = {
  includeAssets: ['favicon.ico'],
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
        sizes: '180x180',
        type: 'image/png',
        purpose: 'apple',
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
    start_url: "/?v=2",
    orientation: 'portrait',
  },
};

export default ({ mode }: any) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    plugins: [react(), reactRefresh(), VitePWA(manifestForPlugin)],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return id
                .toString()
                .split('node_modules/')[1]
                .split('/')[0]
                .toString();
            }
          },
        },
      },
    },
  });
};
