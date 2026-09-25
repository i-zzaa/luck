import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Massa de dados pedida pra validar o layout do Relatório de Evolução
// (pages/PEI.tsx -> constants/pdfRelatorioEvolucao.ts) num cenário
// denso de verdade — não o caminho feliz com 1 item aqui, 1 ali. Fica
// aqui, versionada, em vez de um script descartável, justamente pra
// poder rodar de novo (`npx playwright test e2e/relatorio-evolucao`)
// toda vez que o layout for mexido, sem precisar remontar o cenário do
// zero.
//
// NÃO é um teste de regressão visual pixel-a-pixel — o cabeçalho do PDF
// estampa a data de hoje (moment().format('DD/MM/YYYY')), então um
// snapshot exato quebraria sozinho todo dia. O que valida aqui:
// (1) o fluxo completo gera um PDF válido, sem erro de console;
// (2) salva o PDF em test-results/ (gitignored) pra conferência visual
// manual — é o artefato que importa pra essa massa de dados.

// Portage: 3 avaliações. As tabelas mostram só as duas pontas (primeira
// e atual — o backend já escolhe, ver portageRelatorio abaixo); a
// reavaliação do meio aparece só no gráfico comparativo. 4 faixas etárias por avaliação, com "Não se
// aplica" numa delas — cenário pedido explicitamente pra validar o
// layout com mais níveis (0-1, 1-2, 2-3, 3-4).
const PORTAGE_RESPONSE = {
  paciente: { nome: 'Gabriel Luis Guido', dataNascimento: '01/02/2023' },
  headers: [
    '',
    'Avaliação 31/08/2026',
    'Reavaliação 24/08/2026',
    'Reavaliação 20/08/2026',
  ],
  Socializacao: [
    ['3 a 4', '77%', '65%', '50%'],
    ['2 a 3', '91%', '80%', '70%'],
    ['1 a 2', '100%', '100%', '90%'],
    ['0 a 1', '100%', '100%', '100%'],
  ],
  Cognicao: [
    ['3 a 4', '86%', '70%', 'Não se aplica'],
    ['2 a 3', '95%', '85%', '60%'],
    ['1 a 2', '100%', '100%', '100%'],
    ['0 a 1', '100%', '100%', '100%'],
  ],
};

// VB-MAPP: 3 níveis, cada um com vários programas, cada programa com
// até 10 itens (grade cheia) e percentuais variados (100/50/0) — pra
// ver as 3 cores de nível e o preenchimento parcial (50%) de verdade,
// não só uma grade quase vazia. Também inclui nome de programa longo
// ("Intraverbal", "Grupo") pra validar o encolhimento de fonte no
// cabeçalho da coluna.
const itensPrograma = (percentuais: number[]) =>
  Object.fromEntries(
    percentuais.map((percentual, index) => [`item-${index + 1}`, { percentual }])
  );

const construirNivel = (programas: string[]) => ({
  '08/09/2026': Object.fromEntries(
    programas.map((nome, indice) => [
      nome,
      itensPrograma(
        [100, 100, 100, 50, 50, 0, 0, 100, 50, 0].slice(0, 10 - indice)
      ),
    ])
  ),
});

const VBMAPP_RESPONSE = {
  paciente: { nome: 'Gabriel Luis Guido', dataNascimento: '01/02/2023' },
  data: {
    1: construirNivel([
      'Mando',
      'Tato',
      'Ouvinte',
      'MTS',
      'Brincar',
      'Social',
      'Imitação',
      'Ecóico',
      'Vocal',
    ]),
    2: construirNivel([
      'Mando',
      'Tato',
      'Ouvinte',
      'VP/MTS',
      'Brincar',
      'Social',
      'Imitação',
      'Leitura',
    ]),
    3: construirNivel(['Mando', 'Tato', 'Ouvinte', 'Intraverbal', 'Grupo']),
  },
};

