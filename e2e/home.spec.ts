import { test, expect, type Page } from '@playwright/test';

// Início: próxima sessão em destaque (com "Iniciar" só se for hoje),
// pendências que abrem a sessão, pacientes da semana e números numa linha.

const hoje = new Date();
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const amanha = new Date(hoje.getTime() + 24 * 3600 * 1000);

const json = (body: any) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

const sessao = (id: number, date: string, start: string, paciente: { id: number; nome: string }) => ({
  id,
  tipo: 'sessao',
  date,
  title: paciente.nome,
  paciente,
  data: { start, end: start.replace(/^(\d\d)/, (h) => String(Number(h) + 1).padStart(2, '0')) },
});

const mockApi = (page: Page, opcoes: { eventos: any[]; dashboard?: any }) =>
  page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.includes('localhost:')) return route.continue();
    if (url.includes('evento/filtro')) {
      // Só a "esta semana" responde; a próxima semana vem vazia.
      const data = new URL(url).searchParams.get('data');
      const itens = data === iso(hoje) ? opcoes.eventos : [];
      return route.fulfill(json({ dias: [{ itens }] }));
    }
    if (url.includes('terapeuta/dashboard')) return route.fulfill(json(opcoes.dashboard ?? null));
    return route.fulfill(json({ data: [] }));
  });

const authInit = (page: Page) => {
  const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  return page.addInitScript(([f]) => {
    sessionStorage.setItem('token', 'token-teste');
    sessionStorage.setItem('expiresAt', f as string);
    sessionStorage.setItem(
      'auth',
      JSON.stringify({ id: 1, login: 'terapeuta.teste', nome: 'Andressa Teste', permissoes: ['*'], perfil: { codigo: 'developer' } })
    );
  }, [future]);
};

test.describe('Início', () => {
  test('sem sessão hoje mostra a próxima de outro dia, sem "Iniciar sessão"', async ({ page }) => {
    await mockApi(page, {
      eventos: [sessao(5, iso(amanha), '09:00', { id: 7, nome: 'Pedro Lima' })],
      dashboard: { totalSessoes: 0, resumosPendentes: [] },
    });
    await authInit(page);
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Andressa/ })).toBeVisible();
    await expect(page.getByText('Nenhuma sessão hoje.')).toBeVisible();
    await expect(page.getByText('Pedro Lima').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar sessão' })).toHaveCount(0);
    // Números zerados não aparecem.
    await expect(page.getByText('Esta semana:')).toHaveCount(0);

    await page.getByRole('button', { name: 'Ver paciente' }).click();
    await expect(page).toHaveURL(/\/paciente\/7$/);
    await expect(page.getByRole('heading', { name: 'Pedro Lima' })).toBeVisible();
  });

  test('sessão mais tarde hoje: "Iniciar sessão" abre a sessão; pendência abre a sessão a finalizar', async ({
    page,
  }) => {
    await mockApi(page, {
      eventos: [sessao(9, iso(hoje), '23:59', { id: 2, nome: 'Ana Souza' })],
      dashboard: {
        totalSessoes: 4,
        taxaComparecimento: 75,
        horasAtendidas: '3h',
        resumosPendentes: [{ id: 3, pacienteNome: 'João Pedro', data: '01/01', horario: '10:00' }],
      },
    });
    await authInit(page);
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('1 sessão sem resumo assinado')).toBeVisible();
    await expect(page.getByText('Esta semana:')).toBeVisible();
    await expect(page.getByText(/4 sessões · 75% de presença · 3h/)).toBeVisible();
    await expect(page.getByText('Pacientes da semana')).toBeVisible();

    await page.getByRole('button', { name: 'Iniciar sessão' }).click();
    await expect(page).toHaveURL(new RegExp(`/session/9\\?data=${iso(hoje)}$`));

    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /João Pedro/ }).click();
    await expect(page).toHaveURL(/\/session\/3\?data=\d{4}-01-01$/);
  });
});
