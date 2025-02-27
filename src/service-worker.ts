/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();

// Ativa imediatamente a nova versão do Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Precache todos os assets gerados pelo build
precacheAndRoute(self.__WB_MANIFEST);

// App Shell Routing para lidar com navegação
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  ({ request, url }: { request: Request; url: URL }) => {
    if (request.mode !== 'navigate') return false;
    if (url.pathname.startsWith('/_')) return false;
    if (url.pathname.match(fileExtensionRegexp)) return false;
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// Cache dinâmico para imagens
registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.endsWith('.png'),
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: 50 })],
  })
);

// Remove caches antigos e força atualização automática
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
    ).then(() => self.clients.claim()) // Garante que todas as abas usem o novo SW
  );
});

// Recarrega todas as abas abertas quando uma nova versão for ativada
self.addEventListener('controllerchange', () => {
  self.clients.matchAll({ type: 'window' }).then((clients) => {
    clients.forEach((client) => client.navigate(client.url));
  });
});