// Manual: 3 programas, com os 3 status possíveis (atingida, aquisição,
// atingida-em-manutenção) — o pedido explícito de "metas atingidas e em
// aquisição" pra validar a cor/ícone de cada uma.
//
// procedimentoEnsino/SD/Resposta/SR+ vivem no nível da SEÇÃO (do
// programa), não em cada meta — é assim que o backend de verdade
// devolve (PeiService.agruparPeiPorPrograma/mesclarMetas mescla vários
// registros Pei num programa só, mas só o primeiro registro empresta
// esses campos pro grupo inteiro; nenhuma meta individual carrega
// isso). Um programa sem esses campos (Imitação Motora), pra cobrir o
// caso de seção sem procedimento/tabela nenhum.
const PEI_RESPONSE = [
  {
    id: 1,
    programa: { id: 5, nome: 'Comportamental' },
    peiIds: [10, 11],
    procedimentoEnsino: {
      nome: 'PROCEDIMENTO DE ENSINO: ENSINO ESTRUTURADO - DTT - TREINO DE TENTATIVAS DISCRETAS',
    },
    estimuloDiscriminativo:
      'Terapeuta pegar estímulo reforçador e colocar na frente dos olhos por 5 segundos.',
    resposta: 'Cliente manter o contato visual por 5 segundos',
    estimuloReforcadorPositivo: 'Ganhar o reforço',
    metas: [
      {
        id: 100,
        value: 'continuar estimulando o contato visual para que mantenha por 3 segundos',
        status: 'atingida',
        observacao: 'Visto que Joaquim responde mas ainda não tem a iniciativa de cumprimentar.',
        subitems: [
          { id: 1, value: '5 segundos' },
          { id: 2, value: '8 segundos' },
        ],
      },
      {
        id: 101,
        value:
          'continuar estimulando interesse por contato físico como abraços, colo e outras brincadeiras motoras',
        status: 'aquisicao',
        observacao: 'Visto que Joaquim aceita mas ainda não tem a iniciativa de buscar o contato.',
        subitems: [],
      },
      {
        id: 102,
        value: 'estimular habilidades sociais de forma geral (seguir regras, dividir brinquedo, esperar sua vez)',
        status: 'manutencao',
        subitems: [],
      },
    ],
  },
  {
    id: 2,
    programa: { id: 6, nome: 'Operantes Verbais - Mando' },
    peiIds: [12],
    procedimentoEnsino: { nome: 'PROCEDIMENTO DE ENSINO: ENSINO NATURALISTA' },
    estimuloDiscriminativo: 'Presença do item desejado',
    resposta: 'Cliente emitir as respostas',
    estimuloReforcadorPositivo: 'Ganhar o item desejado',
    metas: [
      {
        id: 200,
        value: 'estimular que continue sempre pedindo por itens utilizando frases inteligíveis',
        status: 'atingida',
        subitems: [],
      },
      {
        id: 201,
        value: 'emitir mando para retirar estímulo aversivo',
        status: 'aquisicao',
        subitems: [
          { id: 3, value: 'espera' },
          { id: 4, value: 'descansar' },
        ],
      },
    ],
  },
  {
    id: 3,
    programa: { id: 7, nome: 'Imitação Motora' },
    peiIds: [13],
    metas: [
      {
        id: 300,
        value: 'imitar 10 sequências motoras de 2 componentes diferentes',
        status: 'atingida',
        subitems: [],
      },
    ],
  },
];

// --- Formato atual: GET /paciente/:id/relatorio-evolucao (item 20) ---
// O PDF vem todo de uma chamada só (ver pdfRelatorioEvolucao.ts:
// RelatorioEvolucao). As massas acima continuam sendo a fonte do
// cenário — só são convertidas pro formato que o backend devolve hoje.

const classificar = (percentual: number | null) => {
  if (percentual === null) return 'na';
  if (percentual >= 80) return 'alto';
  if (percentual >= 50) return 'medio';
  return 'baixo';
};

const paraPercentual = (texto: string) =>
  texto === 'Não se aplica' ? null : Number(texto.replace('%', ''));

const paraIso = (dataBr: string) => {
  const [dia, mes, ano] = dataBr.split('/');
  return `${ano}-${mes}-${dia}`;
};

// headers[1] é a avaliação mais recente e a última coluna a primeira —
// o backend já escolhe as duas pontas (primeira e atual) e manda a
// reavaliação do meio só no comparativo.
const portageRelatorio = () => {
  const areas = ['Socializacao', 'Cognicao'] as const;
  const nomes = { Socializacao: 'Socialização', Cognicao: 'Cognição' };
  const colunas = PORTAGE_RESPONSE.headers.slice(1);
  const faixas = PORTAGE_RESPONSE.Socializacao.map((linha) => linha[0]);

  const avaliacao = (tipo: 'primeira' | 'atual', coluna: number) => {
    const data = colunas[coluna].split(' ')[1];
    return {
      tipo,
      titulo: tipo === 'primeira' ? 'Primeira avaliação' : 'Avaliação atual',
      data: paraIso(data),
      faixasEtarias: faixas,
      categorias: areas.map((area) => ({
        nome: nomes[area],
        valores: PORTAGE_RESPONSE[area].map((linha) => {
          const percentual = paraPercentual(linha[coluna + 1]);
          return { faixa: linha[0], percentual, classificacao: classificar(percentual) };
        }),
      })),
    };
  };

  const media = (valores: (number | null)[]) => {
    const v = valores.filter((n): n is number => n !== null);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
  };

  return {
    avaliacoes: [avaliacao('primeira', colunas.length - 1), avaliacao('atual', 0)],
    comparativo: areas.map((area) => ({
      categoria: nomes[area],
      sessoes: colunas
        .map((titulo, c) => ({
          titulo,
          media: media(PORTAGE_RESPONSE[area].map((linha) => paraPercentual(linha[c + 1]))),
        }))
        .reverse(),
    })),
  };
};

const PREENCHIMENTO: Record<number, 'cheio' | 'metade' | 'vazio'> = {
  100: 'cheio',
  50: 'metade',
  0: 'vazio',
};

