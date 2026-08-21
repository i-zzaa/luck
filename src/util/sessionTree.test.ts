import { describe, expect, it } from 'vitest';
import { isObj, isPrimitiveOrNull, isResumoVazio, padSlots } from './sessionTree';

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
