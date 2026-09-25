import { test, expect, type Page } from '@playwright/test';

// Tela PEI (pages/PEI.tsx): paciente + seletor de protocolo no topo (sem
// o Filter), Relatório de Evolução num bottom sheet, programas em cards
// com SD/Resposta/SR+ em colunas, e excluir confirmado num sheet.

const MANUAL = [
  {
    id: 10,
    peiIds: [10, 11],
    programa: { id: 7, nome: 'Mando' },
    procedimentoEnsino: { id: 1, nome: 'Tentativa discreta' },
    estimuloDiscriminativo: 'O que você quer?',
    resposta: 'Pedir o item desejado',
    estimuloReforcadorPositivo: 'Acesso ao item',
    metas: [
      {
        id: '7-meta-0',
        value: 'Emite 2 palavras, sinais ou PECS.',
        status: 'aquisicao',
        observacao: 'Melhor com objetos reais.',
        subitems: [
          { id: 'a', value: 'Apontar' },
          { id: 'b', value: 'Pedir dá' },
        ],
      },
      {
        id: '7-meta-1',
        value: 'Faz pedidos com gesto ou figura.',
        status: 'atingida',
        conclusao: 'Atingida sem dica.',
        subitems: [{ id: 'c', value: 'Entregar figura (PECS)' }],
      },
    ],
  },
  {
    id: 12,
    peiIds: [12],
    programa: { id: 8, nome: 'Imitação motora' },
    procedimentoEnsino: { id: 1, nome: 'Tentativa discreta' },
    estimuloDiscriminativo: 'Faz assim',
    resposta: 'Imitar',
    estimuloReforcadorPositivo: 'Elogio',
    metas: [{ id: '8-meta-0', value: 'Imita ações motoras grossas.', status: 'manutencao', subitems: [] }],
  },
];

const TABELA_PORTAGE = {
  avaliacoes: [
    {
      tipo: 'primeira',
      titulo: 'Primeira avaliação',
      data: '2026-08-01',
      faixasEtarias: ['0 a 1'],
      categorias: [
        { nome: 'Socialização', valores: [{ percentual: 50, classificacao: 'medio' }] },
        { nome: 'Cognição', valores: [{ percentual: 60, classificacao: 'medio' }] },
      ],
    },
    {
      tipo: 'atual',
      titulo: 'Avaliação atual',
      data: '2026-09-20',
      faixasEtarias: ['0 a 1'],
      categorias: [
        { nome: 'Socialização', valores: [{ percentual: 88, classificacao: 'alto' }] },
        { nome: 'Cognição', valores: [{ percentual: 50, classificacao: 'medio' }] },
      ],
    },
  ],
};

const PORTAGE = [
  {
    id: 20,
    programa: { id: 1, nome: 'Socialização' },
    metas: [
      {
        id: 'p1',
        value: 'Imita um adulto num jogo simples',
        status: 'aquisicao',
        selected: '0.5',
        faixaEtaria: '1 a 2',
        procedimentoEnsino: { nome: 'Modelagem' },
        estimuloDiscriminativo: 'Vamos brincar?',
        subitems: [],
      },
    ],
  },
];

