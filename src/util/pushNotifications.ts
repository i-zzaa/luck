import { create, deleteItem } from '../server';

// Converte a chave pública VAPID (base64url, formato que o backend
// normalmente expõe) pro Uint8Array que PushManager.subscribe espera.
// Implementação padrão recomendada pela própria spec do Web Push.
export const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const isPushSupported = (): boolean =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export type PushPermissionState = NotificationPermission | 'unsupported';

export const getPushPermissionState = (): PushPermissionState => {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
};

// FALLBACK/PENDÊNCIA DE BACKEND: a chave pública VAPID é gerada e mantida
// pelo backend (o par de chaves privada/pública do Web Push) — só ele
// consegui assinar os envios. Enquanto VITE_VAPID_PUBLIC_KEY não existir
// no .env, a inscrição não é tentada (ver docs/pedido-backend-push.md).
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

interface SubscribeResult {
  ok: boolean;
  reason?: 'unsupported' | 'denied' | 'no-vapid-key' | 'error';
}

// Pede permissão (se ainda não decidida), inscreve no PushManager e manda
// a inscrição pro backend guardar associada ao terapeuta logado. Chamado
// a partir de uma ação explícita do usuário (botão/banner) — nunca
// automático no mount de página, pra não estourar o prompt de permissão
// do navegador sem contexto.
export const subscribeToPush = async (terapeutaId: number | string): Promise<SubscribeResult> => {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };
  if (!VAPID_PUBLIC_KEY) return { ok: false, reason: 'no-vapid-key' };

  const permission =
    Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;

  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    // Formato { endpoint, keys: { p256dh, auth } } — é o payload padrão
    // que qualquer biblioteca de Web Push do lado do servidor espera
    // (web-push no Node, pywebpush no Python, etc.), sem nenhuma
    // formatação extra da nossa parte.
    await create('push/subscribe', {
      terapeutaId,
      subscription: subscription.toJSON(),
    });

    return { ok: true };
  } catch (error) {
    console.error('Falha ao inscrever push notification', error);
    return { ok: false, reason: 'error' };
  }
};

// Cancela a inscrição local e avisa o backend, pra ele não tentar mais
// enviar (e descartar a inscrição morta na próxima tentativa de envio
// que falhar, mas isso é responsabilidade do backend — aqui só avisamos).
export const unsubscribeFromPush = async (terapeutaId: number | string): Promise<void> => {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await deleteItem(`push/subscribe?terapeutaId=${terapeutaId}&endpoint=${encodeURIComponent(endpoint)}`);
};
