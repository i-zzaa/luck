import { test, expect, type Page } from '@playwright/test';

// Regressão: os ícones do CheckboxDTT/CheckboxSN são <svg width/height=
// "1280">. Sem o CSS em styles/primereact.css (.p-multistatecheckbox svg)
// a altura não encolhia e o svg invisível de um slot preenchido cobria os
// slots das linhas de cima/baixo — tocar num slot já preenchido alterava
// o slot preenchido da mesma coluna em outra linha. Só aparece com layout
// de verdade (jsdom não tem), por isso é e2e.
test.use({ channel: 'chrome' });

const slots = (...v: (string | null)[]) => [...v, ...Array(10 - v.length).fill(null)];

const SESSAO = {
  evento: { data: {}, title: 'Sessão teste', statusEventos: 'agendado' },
  modo: 'nova',
  sessao: [
    {
      key: 'p1',
      label: 'Programa 1',
      children: [
        {
          key: 'm1',
          label: 'Esperar a vez com',
          children: [
            { key: 'a1', label: '5 segundos', children: slots('C', 'DT', null, 'C') },
            { key: 'a2', label: '10 segundos', children: slots('DP') },
            { key: 'a3', label: '20 segundos', children: slots(null, 'DV') },
          ],
        },
      ],
    },
  ],
  portage: [],
  vbmapp: [],
  maintenance: {},
};

const setup = async (page: Page) => {
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  await page.addInitScript(([exp]) => {
    sessionStorage.setItem('token', 'x');
    sessionStorage.setItem('expiresAt', exp as string);
    sessionStorage.setItem(
      'auth',
      JSON.stringify({ id: 1, login: 't', nome: 'T', permissoes: ['*'], perfil: { codigo: 'developer' } })
    );
  }, [expiresAt]);
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.includes('localhost:3010')) return route.continue();
    const body = url.includes('/sessao/calendario/') ? SESSAO : { data: [] };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
};

// Assinatura do ícone de cada slot (trecho do path do desenho), null se vazio.
const signatures = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('.p-multistatecheckbox')).map(
      (el) => el.querySelectorAll('path')[1]?.getAttribute('d')?.slice(0, 40) ?? null
    )
  );

test('tocar num slot preenchido altera esse slot, não o da mesma coluna em outra linha', async ({ page }) => {
  await setup(page);
  await page.goto('/session/1');
  await page.getByText('Programa 1').first().click();
  await page.waitForSelector('.p-multistatecheckbox');

  const before = await signatures(page);
  const [C, DT, DP, DV] = [before[0], before[1], before[10], before[21]];
  const box = page.locator('.p-multistatecheckbox');

  // force: o actionability check do Playwright recusaria o toque se algo
  // cobrisse o slot — aqui queremos justamente tocar onde o dedo tocaria.
  await box.nth(0).tap({ force: true }); // 5s slot 0: C -> DT
  await box.nth(1).tap({ force: true }); // 5s slot 1: DT -> DP

  const after = await signatures(page);
  expect(after[0]).toBe(DT);
  expect(after[1]).toBe(DP);
  expect(after[3]).toBe(C);
  expect(after[10]).toBe(DP); // 10s slot 0 intacto
  expect(after[21]).toBe(DV); // 20s slot 1 intacto
});
