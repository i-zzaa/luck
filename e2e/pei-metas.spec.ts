import { test, expect, type Page } from '@playwright/test';

// Edição de um programa do Manual (PEI) — cards de meta recolhíveis,
// itens de uma linha, desfazer exclusão, observação opcional
// e validação só da descrição da meta (ver foms/pei/MetaCard.tsx).

const ITEM = {
  id: 10,
  peiIds: [10],
  paciente: { id: 1, nome: 'Ana' },
  programa: { id: 7, nome: 'Mando' },
  procedimentoEnsino: { id: 1, nome: 'Tentativa discreta' },
  estimuloDiscriminativo: 'O que você quer?',
  resposta: 'Pedir o item',
  estimuloReforcadorPositivo: 'Acesso ao item',
  metas: [
    {
      id: '7-meta-0',
      value: 'Emite 2 palavras, sinais ou PECS.',
      status: 'aquisicao',
      subitems: [
        { id: '7-meta-0-sub-item-0', value: 'Apontar' },
        { id: '7-meta-0-sub-item-1', value: 'Pedir dá' },
        { id: '7-meta-0-sub-item-2', value: 'Dizer bola' },
      ],
    },
    {
      id: '7-meta-1',
      value: 'Nomeia 4 objetos do cotidiano.',
      status: 'atingida',
      observacao: 'Melhor com objetos reais.',
      conclusao: 'Atingida sem dica.',
      subitems: [{ id: '7-meta-1-sub-item-0', value: 'Bola' }],
    },
  ],
};

const DROPDOWNS: Record<string, any[]> = {
  'paciente/dropdown': [{ id: 1, nome: 'Ana' }],
  'protocolo/dropdown': [{ id: 3, nome: 'Manual', codigo: 'pei' }],
  'programa/3/dropdown': [{ id: 7, nome: 'Mando' }],
  'pei/procedimento-ensino/dropdown': [{ id: 1, nome: 'Tentativa discreta' }],
};

const mockApi = (page: Page, salvos: any[]) =>
  page.route('**/*', (route) => {
    const request = route.request();
    const url = request.url();
    if (url.includes('localhost:')) return route.continue();

    if (request.method() === 'PUT' && /\/pei$/.test(new URL(url).pathname)) {
      salvos.push(request.postDataJSON());
    }

    const chave = Object.keys(DROPDOWNS).find((k) => url.includes(k));
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: chave ? DROPDOWNS[chave] : [] }),
    });
  });

// Sessão falsa: AuthProvider só restaura com token + auth + expiresAt
// ainda no futuro (ver contexts/auth.tsx).
const authInit = (page: Page) => {
  const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  return page.addInitScript(([tokenVal]) => {
    sessionStorage.setItem('token', 'token-teste');
    sessionStorage.setItem('expiresAt', tokenVal as string);
    sessionStorage.setItem(
      'auth',
      JSON.stringify({
        id: 1,
        login: 'terapeuta.teste',
        nome: 'Teste',
        permissoes: ['*'],
        perfil: { codigo: 'developer' },
      })
    );
  }, [future]);
};

// Mesma navegação de PEI.tsx/handleEditPrograma: /protocolo-av com
// `state.edit` (react-router guarda o state em history.state.usr).
const abrirEdicao = async (page: Page) => {
  await page.goto('/home');
  await page.waitForLoadState('networkidle');
  await page.evaluate((item) => {
    window.history.pushState(
      {
        usr: { edit: true, item, programa: item.programa, tipoProtocolo: 3 },
        key: 'edicao',
        idx: 1,
      },
      '',
      '/protocolo-av'
    );
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
  }, ITEM);
  await expect(page.getByRole('button', { name: /Meta 1/ })).toBeVisible();
};

