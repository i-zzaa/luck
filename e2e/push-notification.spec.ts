import { test, expect, type Page } from '@playwright/test';

// Mesmo mock genérico de e2e/routing.spec.ts — as rotas autenticadas
// disparam vários dropdowns no mount, sem backend real acessível aqui.
const mockApi = (page: Page) =>
  page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.includes('localhost:')) return route.continue();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

const authInit = (page: Page) => {
  const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  return page.addInitScript(([tokenVal]) => {
    sessionStorage.setItem('token', tokenVal as string);
    sessionStorage.setItem(
      'auth',
      JSON.stringify({ id: 1, login: 'terapeuta.teste', nome: 'Teste', permissoes: ['*'] })
    );
    sessionStorage.setItem('perfil', 'developer');
  }, [future]);
};

test.describe('Banner de notificação push', () => {
  // Cobertura possível hoje: enquanto VITE_VAPID_PUBLIC_KEY não existe
  // (backend ainda não implementou — ver docs/pedido-backend-push.md), o
  // banner "Ativar notificações" NUNCA deve aparecer, mesmo com o
  // navegador suportando push e a permissão ainda não decidida — senão
  // o botão "Ativar" chamaria subscribeToPush() e falharia silenciosamente
  // (reason: 'no-vapid-key'), oferecendo algo que não funciona.
  //
  // O fluxo completo (banner aparece -> clica Ativar -> pede permissão ->
  // inscreve -> POST /push/subscribe) só é testável com uma chave VAPID
  // real/fake definida em build time — vira um teste natural de adicionar
  // assim que o backend entregar a chave.
  test('banner não aparece sem VITE_VAPID_PUBLIC_KEY configurada', async ({ page, context }) => {
    await context.grantPermissions([]); // não concede notification permission
    await mockApi(page);
    await authInit(page);

    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Ativar notificações')).toHaveCount(0);
  });
});