const mockApi = (page: Page, excluidos: any[]) =>
  page.route('**/*', (route) => {
    const req = route.request();
    const url = req.url();
    if (url.includes('localhost:')) return route.continue();
    const json = (body: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

    if (url.includes('paciente/dropdown')) return json({ data: [{ id: 1, nome: 'Gabriel Luis Guido' }] });
    if (url.includes('protocolo/dropdown')) {
      return json({
        data: [
          { id: 1, nome: 'Portage', codigo: 'portage' },
          { id: 2, nome: 'VB-MAPP', codigo: 'vbmapp' },
          { id: 3, nome: 'Manual', codigo: 'pei' },
        ],
      });
    }
    if (url.includes('pei/filtro')) {
      const b = req.postDataJSON() || {};
      if (b.protocoloId?.id === 1) return json({ itens: PORTAGE, tabelaComparativa: TABELA_PORTAGE });
      return json({ itens: MANUAL, tabelaComparativa: null });
    }
    if (req.method() === 'DELETE' && /\/pei$/.test(new URL(url).pathname)) {
      excluidos.push(req.postDataJSON());
      return json(MANUAL.slice(1));
    }
    return json({ data: [] });
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

const abrir = async (page: Page, excluidos: any[] = []) => {
  await mockApi(page, excluidos);
  await authInit(page);
  await page.goto('/pei');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('De quem é o PEI?')).toBeVisible();
  await page.locator('.p-dropdown').first().click();
  await page.getByRole('option', { name: 'Gabriel Luis Guido', exact: true }).click();
};

test.describe('PEI', () => {
  test('Manual: programas em cards, colunas SD/Resposta/SR+ e excluir com confirmação', async ({
    page,
  }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    const excluidos: any[] = [];
    await abrir(page, excluidos);

    // abre direto no Manual, sem precisar escolher o protocolo
    await expect(
      page.getByRole('radiogroup', { name: 'Protocolo' }).getByRole('radio', { name: 'Manual' })
    ).toHaveAttribute('aria-checked', 'true');

    await expect(page.getByText('PROGRAMAS · 2')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Novo programa' })).toBeVisible();
    const mando = page.getByRole('button', { name: /^Mando/ }).first();
    await expect(mando).toContainText('Tentativa discreta · 2 metas, 1 atingida');

    await mando.click();
    await expect(page.getByTitle('Estímulo discriminativo')).toContainText('O que você quer?');
    await expect(page.getByTitle('Estímulo reforçador positivo')).toContainText('Acesso ao item');
    await expect(page.getByText('META 2')).toBeVisible();
    await expect(page.getByText('Observação:')).toBeVisible();
    await expect(page.getByText('Entregar figura (PECS)')).toBeVisible();

    // relatório num sheet
    await page.getByRole('button', { name: /Relatório de Evolução/ }).click();
    const sheet = page.getByRole('dialog', { name: 'Relatório de Evolução' });
    await expect(sheet.getByRole('button', { name: 'Gerar PDF' })).toBeVisible();
    await sheet.getByRole('button', { name: 'Fechar' }).first().click();
    await expect(sheet).toHaveCount(0);

    // excluir: menu ⋯ → sheet → confirma
    await page.getByRole('button', { name: 'Mais ações de Mando' }).click();
    await page.getByRole('menuitem', { name: 'Excluir programa' }).click();
    const confirma = page.getByRole('dialog', { name: 'Excluir “Mando”?' });
    await confirma.getByRole('button', { name: 'Excluir programa' }).click();

    await expect.poll(() => excluidos.length).toBe(1);
    expect(excluidos[0]).toEqual({ peiIds: [10, 11], pacienteId: 1 });
    await expect(page.getByText('PROGRAMAS · 1')).toBeVisible();

    expect(erros).toEqual([]);
  });

  test('Portage: resultado primeira × atual e o que está em aquisição, com atalho pra avaliar', async ({
    page,
  }) => {
    await abrir(page);
    await page.getByRole('radiogroup', { name: 'Protocolo' }).getByRole('radio', { name: 'Portage' }).click();

    await expect(page.getByText('Resultado do Portage')).toBeVisible();
    await expect(page.getByText('Primeira avaliação (01/08) × atual (20/09)')).toBeVisible();
    await expect(page.getByText('Socialização · 0 a 1 ano')).toBeVisible();
    await expect(page.getByText('50% → 88%')).toBeVisible();
    await expect(page.getByText('60% → 50%')).toBeVisible();

    // em aquisição, agrupado por área · faixa, com a última resposta
    await expect(page.getByText('EM AQUISIÇÃO · 1')).toBeVisible();
    await expect(page.getByText('Socialização · 1 a 2 anos')).toBeVisible();
    await expect(page.getByText('Imita um adulto num jogo simples')).toBeVisible();
    await expect(page.getByText('Às vezes', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Novo programa' })).toHaveCount(0);

    // "Avaliar" abre o Protocolo de Avaliação no mesmo paciente e protocolo
    await page.getByRole('button', { name: 'Avaliar' }).click();
    await expect(page).toHaveURL(/\/protocolo-av$/);
    await expect(
      page.getByRole('radiogroup', { name: 'Protocolo' }).getByRole('radio', { name: 'Portage' })
    ).toHaveAttribute('aria-checked', 'true');
  });
});
