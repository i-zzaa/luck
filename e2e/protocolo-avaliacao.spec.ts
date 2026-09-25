import { test, expect, type Page } from '@playwright/test';

// Protocolo de Avaliação (foms/Protocolo.tsx + Portage.tsx + VBMapp.tsx):
// paciente com "Trocar", seletor único de protocolo, resposta em 3 botões
// (Sim / Às vezes / Não), progresso por faixa/programa, "Só não
// avaliados" e barra de salvar só com resposta não salva.

const it = (id: number, nome: string, selected: any = null, extra: any = {}) => ({
  id,
  nome,
  selected,
  ...extra,
});

const PORTAGE = {
  Socialização: {
    '0 a 1': [
      it(1, 'Observa uma pessoa movimentando-se no seu campo visual', '1'),
      it(2, 'Sorri em resposta à atenção do adulto', '1'),
      it(3, 'Vocaliza em resposta à atenção', '0.5'),
      it(4, 'Olha para a própria mão, sorri ou vocaliza', null),
    ],
    '1 a 2': [
      it(5, 'Imita um adulto num jogo simples', '0.5'),
      it(6, 'Participa de brincadeiras com outra criança', '0', {
        permiteSubitens: true,
        subitems: [
          { id: 51, nome: 'Rolar a bola', selected: '1' },
          { id: 52, nome: 'Esconde-esconde', selected: null },
        ],
      }),
      it(7, 'Abraça, afaga e beija pessoas familiares', null),
    ],
    '2 a 3': [
      it(8, 'Canta e dança ao ouvir música', null),
      it(9, 'Segue regras em jogo de grupo', null),
      it(10, 'Cumprimenta colegas e adultos familiares', null),
    ],
  },
  Cognição: {
    '0 a 1': [it(11, 'Remove um pano do rosto', '1'), it(12, 'Procura um objeto escondido', '0.5')],
    '1 a 2': [
      it(13, 'Coloca objetos dentro de um recipiente', null),
      it(14, 'Aponta partes do corpo quando nomeadas', null),
    ],
  },
};

const VBMAPP = {
  Mando: [
    it(20, 'Emite 2 palavras, sinais ou PECS', '1'),
    it(21, 'Emite 4 mandos diferentes sem dicas', '0.5', {
      permiteSubitens: true,
      subitems: [
        { id: 211, nome: 'Água', selected: '1' },
        { id: 212, nome: 'Bola', selected: null },
      ],
    }),
  ],
  Tato: [it(30, 'Nomeia 2 itens', '1'), it(31, 'Nomeia 4 itens', null)],
};

const mockApi = (page: Page, salvos: { url: string; body: any }[]) =>
  page.route('**/*', (route) => {
    const req = route.request();
    const url = req.url();
    if (url.includes('localhost:')) return route.continue();
    const json = (body: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

    if (url.includes('paciente/dropdown')) return json({ data: [{ id: 1, nome: 'Gabriel Luis Guido' }] });
    if (url.includes('protocolo/portage/dropdown')) return json({ data: PORTAGE });
    if (url.includes('protocolo/dropdown')) {
      return json({
        data: [
          { id: 1, nome: 'Portage', codigo: 'portage' },
          { id: 2, nome: 'VB-MAPP', codigo: 'vbmapp' },
          { id: 3, nome: 'Manual', codigo: 'pei' },
        ],
      });
    }
    if (url.includes('protocolo/filtro')) {
      const b = req.postDataJSON() || {};
      if (b.protocoloId === 1) return json({ portage: PORTAGE });
      if (b.protocoloId === 2) return json({ data: VBMAPP, existeResposta: true });
    }
    if (req.method() === 'POST' && /protocolo\/(portage|vbmapp)$/.test(new URL(url).pathname)) {
      salvos.push({ url, body: req.postDataJSON() });
      return json({ ok: true });
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
        permissoes: ['PEI_FILTRO_BOTAO_CADASTRAR'],
        perfil: { codigo: 'developer' },
      })
    );
  }, [future]);
};

const abrir = async (page: Page, salvos: { url: string; body: any }[] = []) => {
  await mockApi(page, salvos);
  await authInit(page);
  await page.goto('/protocolo-av');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Quem você vai avaliar?')).toBeVisible();
  await page.locator('.p-dropdown').first().click();
  await page.getByRole('option', { name: 'Gabriel Luis Guido', exact: true }).click();
};

