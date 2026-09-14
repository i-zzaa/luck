import { describe, expect, it } from 'vitest';
import { countSelected, extractCheckedKeys, hasNodes } from './tree';

describe('extractCheckedKeys', () => {
  it('retorna [] pra seleção undefined/null', () => {
    expect(extractCheckedKeys(undefined)).toEqual([]);
    expect(extractCheckedKeys(null)).toEqual([]);
  });

  it('retorna [] pra seleção que não é objeto', () => {
    expect(extractCheckedKeys('abc' as any)).toEqual([]);
  });

  it('inclui chaves com valor true', () => {
    expect(extractCheckedKeys({ a: true, b: false })).toEqual(['a']);
  });

  it('inclui chaves com objeto { checked: true } (formato do PrimeReact Tree)', () => {
    expect(
      extractCheckedKeys({
        a: { checked: true, partialChecked: false },
        b: { checked: false },
        c: { partialChecked: true }, // partialChecked sozinho não conta como marcado
      })
    ).toEqual(['a']);
  });
});

describe('countSelected', () => {
  it('conta quantas chaves estão marcadas', () => {
    expect(countSelected({ a: true, b: { checked: true }, c: false })).toBe(2);
  });

  it('é 0 pra seleção vazia', () => {
    expect(countSelected({})).toBe(0);
  });
});

describe('hasNodes', () => {
  it('true só pra array não-vazio', () => {
    expect(hasNodes([1])).toBe(true);
    expect(hasNodes([])).toBe(false);
    expect(hasNodes(undefined)).toBe(false);
    expect(hasNodes('not an array' as any)).toBe(false);
  });
});
