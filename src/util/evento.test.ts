import { describe, expect, it } from 'vitest';
import { isSlotLivre, sessaoBloqueada, temSessaoRegistrada } from './evento';

describe('isSlotLivre', () => {
  it('usa o campo "tipo" explícito quando o backend manda', () => {
    expect(isSlotLivre({ tipo: 'livre', id: 999 })).toBe(true);
    expect(isSlotLivre({ tipo: 'agendado', id: 0 })).toBe(false);
  });

  it('cai no sentinela id === 0 quando "tipo" não vem (fallback)', () => {
    expect(isSlotLivre({ id: 0 })).toBe(true);
    expect(isSlotLivre({ id: 1234 })).toBe(false);
  });

  it('lida com item undefined/null sem lançar', () => {
    expect(isSlotLivre(undefined)).toBe(false);
    expect(isSlotLivre(null)).toBe(false);
  });
});

describe('temSessaoRegistrada', () => {
  it('usa o campo explícito do backend quando é booleano', () => {
    expect(temSessaoRegistrada({ temSessaoRegistrada: true }, false)).toBe(true);
    expect(temSessaoRegistrada({ temSessaoRegistrada: false }, true)).toBe(false);
  });

  it('cai no fallback (heurística do chamador) quando o campo não vem', () => {
    expect(temSessaoRegistrada({}, true)).toBe(true);
    expect(temSessaoRegistrada({}, false)).toBe(false);
  });

  it('ignora um valor não-booleano no campo e usa o fallback', () => {
    expect(temSessaoRegistrada({ temSessaoRegistrada: 'sim' as any }, true)).toBe(true);
  });
});

describe('sessaoBloqueada', () => {
  it('usa o campo explícito do backend quando é booleano', () => {
    expect(sessaoBloqueada({ sessaoBloqueada: true }, false)).toBe(true);
    expect(sessaoBloqueada({ sessaoBloqueada: false }, true)).toBe(false);
  });

  it('cai no fallback quando o campo não vem', () => {
    expect(sessaoBloqueada({}, true)).toBe(true);
    expect(sessaoBloqueada({}, false)).toBe(false);
  });
});