test.describe('Cadastro de metas do PEI (Manual)', () => {
  test('edita metas e salva só o que foi preenchido', async ({ page }) => {
    const salvos: any[] = [];
    await mockApi(page, salvos);
    await authInit(page);
    await abrirEdicao(page);

    // edição = tela de detalhe: sem tab bar
    await expect(page.locator('nav.rounded-full')).toHaveCount(0);

    // Meta 1 aberta; Meta 2 recolhida com resumo
    await expect(page.getByLabel('Item 1', { exact: true })).toHaveValue('Apontar');
    const meta2 = page.locator('article').nth(1);
    await expect(meta2.getByText('1 item')).toBeVisible();
    await expect(meta2.getByText('Observação')).toBeVisible();
    // a conclusão saiu do PEI: nem no resumo, mesmo com dado antigo
    await expect(meta2.getByText('Conclusão')).toHaveCount(0);

    // excluir item com desfazer
    await page.getByRole('button', { name: 'Excluir item 2' }).click();
    await expect(page.getByText('Item “Pedir dá” excluído')).toBeVisible();
    await expect(page.getByLabel('Item 2', { exact: true })).toHaveValue('Dizer bola');
    await page.getByRole('button', { name: 'Desfazer' }).click();
    await expect(page.getByLabel('Item 2', { exact: true })).toHaveValue('Pedir dá');

    // Enter cria o próximo item, já focado
    await page.getByLabel('Item 3', { exact: true }).press('Enter');
    await expect(page.getByLabel('Item 4', { exact: true })).toBeFocused();
    await page.keyboard.type('Dizer água');

    // item vazio é descartado ao salvar
    await page.getByRole('button', { name: 'Adicionar item' }).click();
    await expect(page.getByLabel('Item 5', { exact: true })).toBeFocused();

    // observação opcional, atrás do botão "+"; conclusão não existe mais
    await expect(page.getByRole('button', { name: 'Adicionar conclusão' })).toHaveCount(0);
    await expect(page.getByLabel('Observação', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Adicionar observação' }).click();
    await page.getByLabel('Observação', { exact: true }).fill('Em andamento.');


    // meta nova sem descrição bloqueia o salvar com aviso no lugar certo
    await page.getByRole('button', { name: 'Adicionar meta' }).click();
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByRole('alert')).toContainText('A meta 3 está sem descrição');
    expect(salvos).toHaveLength(0);


    // exclui a meta 3 pelo menu e salva
    await page.getByRole('button', { name: 'Mais ações da meta 3' }).click();
    await page.getByRole('menuitem', { name: 'Excluir meta' }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect.poll(() => salvos.length).toBe(1);
    const [payload] = salvos;
    expect(payload.metas).toHaveLength(2);
    expect(payload.metas[0].subitems.map((s: any) => s.value)).toEqual([
      'Apontar',
      'Pedir dá',
      'Dizer bola',
      'Dizer água',
    ]);
    expect(payload.metas[0]).toMatchObject({ status: 'aquisicao', observacao: 'Em andamento.' });
    expect(payload.metas[1]).toMatchObject({
      status: 'atingida',
      observacao: 'Melhor com objetos reais.',
    });
  });

  test('duplica uma meta sem copiar o status', async ({ page }) => {
    const salvos: any[] = [];
    await mockApi(page, salvos);
    await authInit(page);
    await abrirEdicao(page);

    await page.getByRole('button', { name: 'Mais ações da meta 1' }).click();
    await page.getByRole('menuitem', { name: 'Duplicar meta' }).click();

    await expect(page.locator('article')).toHaveCount(3);
    await expect(page.getByLabel('Item 3', { exact: true })).toHaveValue('Dizer bola');

    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect.poll(() => salvos.length).toBe(1);
    const [payload] = salvos;
    expect(payload.metas.map((m: any) => m.value)).toEqual([
      'Emite 2 palavras, sinais ou PECS.',
      'Emite 2 palavras, sinais ou PECS.',
      'Nomeia 4 objetos do cotidiano.',
    ]);
    expect(payload.metas[1].status).toBeUndefined();
    expect(new Set(payload.metas.map((m: any) => m.id)).size).toBe(3);
  });
});
