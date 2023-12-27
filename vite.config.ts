import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import { VitePWA } from 'vite-plugin-pwa';

const manifestForPlugin = {
  includeAssets: ['favicon.ico'],
  registerType: 'autoUpdate',
  manifest: {
    name: 'Prontuário | Multi Alcance',
    short_name: 'Prontuário',
    description: 'App de prontuário multi alcance',
    icons: [
      {
        src: '/logo-mini.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'favicon',
      },
      {
        src: '/logo-mini.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'favicon',
      },
      {
        src: '/logo-mini.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'apple touch icon',
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
    start_url: '/',
    orientation: 'portrait',
  },
};

export default ({ mode }) => {
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
