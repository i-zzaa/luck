import { test, expect, type Page } from '@playwright/test';

// Aba Pacientes: lista com busca (pacientes da agenda de hoje primeiro) e a
// tela do paciente, de onde Protocolo, PEI, 1ª resposta e Resumos abrem
// com o paciente já escolhido.

const PACIENTES = [
  { id: 1, nome: 'Gabriel Luis Guido' },
  { id: 2, nome: 'Ana Souza' },
  { id: 3, nome: 'João Pedro' },
];

const json = (body: any) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

const mockApi = (page: Page, chamadas: string[] = []) =>
  page.route('**/*', (route) => {
    const req = route.request();
    const url = req.url();
    if (url.includes('localhost:')) return route.continue();
    chamadas.push(url);
    if (url.includes('paciente/dropdown')) return route.fulfill(json({ data: PACIENTES }));
    if (url.includes('protocolo/dropdown')) {
      return route.fulfill(
        json({
          data: [
            { id: 1, nome: 'Portage', codigo: 'portage' },
            { id: 2, nome: 'VB-MAPP', codigo: 'vbmapp' },
            { id: 3, nome: 'Manual', codigo: 'pei' },
          ],
        })
      );
    }
    // Agenda de hoje: só o João tem sessão.
    if (url.includes('evento/filtro')) {
      return route.fulfill(
        json({
          dias: [
            {
              itens: [
                { id: 10, tipo: 'sessao', paciente: { id: 3, nome: 'João Pedro' }, data: { start: '14:00', end: '15:00' } },
              ],
            },
          ],
        })
      );
    }
    if (url.includes('pei/filtro')) return route.fulfill(json({ itens: [], tabelaComparativa: null }));
    return route.fulfill(json({ data: [] }));
  });

const authInit = (page: Page) => {
  const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  return page.addInitScript(([f]) => {
    sessionStorage.setItem('token', 'token-teste');
    sessionStorage.setItem('expiresAt', f as string);
    sessionStorage.setItem(
      'auth',
      JSON.stringify({
        id: 1,
        login: 'terapeuta.teste',
        nome: 'Teste',
        permissoes: ['PEI_FILTRO_BOTAO_CADASTRAR', 'PEI_FILTRO_SELECT_PROTOCOLO'],
        perfil: { codigo: 'developer' },
      })
    );
  }, [future]);
};

test.describe('Pacientes', () => {
  test('lista com quem tem sessão hoje primeiro e busca sem acento', async ({ page }) => {
    await mockApi(page);
    await authInit(page);
    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Hoje na agenda')).toBeVisible();
    const botoes = page.getByRole('main').getByRole('button');
    await expect(botoes.first()).toContainText('João Pedro');
    await expect(page.getByText('Todos')).toBeVisible();

    await page.getByLabel('Buscar paciente').fill('joao');
    await expect(page.getByText('Hoje na agenda')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /João Pedro/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Ana Souza/ })).toHaveCount(0);
  });

  test('tela do paciente leva ao PEI já com o paciente escolhido', async ({ page }) => {
    const chamadas: string[] = [];
    await mockApi(page, chamadas);
    await authInit(page);
    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Ana Souza/ }).click();
    await expect(page).toHaveURL(/\/paciente\/2$/);
    await expect(page.getByRole('heading', { name: 'Ana Souza' })).toBeVisible();
    // Tela de detalhe: sem tab bar, com "voltar".
    await expect(page.locator('nav.rounded-full')).toHaveCount(0);
    await expect(page.locator('.pi-arrow-left')).toHaveCount(1);
    for (const acao of ['Protocolo', 'PEI', '1ª resposta', 'Resumos']) {
      await expect(page.getByRole('button', { name: new RegExp(`^${acao}`) })).toBeVisible();
    }

    await page.getByRole('button', { name: /^PEI/ }).click();
    await expect(page).toHaveURL(/\/pei$/);
    await expect(page.getByText('De quem é o PEI?')).toHaveCount(0);
    await expect(page.getByText('Ana Souza')).toBeVisible();
    await expect(
      page.getByRole('radiogroup', { name: 'Protocolo' }).getByRole('radio', { name: 'Manual' })
    ).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => chamadas.some((u) => u.includes('pei/filtro'))).toBe(true);
  });

  test('link direto para o paciente busca pelo id', async ({ page }) => {
    await mockApi(page);
    await authInit(page);
    await page.goto('/paciente/1');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Gabriel Luis Guido' })).toBeVisible();
    await expect(page.getByText('Paciente', { exact: true }).first()).toBeVisible();
  });
});
