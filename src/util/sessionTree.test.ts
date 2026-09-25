import { describe, expect, it } from 'vitest';
import {
  extractRespostas,
  isObj,
  isPrimitiveOrNull,
  isResumoVazio,
  mesclarRespostas,
  resumoTextLength,
} from './sessionTree';

describe('isResumoVazio', () => {
  it('considera vazio: string vazia, null, undefined', () => {
    expect(isResumoVazio('')).toBe(true);
    expect(isResumoVazio(null as any)).toBe(true);
    expect(isResumoVazio(undefined as any)).toBe(true);
  });

  it('considera vazio um editor Tiptap "vazio" (só tags/espaços, sem texto)', () => {
    expect(isResumoVazio('<p></p>')).toBe(true);
    expect(isResumoVazio('<p>&nbsp;</p>')).toBe(true);
    expect(isResumoVazio('<p>   </p>')).toBe(true);
  });

  it('não considera vazio quando há texto de verdade', () => {
    expect(isResumoVazio('<p>Sessão tranquila, paciente participou bem.</p>')).toBe(false);
  });
});

describe('resumoTextLength', () => {
  it('conta só o texto visível, sem as tags', () => {
    expect(resumoTextLength('<p>abc</p>')).toBe(3);
  });

  it('conta &nbsp; como 1 caractere (espaço), não zero', () => {
    expect(resumoTextLength('<p>a&nbsp;b</p>')).toBe(3); // "a b"
  });

  it('é 0 pra editor vazio, null ou undefined', () => {
    expect(resumoTextLength('<p></p>')).toBe(0);
    expect(resumoTextLength(null as any)).toBe(0);
    expect(resumoTextLength(undefined as any)).toBe(0);
  });

  it('não conta espaços nas pontas (trim)', () => {
    expect(resumoTextLength('<p>   abc   </p>')).toBe(3);
  });
});

describe('extractRespostas', () => {
  it('gera uma resposta por folha (children = slots), com a key em string', () => {
    const nodes = [{ key: 10, children: ['+', null, '-'] }];
    expect(extractRespostas(nodes, 'portage')).toEqual([
      { nodeKey: '10', protocolo: 'portage', slots: ['+', null, '-'] },
    ]);
  });

  it('desce até as folhas e ignora nós internos (programa -> meta -> ato)', () => {
    const nodes = [
      {
        key: 'programa-1',
        children: [
          { key: 'meta-1', children: ['+', null] },
          {
            key: 'meta-2',
            children: [
              { key: 'ato-1', children: [null, null] },
              { key: 'ato-2', children: ['-', '+'] },
            ],
          },
        ],
      },
    ];
    expect(extractRespostas(nodes, 'manual').map((r) => r.nodeKey)).toEqual([
      'meta-1',
      'ato-1',
      'ato-2',
    ]);
  });

  it('manda folha sem nada marcado também (slots só null)', () => {
    const nodes = [{ key: 'm', children: [null] }];
    expect(extractRespostas(nodes, 'manutencao')).toEqual([
      { nodeKey: 'm', protocolo: 'manutencao', slots: [null] },
    ]);
  });

  it('ignora nó sem children/sem key e árvore vazia/indefinida', () => {
    expect(extractRespostas([{ key: 'x' }, { children: ['+'] }], 'vbmapp')).toEqual([]);
    expect(extractRespostas([], 'vbmapp')).toEqual([]);
    expect(extractRespostas(undefined as any, 'vbmapp')).toEqual([]);
  });
});

describe('isObj / isPrimitiveOrNull', () => {
  it('isObj: true só pra objeto plano (não array, não null)', () => {
    expect(isObj({})).toBe(true);
    expect(isObj([])).toBe(false);
    // isObj usa curto-circuito (v && ...): pra valores falsy, devolve o
    // próprio valor (null, '', 0), não o literal `false` — por isso
    // toBeFalsy() aqui, não toBe(false).
    expect(isObj(null)).toBeFalsy();
    expect(isObj('x')).toBeFalsy();
    expect(isObj(0)).toBeFalsy();
  });

  it('isPrimitiveOrNull: oposto de isObj, com null incluído', () => {
    expect(isPrimitiveOrNull(null)).toBe(true);
    expect(isPrimitiveOrNull('+')).toBe(true);
    expect(isPrimitiveOrNull({})).toBe(false);
  });
});

describe('mesclarRespostas', () => {
  // Cenário real: a terapeuta treina uma meta, abre "Adicionar metas" e
  // volta — o planejamento novo chega com todos os slots vazios.
  const arvoreNova = [
    {
      key: 'programa-1',
      children: [
        { key: 'meta-0', children: [null, null, null] },
        { key: 'meta-1', children: [null, null, null] },
      ],
    },
  ];

  it('mantém o que já estava preenchido na tela', () => {
    const atual = [
      {
        key: 'programa-1',
        children: [{ key: 'meta-0', children: ['C', 'DT', null] }],
      },
    ];

    const [programa]: any = mesclarRespostas(arvoreNova, atual);

    expect(programa.children[0].children).toEqual(['C', 'DT', null]);
  });

  it('mantém a meta nova que só existe na árvore do servidor', () => {
    const atual = [
      {
        key: 'programa-1',
        children: [{ key: 'meta-0', children: ['C', null, null] }],
      },
    ];

    const [programa]: any = mesclarRespostas(arvoreNova, atual);

    expect(programa.children.map((m: any) => m.key)).toEqual([
      'meta-0',
      'meta-1',
    ]);
    expect(programa.children[1].children).toEqual([null, null, null]);
  });

  it('sem nada preenchido, devolve a árvore do servidor', () => {
    expect(mesclarRespostas(arvoreNova, [])).toBe(arvoreNova);
  });

  it('respeita a quantidade de slots da árvore nova', () => {
    const atual = [
      {
        key: 'programa-1',
        children: [{ key: 'meta-0', children: ['C', 'C', 'C', 'C', 'C'] }],
      },
    ];

    const [programa]: any = mesclarRespostas(arvoreNova, atual);

    expect(programa.children[0].children).toHaveLength(3);
  });
});
