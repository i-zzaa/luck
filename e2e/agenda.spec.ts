import { test, expect, type Page } from '@playwright/test';

// Agenda (pages/Schedule.tsx + pages/agenda/SessaoCard.tsx): card com
// status em texto, horário livre leve, resumo numa linha — e a regra de
// que sessão de dia passado NÃO mostra "Metas", mesmo com podeEditarMetas.

// Datas locais (não toISOString, que é UTC) pra "ontem"/"hoje" baterem com
// o fuso do navegador.
const iso = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const sessao = (id: number, date: string, start: string, title: string, extra: any = {}) => ({
  id,
  date,
  title,
  data: { start, end: start.replace(':00', ':50') },
  especialidade: { codigo: 'TO', nome: 'Terapia Ocupacional' },
  localExibicao: 'Consultório 2',
  modalidadeExibicao: 'Presencial',
  statusEventos: { codigo: 'confirmado', nome: 'Confirmado' },
  podeAbrirSessao: true,
  podeEditarMetas: true,
  isAttended: false,
  ...extra,
});

const AGENDA = {
  totalSessoes: 4,
  dias: [
    {
      data: iso(-1),
      totalSessoes: 2,
      itens: [
        sessao(1, iso(-1), '08:00', 'Gabriel Ontem Atendido', { isAttended: true, podeEditarMetas: false }),
        // não atendida ontem e o backend ainda manda podeEditarMetas: true
        sessao(2, iso(-1), '09:00', 'Ana Ontem Sem Atendimento'),
      ],
    },
    {
      data: iso(0),
      totalSessoes: 2,
      itens: [
        sessao(3, iso(0), '08:00', 'Miguel Hoje', { especialidade: { codigo: 'FONO', nome: 'Fonoaudiologia' } }),
        { id: 90, tipo: 'livre', start: '09:00', end: '09:50', title: 'Horário livre' },
        sessao(4, iso(0), '10:00', 'Laura Hoje Falta', {
          statusEventos: { codigo: 'falta', nome: 'Falta' },
          podeEditarMetas: false,
        }),
      ],
    },
  ],
};

const mockApi = (page: Page, urls: string[]) =>
  page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.includes('localhost:')) return route.continue();
    if (url.includes('/evento/filtro')) {
      urls.push(url);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AGENDA) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });

const authInit = (page: Page) => {
  const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  return page.addInitScript(([f]) => {
    sessionStorage.setItem('token', 'token-teste');
    sessionStorage.setItem('expiresAt', f as string);
    sessionStorage.setItem(
      'auth',
      JSON.stringify({ id: 1, login: 'terapeuta.teste', nome: 'Teste', permissoes: ['*'], perfil: { codigo: 'terapeuta' } })
    );
  }, [future]);
};

test.describe('Agenda', () => {
  test('sessão de dia passado não mostra "Metas"; hoje mostra', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    const urls: string[] = [];
    await mockApi(page, urls);
    await authInit(page);
    await page.goto('/agenda');
    await page.waitForLoadState('networkidle');

    // resumo numa linha
    await expect(page.getByText('sessões hoje')).toBeVisible();
    await expect(page.getByText('1 atendida')).toBeVisible();

    // ontem: sem "Metas", mesmo a não atendida com podeEditarMetas
    await expect(page.getByRole('button', { name: 'Metas da sessão de Gabriel Ontem Atendido' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Metas da sessão de Ana Ontem Sem Atendimento' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Ana Ontem Sem Atendimento.*Não atendida/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Gabriel Ontem Atendido.*Atendida/ })).toBeVisible();

    // hoje: "Metas" com texto
    const metas = page.getByRole('button', { name: 'Metas da sessão de Miguel Hoje' });
    await expect(metas).toBeVisible();
    await expect(metas).toHaveText(/Metas/);
    await expect(page.getByRole('button', { name: /Laura Hoje Falta.*Falta/ })).toBeVisible();
    await expect(page.getByText('Horário livre')).toBeVisible();
    await expect(page.getByText('Fono', { exact: true })).toBeVisible();

    // "Metas" abre a tela de metas; o card abre a sessão
    await metas.click();
    await expect(page).toHaveURL(/\/metas$/);
    await page.goBack();
    await page.getByRole('button', { name: /Miguel Hoje/ }).first().click();
    await expect(page).toHaveURL(/\/session\/3\?data=/);

    expect(erros).toEqual([]);
  });

  test('abas e período: "Período" abre o sheet sem trocar a aba até aplicar', async ({ page }) => {
    const urls: string[] = [];
    await mockApi(page, urls);
    await authInit(page);
    await page.goto('/agenda');
    await page.waitForLoadState('networkidle');

    const abas = page.getByRole('radiogroup', { name: 'Período da agenda' });
    await abas.getByRole('radio', { name: 'Semana' }).click();
    await expect.poll(() => urls.some((u) => u.includes('modo=semana'))).toBe(true);
    await expect(page.getByText('sessões nesta semana')).toBeVisible();

    await abas.getByRole('radio', { name: 'Período' }).click();
    const sheet = page.getByRole('dialog', { name: 'Filtrar por período' });
    await expect(sheet).toBeVisible();
    await expect(abas.getByRole('radio', { name: 'Semana' })).toHaveAttribute('aria-checked', 'true');
  });
});