test.describe('Protocolo de Avaliação', () => {
  test('Portage: responde com um toque, salva e continua no protocolo', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    const salvos: { url: string; body: any }[] = [];
    await abrir(page, salvos);

    const protocolo = page.getByRole('radiogroup', { name: 'Protocolo' });
    await protocolo.getByRole('radio', { name: 'Portage' }).click();

    // 16 respostas possíveis (itens + subitens), 8 já respondidas
    await expect(page.getByText('8 de 16 itens avaliados no Portage')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Relatório' })).toBeVisible();

    // faixa com progresso e contagem
    const faixa = page.getByRole('button', { name: /1 a 2 anos/ });
    await expect(faixa).toContainText('3 de 5');
    await expect(faixa).toContainText('1 sim · 1 às vezes · 1 não');
    await faixa.click();

    const abraca = page.getByRole('radiogroup', {
      name: 'Resposta: Abraça, afaga e beija pessoas familiares',
    });
    await abraca.getByRole('radio', { name: 'Sim' }).click();
    await expect(page.getByText('1 resposta não salva', { exact: true })).toBeVisible();

    // tocar de novo limpa
    await abraca.getByRole('radio', { name: 'Sim' }).click();
    await expect(page.getByText('1 resposta não salva', { exact: true })).toHaveCount(0);

    await abraca.getByRole('radio', { name: 'Não' }).click();
    // subitem responde igual
    await page
      .getByRole('radiogroup', { name: 'Resposta: Esconde-esconde' })
      .getByRole('radio', { name: 'Às vezes' })
      .click();
    await expect(page.getByText('2 respostas não salvas', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Subitens' })).toBeVisible();

    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect.poll(() => salvos.length).toBe(1);
    const faixaSalva = salvos[0].body.portage['Socialização']['1 a 2'];
    expect(faixaSalva[2].selected).toBe('0');
    expect(faixaSalva[1].subitems[1].selected).toBe('0.5');

    // continua no Portage, sem barra de salvar
    await expect(page.getByText('respostas não salvas')).toHaveCount(0);
    await expect(protocolo.getByRole('radio', { name: 'Portage' })).toHaveAttribute(
      'aria-checked',
      'true'
    );

    expect(erros).toEqual([]);
  });

  test('Portage: "Só não avaliados" filtra o que falta', async ({ page }) => {
    await abrir(page);
    await page.getByRole('radiogroup', { name: 'Protocolo' }).getByRole('radio', { name: 'Portage' }).click();
    await page.getByRole('button', { name: /0 a 1 ano/ }).click();
    await expect(page.getByText('Sorri em resposta à atenção do adulto')).toBeVisible();

    await page.getByRole('button', { name: 'Só não avaliados' }).click();
    await expect(page.getByText('Sorri em resposta à atenção do adulto')).toHaveCount(0);
    await expect(page.getByText('Olha para a própria mão, sorri ou vocaliza')).toBeVisible();

    // outra área
    await page.getByRole('radiogroup', { name: 'Área' }).getByRole('radio', { name: 'Cognição' }).click();
    await page.getByRole('button', { name: /0 a 1 ano/ }).click();
    await expect(page.getByText('Todos os itens desta parte já foram avaliados.')).toBeVisible();
  });

  test('VB-MAPP: ao trocar com resposta não salva, oferece salvar ou descartar', async ({
    page,
  }) => {
    const salvos: { url: string; body: any }[] = [];
    await abrir(page, salvos);
    const protocolo = page.getByRole('radiogroup', { name: 'Protocolo' });
    await protocolo.getByRole('radio', { name: 'VB-MAPP' }).click();

    await page.getByRole('button', { name: /Mando/ }).click();
    await expect(page.getByRole('button', { name: 'Editar atividades do programa' })).toBeVisible();
    const bola = page.getByRole('radiogroup', { name: 'Resposta: Bola' });
    await bola.getByRole('radio', { name: 'Sim' }).click();
    await expect(page.getByText('1 resposta não salva', { exact: true })).toBeVisible();

    const nivel = page.getByRole('radiogroup', { name: 'Nível' });
    const sheet = page.getByRole('dialog', { name: '1 resposta não salva' });

    // trocar de nível abre o sheet; fechar mantém tudo
    await nivel.getByRole('radio', { name: 'Nível 2' }).click();
    await expect(sheet).toContainText('Salve antes de trocar de nível');
    await sheet.getByRole('button', { name: 'Fechar' }).click();
    await expect(sheet).toHaveCount(0);
    await expect(nivel.getByRole('radio', { name: 'Nível 1' })).toHaveAttribute('aria-checked', 'true');

    // descartar troca de nível sem salvar
    await nivel.getByRole('radio', { name: 'Nível 2' }).click();
    await sheet.getByRole('button', { name: 'Descartar' }).click();
    await expect(nivel.getByRole('radio', { name: 'Nível 2' })).toHaveAttribute('aria-checked', 'true');
    expect(salvos).toHaveLength(0);

    // salvar antes de trocar de protocolo
    await page.getByRole('button', { name: /Mando/ }).click();
    await page
      .getByRole('radiogroup', { name: 'Resposta: Bola' })
      .getByRole('radio', { name: 'Não' })
      .click();
    await protocolo.getByRole('radio', { name: 'Portage' }).click();
    await expect(sheet).toContainText('Salve antes de trocar de protocolo');
    await sheet.getByRole('button', { name: 'Salvar' }).click();

    await expect.poll(() => salvos.length).toBe(1);
    expect(salvos[0].url).toMatch(/protocolo\/vbmapp$/);
    expect(salvos[0].body.vbmapp.Mando[1].subitems[1].selected).toBe('0');
    await expect(protocolo.getByRole('radio', { name: 'Portage' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await expect(page.getByText('itens avaliados no Portage', { exact: false })).toBeVisible();
  });
});
