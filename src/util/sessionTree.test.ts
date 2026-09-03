import { describe, expect, it } from 'vitest';
import {
  extractTrainedSelectionKeys,
  isObj,
  isPrimitiveOrNull,
  isResumoVazio,
  MIN_RESUMO_LENGTH,
  padSlots,
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

describe('MIN_RESUMO_LENGTH', () => {
  it('é 200 (regra de negócio do prontuário)', () => {
    expect(MIN_RESUMO_LENGTH).toBe(200);
  });
});

describe('padSlots', () => {
  it('preenche com null até completar o tamanho pedido', () => {
    expect(padSlots(['+', '-'], 5)).toEqual(['+', '-', null, null, null]);
  });

  it('corta o array se já vier maior que o tamanho pedido', () => {
    expect(padSlots(['+', '-', '+', '-', '+', '+'], 3)).toEqual(['+', '-', '+']);
  });

  it('devolve array só de null quando a entrada não é array', () => {
    expect(padSlots(undefined as any, 3)).toEqual([null, null, null]);
  });

  it('não mexe num array que já tem exatamente o tamanho certo', () => {
    expect(padSlots(['+', '-', null], 3)).toEqual(['+', '-', null]);
  });
});

describe('extractTrainedSelectionKeys', () => {
  it('marca uma folha como treinada se tiver pelo menos um slot preenchido', () => {
    const nodes = [{ key: 'meta-1', children: [null, '+', null] }];
    expect(extractTrainedSelectionKeys(nodes)).toEqual({
      'meta-1': { checked: true, partialChecked: false },
    });
  });

  it('não marca uma folha com todos os slots vazios', () => {
    const nodes = [{ key: 'meta-1', children: [null, null, null] }];
    expect(extractTrainedSelectionKeys(nodes)).toEqual({});
  });

  it('propaga pro nó pai quando um filho é treinado (3 níveis)', () => {
    const nodes = [
      {
        key: 'programa-1',
        children: [
          { key: 'meta-1', children: ['+', null] },
          { key: 'meta-2', children: [null, null] },
        ],
      },
    ];
    const result = extractTrainedSelectionKeys(nodes);
    expect(result['meta-1']).toEqual({ checked: true, partialChecked: false });
    expect(result['meta-2']).toBeUndefined();
    // só 1 dos 2 filhos treinado -> pai fica parcial, não totalmente marcado
    expect(result['programa-1']).toEqual({ checked: false, partialChecked: true });
  });

  it('marca o pai como totalmente selecionado quando TODOS os filhos são treinados', () => {
    const nodes = [
      {
        key: 'programa-1',
        children: [
          { key: 'meta-1', children: ['+'] },
          { key: 'meta-2', children: ['-'] },
        ],
      },
    ];
    expect(extractTrainedSelectionKeys(nodes)['programa-1']).toEqual({
      checked: true,
      partialChecked: false,
    });
  });

  it('devolve objeto vazio pra árvore vazia/indefinida', () => {
    expect(extractTrainedSelectionKeys([])).toEqual({});
    expect(extractTrainedSelectionKeys(undefined as any)).toEqual({});
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
