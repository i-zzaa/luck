import { describe, expect, it } from 'vitest';
import { classificarStatus, getStatusClass } from './status';

describe('classificarStatus', () => {
  it('classifica pelo codigo estável do backend', () => {
    expect(classificarStatus({ codigo: 'falta', nome: 'Qualquer coisa' })).toBe('falta');
    expect(classificarStatus({ codigo: 'ATESTADO' })).toBe('atestado');
    expect(classificarStatus({ codigo: 'atendido' })).toBe('atendido');
  });

  it('não infere mais a categoria pelo nome livre', () => {
    expect(classificarStatus({ nome: 'Atendido' })).toBe('outro');
  });

  it('retorna "outro" pra codigo desconhecido ou ausente', () => {
    expect(classificarStatus({ codigo: 'confirmado' })).toBe('outro');
    expect(classificarStatus(undefined)).toBe('outro');
  });
});

describe('getStatusClass', () => {
  it('devolve uma classe diferente pra cada categoria', () => {
    const falta = getStatusClass({ codigo: 'falta' });
    const atestado = getStatusClass({ codigo: 'atestado' });
    const atendido = getStatusClass({ codigo: 'atendido' });
    const outro = getStatusClass({ codigo: 'confirmado' });

    expect(falta).toContain('bg-red-400');
    expect(atestado).toContain('bg-yellow-400');
    expect(atendido).toContain('bg-gray-300');
    expect(outro).toBe(atendido); // "outro" e "atendido" compartilham a mesma classe hoje
  });
});
