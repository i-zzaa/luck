/// <reference lib="webworker" />
// Service worker customizado — precisa existir (em vez do gerado
// automaticamente via strategy "generateSW") porque só um service worker
// próprio pode escutar os eventos "push" e "notificationclick" do
// navegador. self.__WB_MANIFEST é substituído em build time pela lista de
// arquivos a precachear (workbox-build injectManifest faz essa injeção);
// sem essa linha, o build falha.
export {};
declare const self: ServiceWorkerGlobalScope;

import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
self.addEventListener('activate', () => {
  self.clients.claim();
});

// Formato do payload esperado (ver docs/pedido-backend-push.md): o backend
// dispara o push já com título/corpo prontos — o SW só exibe, não decide
// texto nem lógica de negócio nenhuma.
interface PushPayload {
  title: string;
  body: string;
  // url pra abrir/focar quando o usuário clica na notificação (ex: rota
  // da agenda, ou da sessão específica). Se ausente, cai em "/".
  url?: string;
  tag?: string;
}

self.addEventListener('push', (event: PushEvent) => {
  let payload: PushPayload = { title: 'Multi Alcance', body: '' };

  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // payload não veio como JSON (ex: push de teste em texto puro) — usa
    // o texto cru como corpo em vez de derrubar o handler inteiro.
    payload.body = event.data?.text() ?? '';
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/logo-mini.png',
      badge: '/logo-mini.png',
      tag: payload.tag,
      data: { url: payload.url || '/' },
    })
  );
});

// Clique na notificação: foca uma aba já aberta do app se existir, senão
// abre uma nova — sempre navegando pra url que veio no payload.
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl = (event.notification.data?.url as string) || '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      const existing = allClients.find((c) => 'focus' in c) as WindowClient | undefined;
      if (existing) {
        await existing.focus();
        existing.postMessage({ type: 'PUSH_NAVIGATE', url: targetUrl });
        return;
      }

      await self.clients.openWindow(targetUrl);
    })()
  );
});
