import { test, expect, type Page } from '@playwright/test';

// Primeira Resposta (pages/PrimeiraResposta.tsx): escolher o paciente já
// carrega; programa aberto dividido por meta, com um gráfico de todos os
// itens da meta e a grade item × sessão; legenda uma vez só.
// Resposta mockada no formato de GET sessao/atividade/:id?ultimasSessoes=3
// (cada item com a `meta` dona dela), com status/média/faixa derivados
// como o backend faz (atingido = 100% nas 3 sessões — ver heron-list-nest
// sessao.service getResumoAtividadePorPrograma).

type D = ['+' | '-', number | null] | null;
const DATAS = ['2026-09-10', '2026-09-17', '2026-09-24'];
const media = (v: (number | null)[]) => {
  const x = v.filter((n): n is number => n !== null);
  return x.length ? x.reduce((a, b) => a + b, 0) / x.length : null;
};
const prog = (
  programa: string,
  datas: (string | null)[],
  metas: [string | null, [string, D[]][]][]
) => {
  const children = metas.flatMap(([meta, itens]) =>
    itens.map(([nome, dias]) => ({
      programa: nome,
      meta,
      status:
        dias.length >= 3 && dias.every((d) => d && d[1] === 100) ? 'atingida' : 'aquisicao',
      dias: dias
        .filter(Boolean)
        .map((d, i) => ({ data: datas[i], primeiraResposta: d![0], porcentagem: d![1] })),
    }))
  );
  const evolucao = datas.map((data, i) => ({
    data,
    mediaAcerto: media(children.map((c) => c.dias[i]?.porcentagem ?? null)),
  }));
  const m = media(children.flatMap((c) => c.dias.map((d) => d.porcentagem)));
  return {
    programa,
    mediaAcerto: m,
    classificacao: m === null ? 'na' : m >= 80 ? 'alto' : m >= 50 ? 'medio' : 'baixo',
    colunas: datas.map((data) => ({ data })),
    evolucao,
    children,
  };
};

const LISTA = [
  prog('Mando', DATAS, [
    [
      'Emite 2 palavras, sinais ou PECS',
      [
        ['Apontar', [['+', 100], ['+', 100], ['+', 100]]],
        ['Pedir dá', [['-', 40], ['+', 60], ['+', 80]]],
        ['Dizer bola', [['-', 20], ['-', 40], ['-', null]]],
      ],
    ],
    [
      'Faz pedidos com gesto ou figura',
      [
        ['Pedir água com gesto', [['+', 60], ['+', 80], ['+', 100]]],
        ['Entregar figura (PECS)', [['+', 100], ['+', 100], ['+', 100]]],
      ],
    ],
  ]),
  prog('Imitação motora', DATAS, [
    [
      'Imita ações motoras grossas',
      [
        ['Bater palmas', [['+', 100], ['+', 100], ['+', 100]]],
        ['Tocar a cabeça', [['+', 80], ['+', 90], ['+', 100]]],
      ],
    ],
  ]),
  // Portage: sem nível de meta (meta null) — um grupo só, sem cabeçalho
  prog('Socialização', ['2026-09-17', '2026-09-24', null], [
    [null, [['Sorri', [['-', 30], ['-', 40]]]]],
  ]),
];

const mockApi = (page: Page) =>
  page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.includes('localhost:')) return route.continue();
    if (url.includes('sessao/atividade/1')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(LISTA),
      });
    }
    const data = url.includes('paciente/dropdown')
      ? [
          { id: 1, nome: 'Gabriel Luis Guido' },
          { id: 2, nome: 'Ana Beatriz Souza' },
        ]
      : [];
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data }),
    });
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
        permissoes: ['PEI_FILTRO_BOTAO_CADASTRAR'],
        perfil: { codigo: 'developer' },
      })
    );
  }, [future]);
};

test.describe('Primeira Resposta', () => {
  test('carrega ao escolher o paciente e mostra cada meta com o gráfico dos itens', async ({
    page,
  }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await mockApi(page);
    await authInit(page);

    await page.goto('/primeira-resposta');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('De quem você quer ver as respostas?')).toBeVisible();

    // sem botão de pesquisar: escolher já carrega
    await page.locator('.p-dropdown').first().click();
    await page.getByText('Gabriel Luis Guido').click();

    await expect(page.getByText('Últimas 3 sessões · 10/09 a 24/09')).toBeVisible();
    await expect(page.getByText('2 metas · 2 de 5 itens atingidos')).toBeVisible();
    await expect(page.getByText('Médio · 77%')).toBeVisible();

    // resumo: 3 programas, 4 metas (2 + 1 + o grupo sem meta do Portage), 3 itens atingidos
    await expect(page.getByText('itens atingidos', { exact: true })).toBeVisible();

    // programa aberto: uma seção por meta, cada uma com gráfico + grade
    await page.getByRole('button', { name: /Mando/ }).click();
    await expect(page.getByText('META 1')).toBeVisible();
    await expect(page.getByText('META 2')).toBeVisible();
    await expect(
      page.getByRole('img', { name: /^Acerto por item — Emite 2 palavras, sinais ou PECS/ })
    ).toBeVisible();
    const grade = page.getByRole('table', { name: 'Itens — Emite 2 palavras, sinais ou PECS' });
    await expect(grade.getByRole('row')).toHaveCount(4); // cabeçalho + 3 itens
    await expect(
      grade.getByRole('cell', { name: '10/09: não acertou de primeira, 40% de acerto' })
    ).toBeVisible();

    // tocar num item destaca a linha dele
    const pedirDa = grade.getByRole('button', { name: /Pedir dá/ });
    await pedirDa.click();
    await expect(pedirDa).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Toque de novo no item para ver todos')).toBeVisible();

    // legenda uma vez só
    await expect(page.getByText('Atingido = 100% nas 3 últimas sessões seguidas')).toHaveCount(1);

    // Portage (meta null): sem cabeçalho de meta
    await page.getByRole('button', { name: /Mando/ }).click();
    await page.getByRole('button', { name: /Socialização/ }).click();
    await expect(page.getByText('META 1')).toHaveCount(0);
    await expect(page.getByRole('table', { name: 'Itens — Meta 1' })).toBeVisible();

    // trocar paciente volta o seletor
    await page.getByRole('button', { name: 'Trocar' }).click();
    await expect(page.locator('.p-dropdown')).toBeVisible();

    expect(erros).toEqual([]);
  });
});
