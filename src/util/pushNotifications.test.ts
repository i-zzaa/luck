import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getPushPermissionState,
  isPushSupported,
  urlBase64ToUint8Array,
} from './pushNotifications';

describe('urlBase64ToUint8Array', () => {
  it('decodifica uma chave VAPID base64url pro Uint8Array esperado pelo PushManager', () => {
    // "AB" (+ padding "==") decodifica pra 1 byte só: 0 (conferido via
    // atob('AB==') = "\x00"). Usa base64url (sem + nem /), sem padding,
    // que é como o backend normalmente expõe a chave pública.
    const result = urlBase64ToUint8Array('AB');
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual([0]);
  });

  it('troca - e _ (base64url) por + e / (base64 padrão) antes de decodificar', () => {
    // "+/+/" em base64 padrão vira "-_-_" em base64url — o resultado
    // decodificado tem que ser o mesmo dos dois jeitos.
    const padrao = urlBase64ToUint8Array('Ki8r');
    const urlSafe = urlBase64ToUint8Array('Ki8r'.replace(/\+/g, '-').replace(/\//g, '_'));
    expect(Array.from(urlSafe)).toEqual(Array.from(padrao));
  });

  it('lida com strings que precisam de padding (comprimento não múltiplo de 4)', () => {
    expect(() => urlBase64ToUint8Array('QQ')).not.toThrow(); // 2 chars -> precisa de "=="
    expect(() => urlBase64ToUint8Array('QQE')).not.toThrow(); // 3 chars -> precisa de "="
  });
});

describe('isPushSupported / getPushPermissionState', () => {
  const originalNotification = (globalThis as any).Notification;

  afterEach(() => {
    (globalThis as any).Notification = originalNotification;
    vi.unstubAllGlobals();
  });

  it('getPushPermissionState devolve "unsupported" quando o ambiente não tem os APIs necessários', () => {
    // jsdom não implementa PushManager nem Notification por padrão —
    // exatamente o cenário real de navegadores sem suporte (ex: Safari
    // antigo, WebView de app nativo sem essas APIs).
    expect(isPushSupported()).toBe(false);
    expect(getPushPermissionState()).toBe('unsupported');
  });

  it('getPushPermissionState reflete Notification.permission quando suportado', () => {
    vi.stubGlobal('serviceWorker', {});
    Object.defineProperty(globalThis.navigator, 'serviceWorker', {
      value: {},
      configurable: true,
    });
    vi.stubGlobal('PushManager', class {});
    vi.stubGlobal('Notification', { permission: 'granted' });

    expect(getPushPermissionState()).toBe('granted');
  });
});
