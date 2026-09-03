import { test, expect, type Page } from '@playwright/test';

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

test.describe('Tab bar flutuante do rodapé', () => {
  test('aparece nas rotas de topo, com os 5 itens e o ativo destacado', async ({ page }) => {
    await mockApi(page);
    await authInit(page);

    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    const tabbar = page.locator('nav.rounded-full');
    await expect(tabbar).toBeVisible();

    // Agenda é o botão central elevado, sem rótulo visível — só
    // aria-label (ver AgendaFab em BottomTabBar.tsx) — os outros 4 têm
    // texto normal.
    for (const label of ['Início', 'PEI', 'Primeira Resposta']) {
      await expect(tabbar.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(tabbar.getByRole('link', { name: 'Agenda' })).toBeVisible();
  });

  test('navega ao clicar num item da tab bar (incluindo a Agenda central, sem rótulo)', async ({
    page,
  }) => {
    await mockApi(page);
    await authInit(page);

    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    await page.locator('nav.rounded-full').getByRole('link', { name: 'Agenda' }).click();
    await expect(page).toHaveURL(/\/agenda$/);

    // item de texto normal ("Início") ainda troca de destaque com a rota
    await page.locator('nav.rounded-full').getByText('Início', { exact: true }).click();
    await expect(page).toHaveURL(/\/home$/);
    const inicioTab = page.locator('nav.rounded-full').getByText('Início', { exact: true });
    await expect(inicioTab).toHaveClass(/text-primary/);
  });

  test('fica escondida numa rota de detalhe (fora do menu principal)', async ({ page }) => {
    await mockApi(page);
    await authInit(page);

    await page.goto('/dtt');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('nav.rounded-full')).toHaveCount(0);
  });

  // Regressão: depois do login não existe nenhum navigate() explícito —
  // signed só vira true e a árvore troca de PublicRoutes pra OtherRoutes,
  // a URL continua sendo "/" (raiz, onde ficava a tela de login). "/"
  // cai no fallback path:'*' das ROUTES (que também renderiza Home), mas
  // sem tratamento especial "/" nunca batia com "/home" — tab bar E
  // título ficavam invisíveis bem na primeira tela que o usuário vê.
  test('na URL raiz "/" (sem navigate() pós-login) mostra a tab bar com Início ativo', async ({
    page,
  }) => {
    await mockApi(page);
    await authInit(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const tabbar = page.locator('nav.rounded-full');
    await expect(tabbar).toBeVisible();

    const inicioTab = tabbar.getByText('Início', { exact: true });
    await expect(inicioTab).toBeVisible();
    await expect(inicioTab).toHaveClass(/text-primary/);

    // título da barra superior também precisa aparecer (mesmo bug raiz)
    await expect(page.getByText('Início').first()).toBeVisible();
  });
});

test.describe('Barra superior (Nav)', () => {
  test('não mostra seta de voltar nas telas principais, só nas de detalhe', async ({ page }) => {
    await mockApi(page);
    await authInit(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.pi-arrow-left')).toHaveCount(0);

    await page.goto('/dtt');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.pi-arrow-left')).toHaveCount(1);
  });

  test('clicar no avatar pede confirmação antes de sair, não desloga direto', async ({ page }) => {
    await mockApi(page);
    await authInit(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('.bg-logo-mini').click();
    await expect(page.getByText('Deseja realmente sair da sua conta?')).toBeVisible();

    // ainda autenticado — não caiu na tela de login só de abrir o confirm
    await expect(page.locator('#username')).toHaveCount(0);

    // "Cancelar" fecha sem deslogar
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByText('Deseja realmente sair da sua conta?')).not.toBeVisible();
    await expect(page.locator('#username')).toHaveCount(0);
  });

  test('"Sair" no confirm desloga de verdade', async ({ page }) => {
    await mockApi(page);
    await authInit(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('.bg-logo-mini').click();
    await page.getByRole('button', { name: 'Sair', exact: true }).click();

    await expect(page.locator('#username')).toBeVisible({ timeout: 10_000 });
  });
});
