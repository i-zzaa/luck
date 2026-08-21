import { describe, expect, it } from 'vitest';
import {
  buildFilteredTreeNodes,
  countSelected,
  extractCheckedKeys,
  filterExcludedNode,
  hasNodes,
  normalizeMaintenanceObject,
} from './tree';

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

describe('filterExcludedNode', () => {
  it('remove um nó-folha cuja key está excluída', () => {
    const node = { key: '1', label: 'Item' };
    expect(filterExcludedNode(node, new Set(['1']))).toBeNull();
  });

  it('mantém um nó-folha cuja key não está excluída', () => {
    const node = { key: '1', label: 'Item' };
    expect(filterExcludedNode(node, new Set(['999']))).toEqual(node);
  });

  it('poda recursivamente filhos excluídos em profundidade arbitrária', () => {
    const tree = {
      key: 'programa-1',
      children: [
        {
          key: 'meta-1',
          children: [
            { key: 'sub-1' },
            { key: 'sub-2' }, // será excluído
          ],
        },
        {
          key: 'meta-2', // toda a meta-2 será excluída (só tinha um filho, e ele foi excluído)
          children: [{ key: 'sub-3' }],
        },
      ],
    };

    const result = filterExcludedNode(tree, new Set(['sub-2', 'sub-3']));

    expect(result).toEqual({
      key: 'programa-1',
      children: [
        {
          key: 'meta-1',
          children: [{ key: 'sub-1' }],
        },
      ],
    });
  });

  it('poda o nó inteiro (retorna null) se TODOS os filhos forem excluídos', () => {
    const tree = {
      key: 'programa-1',
      children: [{ key: 'meta-1' }, { key: 'meta-2' }],
    };
    expect(filterExcludedNode(tree, new Set(['meta-1', 'meta-2']))).toBeNull();
  });

  it('é idempotente com conjunto de exclusão vazio (devolve a árvore inalterada)', () => {
    const tree = {
      key: 'programa-1',
      children: [{ key: 'meta-1', children: [{ key: 'sub-1' }] }],
    };
    expect(filterExcludedNode(tree, new Set())).toEqual(tree);
  });
});

describe('buildFilteredTreeNodes', () => {
  it('filtra uma lista de nós-raiz, removendo os que ficam vazios', () => {
    const nodes = [
      { key: 'p1', children: [{ key: 'm1' }] },
      { key: 'p2', children: [{ key: 'm2' }] },
    ];
    const result = buildFilteredTreeNodes(nodes, new Set(['m2']));
    expect(result).toEqual([{ key: 'p1', children: [{ key: 'm1' }] }]);
  });

  it('devolve [] pra lista vazia/indefinida', () => {
    expect(buildFilteredTreeNodes(undefined, new Set())).toEqual([]);
    expect(buildFilteredTreeNodes([], new Set())).toEqual([]);
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

describe('normalizeMaintenanceObject', () => {
  it('preenche manual/vbmapp/portage com [] quando ausentes', () => {
    expect(normalizeMaintenanceObject({})).toEqual({
      manual: [],
      vbmapp: [],
      portage: [],
    });
  });

  it('preserva os arrays existentes', () => {
    const raw = { manual: [{ key: '1' }], vbmapp: [], portage: [{ key: '2' }] };
    expect(normalizeMaintenanceObject(raw)).toEqual(raw);
  });

  it('devolve tudo vazio pra entrada nula/inválida', () => {
    expect(normalizeMaintenanceObject(null)).toEqual({
      manual: [],
      vbmapp: [],
      portage: [],
    });
    expect(normalizeMaintenanceObject('not an object')).toEqual({
      manual: [],
      vbmapp: [],
      portage: [],
    });
  });

  it('ignora campos que não são array', () => {
    expect(normalizeMaintenanceObject({ manual: 'oops' })).toEqual({
      manual: [],
      vbmapp: [],
      portage: [],
    });
  });
});