// Grade de 10 slots por programa (null = slot sem atividade).
const vbmappRelatorio = () => ({
  niveis: Object.entries(VBMAPP_RESPONSE.data).map(([nivel, porData]) => ({
    nivel: Number(nivel),
    sessoes: Object.entries(porData).map(([data, programas]) => ({
      data: paraIso(data),
      programas: Object.entries(programas as Record<string, any>).map(([nome, itens]) => {
        const slots: any[] = Object.entries(itens).map(([atividade, v]: any) => ({
          atividade,
          preenchimento: PREENCHIMENTO[v.percentual],
        }));
        while (slots.length < 10) slots.push(null);
        return { nome, slots };
      }),
    })),
  })),
});

const RELATORIO_RESPONSE = {
  paciente: { nome: 'Gabriel Luis Guido', dataNascimento: '2023-02-01T00:00:00.000Z' },
  numeroIntervencao: 3,
  dataEmissao: '2026-09-24',
  temDados: true,
  portage: portageRelatorio(),
  vbmapp: vbmappRelatorio(),
  manual: PEI_RESPONSE,
  condutaSugerida: null,
};

const CLINICA_RESPONSE = {
  nome: 'Clínica Teste',
  telefone: '(00) 0000-0000',
  email: 'contato@clinica.teste',
  cnpj: '00.000.000/0001-00',
  endereco: 'Rua Teste, 123',
};

const authInit = (page: Page) => {
  const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  return page.addInitScript(([tokenVal]) => {
    // Sessão falsa no formato atual do AuthProvider (contexts/auth.tsx):
    // token + auth + expiresAt no futuro, perfil em user.perfil.codigo.
    // A tela PEI só mostra o seletor de paciente com a permissão dele.
    sessionStorage.setItem('token', 'token-teste');
    sessionStorage.setItem('expiresAt', tokenVal as string);
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
    // window.open é como o app abre o blob do PDF gerado — captura a
    // URL em vez de tentar abrir uma aba de verdade (Playwright não
    // renderiza PDF nativamente).
    (window as any).__blobUrl = null;
    window.open = (url?: string | URL) => {
      (window as any).__blobUrl = url;
      return null;
    };
  }, [future]);
};

// localhost:3010 (não "localhost:" genérico) é de propósito — a porta
// desse próprio webServer de teste (ver playwright.config.ts); um
// backend de verdade rodando em outra porta local (ex.: heron-list-nest
// em desenvolvimento, na 3000) não deve ser alcançado nem por acidente
// aqui.
const mockApi = (page: Page) =>
  page.route('**/*', (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (url.includes('localhost:3010')) return route.continue();

    if (url.includes('/paciente/dropdown')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: 79, nome: 'Gabriel Luis Guido' }] }),
      });
    }
    if (url.includes('/protocolo/dropdown')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: 3, nome: 'Manual', codigo: 'pei' }] }),
      });
    }
    if (url.includes('/pei/filtro') && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ itens: PEI_RESPONSE, tabelaComparativa: null }),
      });
    }
    if (url.includes('/relatorio-evolucao') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(RELATORIO_RESPONSE),
      });
    }
    if (url.includes('/clinica/dados')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CLINICA_RESPONSE),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

test.describe('Relatório de Evolução (pages/PEI.tsx)', () => {
  test('gera um PDF válido com Portage (4 faixas etárias) + VB-MAPP (3 níveis cheios) + Manual (status mistos)', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await mockApi(page);
    await authInit(page);

    await page.goto('/pei');
    await page.waitForLoadState('networkidle');

    await page.locator('.p-dropdown').first().click();
    await page.getByText('Gabriel Luis Guido').click();

    // O relatório agora abre num bottom sheet (conduta + "Gerar PDF").
    await page.getByRole('button', { name: /Relatório de Evolução/ }).click();
    const botaoRelatorio = page
      .getByRole('dialog', { name: 'Relatório de Evolução' })
      .getByRole('button', { name: 'Gerar PDF' });
    await expect(botaoRelatorio).toBeVisible();
    await botaoRelatorio.click();

    await expect
      .poll(() => page.evaluate(() => (window as any).__blobUrl))
      .not.toBeNull();

    const blobUrl: string = await page.evaluate(() => (window as any).__blobUrl);
    const base64 = await page.evaluate(async (url) => {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      let binary = '';
      new Uint8Array(buffer).forEach((byte) => (binary += String.fromCharCode(byte)));
      return btoa(binary);
    }, blobUrl);
    const pdfBuffer = Buffer.from(base64, 'base64');

    expect(pdfBuffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdfBuffer.byteLength).toBeGreaterThan(50_000);
    expect(errors).toEqual([]);

    // Artefato pra conferência visual manual — não versionado (ver
    // .gitignore: test-results/), só pra quem rodar o teste abrir e
    // olhar o layout de verdade.
    const outDir = path.join('test-results', 'relatorio-evolucao');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'relatorio-evolucao-massa-teste.pdf'), pdfBuffer);
  });
});
