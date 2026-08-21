import { test, expect, type Page } from '@playwright/test';

// Todas as rotas autenticadas disparam várias chamadas de dropdown/lista
// assim que montam (DropdownProvider, em routes/index.tsx, pré-carrega
// paciente/especialidade/status-eventos/etc.) — sem backend real
// acessível neste ambiente de teste, elas dariam "Network Error" e
// sujariam qualquer asserção de console. Mocka genericamente qualquer
// chamada que não seja pro próprio dev server (assets locais) com uma
// resposta vazia — suficiente pra montar a tela sem erro; os testes que
// se importam com o CONTEÚDO de uma resposta específica (ex: login)
// sobrescrevem com um page.route mais específico depois.
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

const authInit = (page: import('@playwright/test').Page) => {
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

test.describe('Guard de autenticação', () => {
  test('sem sessão, qualquer rota cai na tela de login (Routes: signed ? OtherRoutes : PublicRoutes)', async ({
    page,
  }) => {
    await page.goto('/home');
    await expect(page.locator('#username')).toBeVisible();

    await page.goto('/agenda');
    await expect(page.locator('#username')).toBeVisible();
  });

  test('com sessão válida, rotas autenticadas carregam sem erro de console', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await mockApi(page);
    await authInit(page);

    await page.goto('/home');
    await expect(page.locator('#username')).toHaveCount(0);

    await page.goto('/agenda');
    await page.waitForLoadState('networkidle');

    expect(errors).toEqual([]);
  });
});

test.describe('Guard da tela de Sessão', () => {
  test('navegar direto pra /session sem location.state redireciona pra /agenda', async ({
    page,
  }) => {
    // useSessionForm.ts: location.state some ao dar F5/abrir link direto
    // (react-router guarda state em memória, não na URL) — sem esse
    // guard, a tela quebra tentando ler state.item.* de undefined.
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await mockApi(page);
    await authInit(page);

    await page.goto('/session');
    await expect(page).toHaveURL(/\/agenda$/, { timeout: 10_000 });
    expect(errors).toEqual([]);
  });
});
