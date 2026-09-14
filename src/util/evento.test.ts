import { describe, expect, it } from 'vitest';
import { isSlotLivre } from './evento';

describe('isSlotLivre', () => {
  it('usa o campo "tipo" do backend', () => {
    expect(isSlotLivre({ tipo: 'livre', id: 999 })).toBe(true);
    expect(isSlotLivre({ tipo: 'agendado', id: 0 })).toBe(false);
  });

  it('não trata mais id === 0 sem "tipo" como vaga livre', () => {
    expect(isSlotLivre({ id: 0 })).toBe(false);
  });

  it('lida com item undefined/null sem lançar', () => {
    expect(isSlotLivre(undefined)).toBe(false);
    expect(isSlotLivre(null)).toBe(false);
  });
});
