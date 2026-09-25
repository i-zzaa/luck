import { test, expect, type Page } from '@playwright/test';

// Tela de Sessão (pages/session/Session.tsx): cabeçalho da sessão,
// progresso + "Metas", seletor Manual · Portage · VB-MAPP, cards por
// programa com SD/Resposta/SR+ em colunas, placar por item, aviso das 4
// corretas seguidas, manutenção do protocolo escolhido e resumo com o que
// falta acima do Salvar. Os controles de registro (CheckboxDTT/SN) são os
// de sempre.

const slots = (v: (string | null)[] = []) => Array.from({ length: 10 }, (_, i) => v[i] ?? null);

const sessao = (modo: 'nova' | 'leitura') => ({
  modo,
  resumo: modo === 'leitura' ? '<p>Sessão tranquila.</p>' : '',
  evento: {
    id: 3,
    title: 'Miguel Santos',
    data: { start: '08:00', end: '08:50' },
    statusEventos: { codigo: 'confirmado', nome: 'Confirmado' },
    localExibicao: 'Consultório 2',
    modalidadeExibicao: 'Presencial',
    especialidade: { codigo: 'PSICO', nome: 'Psicologia' },
  },
  sessao: [
    {
      key: 'p1',
      label: 'Mando',
      estimuloDiscriminativo: 'O que você quer?',
      resposta: 'Pedir o item',
      estimuloReforcadorPositivo: 'Acesso ao item',
      children: [
        {
          key: 'm1',
          label: 'Emite 2 palavras, sinais ou PECS',
          children: [
            { key: 'a1', label: 'Apontar', children: slots(['C', 'DV', 'C', 'C', 'C', 'C']) },
            { key: 'a2', label: 'Pedir dá', children: slots(['DT', 'DP']) },
            { key: 'a3', label: 'Dizer bola', children: slots() },
          ],
        },
      ],
    },
  ],
  portage: [
    {
      key: 'pp1',
      label: 'Socialização',
      children: [
        {
          key: 'pm1',
          label: 'Participa de brincadeiras com outra criança',
          estimuloDiscriminativo: 'Vamos brincar?',
          children: [{ key: 'pa1', label: 'Rolar a bola', children: slots(['C']) }],
        },
      ],
    },
  ],
  vbmapp: [
    {
      key: 'n1',
      label: 'Nível 1',
      children: [
        // programa sem metas antes do Mando: o índice do Mando na árvore é 1
        { key: 'vp0', label: 'Tato', children: [] },
        {
          key: 'vp1',
          label: 'Mando',
          children: [
            {
              key: 'vm1',
              label: 'Emite 4 mandos diferentes',
              children: [{ key: 'va1', label: 'Água', children: slots() }],
            },
          ],
        },
      ],
    },
  ],
  maintenance: {
    manual: [
      {
        key: 'mp',
        label: 'Contato visual',
        children: [{ key: 'mm', label: 'Olhar ao ser chamado', children: [null] }],
      },
    ],
    vbmapp: [],
    portage: [],
  },
});

// URLs do GET da sessão — o dia da ocorrência tem que ir junto (?data=).
const buscas: string[] = [];

const mockApi = (page: Page, modo: 'nova' | 'leitura', salvos: any[]) =>
  page.route('**/*', (route) => {
    const req = route.request();
    const url = req.url();
    if (url.includes('localhost:')) return route.continue();
    const json = (b: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
    if (url.includes('/sessao/config')) return json({ minResumoLength: 20 });
    if (url.includes('/sessao/calendario/3')) {
      if (req.method() === 'PUT') {
        salvos.push(req.postDataJSON());
        return json({ ok: true });
      }
      buscas.push(url);
      return json(sessao(modo));
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
      JSON.stringify({ id: 1, login: 'terapeuta.teste', nome: 'Teste', permissoes: ['*'], perfil: { codigo: 'terapeuta' } })
    );
  }, [future]);
};

test.describe('Sessão', () => {
  test('registrar: seletor de protocolo, 4 corretas seguidas e resumo antes de salvar', async ({
    page,
  }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    const salvos: any[] = [];
    await mockApi(page, 'nova', salvos);
    await authInit(page);
    await page.goto('/session/3?data=2026-09-24');
    await page.waitForLoadState('networkidle');

    // o GET leva o dia: numa série, é ele que escolhe o registro de sessão
    expect(buscas.some((u) => u.includes('/sessao/calendario/3?data=2026-09-24'))).toBe(true);

    // cabeçalho e progresso da sessão inteira (5 itens, 3 com tentativa)
    await expect(page.getByText('Miguel Santos')).toBeVisible();
    await expect(page.getByText('Quinta, 24/09 · 08:00–08:50')).toBeVisible();
    await expect(page.getByText('3 de 5 itens com tentativas')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Metas' })).toBeVisible();

    // seletor com os três protocolos
    const protocolo = page.getByRole('radiogroup', { name: 'Protocolo' });
    await expect(protocolo.getByRole('radio', { name: 'Manual · 2/3' })).toHaveAttribute('aria-checked', 'true');

    // Manual: colunas, placar e o aviso de 4 corretas seguidas no "Apontar"
    await expect(page.getByTitle('Estímulo discriminativo')).toContainText('O que você quer?');
    await expect(page.getByText('5/6 corretas')).toBeVisible();
    // etiqueta pequena ao lado do placar, só no item que fechou 4 seguidas
    await expect(page.getByText('4 seguidas', { exact: true })).toHaveCount(1);
    await expect(page.getByText('Interrompa o item ao atingir 4 corretas seguidas.')).toBeVisible();
    await expect(page.getByText('MANUTENÇÃO · MANUAL')).toBeVisible();

    // VB-MAPP: nível · programa num card só; programa vazio não aparece
    await protocolo.getByRole('radio', { name: 'VB-MAPP · 0/1' }).click();
    await expect(page.getByRole('button', { name: /Nível 1 · Mando/ })).toBeVisible();
    await expect(page.getByText('Nível 1 · Tato')).toHaveCount(0);
    await expect(page.getByText('MANUTENÇÃO · MANUAL')).toHaveCount(0);

    // registrar no VB-MAPP cai no item certo (índice original do programa)
    await page.locator('.p-multistatecheckbox').first().click();
    await expect(protocolo.getByRole('radio', { name: 'VB-MAPP · 1/1' })).toBeVisible();

    // resumo curto: o salvar não envia (validação do hook, com toast)
    await page.getByRole('button', { name: 'Salvar' }).click();
    expect(salvos).toHaveLength(0);

    // resumo completo salva
    const editor = page.locator('[contenteditable="true"]');
    await editor.click();
    await editor.type('Sessão tranquila, boa participação.');
    await page.getByText('Miguel Santos').click(); // blur
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect.poll(() => salvos.length).toBe(1);
    const va1 = salvos[0].respostas.find((r: any) => r.nodeKey === 'va1');
    expect(va1.protocolo).toBe('vbmapp');
    expect(va1.slots[0]).not.toBeNull();

    expect(erros).toEqual([]);
  });

  test('sessão registrada: só leitura, sem "Metas", sem Salvar e sem avisos de treino', async ({ page }) => {
    await mockApi(page, 'leitura', []);
    await authInit(page);
    await page.goto('/session/3?data=2026-09-24');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Atendida', { exact: true })).toBeVisible();
    // o treino acabou: nem a etiqueta nem a dica das 4 seguidas
    await expect(page.getByText('4 seguidas', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Interrompa o item ao atingir 4 corretas seguidas.')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Metas' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Salvar' })).toHaveCount(0);
    await expect(page.getByText('Somente leitura')).toBeVisible();
  });
});
