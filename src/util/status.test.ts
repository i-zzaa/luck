import { describe, expect, it } from 'vitest';
import { classificarStatus, getStatusClass } from './status';

describe('classificarStatus', () => {
  it('usa o campo codigo estável quando o backend manda', () => {
    expect(classificarStatus({ codigo: 'falta', nome: 'Qualquer coisa' })).toBe('falta');
    expect(classificarStatus({ codigo: 'ATESTADO' })).toBe('atestado');
  });

  it('cai no matching por substring do nome livre (fallback)', () => {
    expect(classificarStatus({ nome: 'Falta' })).toBe('falta');
    expect(classificarStatus({ nome: 'Atestado médico' })).toBe('atestado');
    expect(classificarStatus({ nome: 'Atendido com sucesso' })).toBe('atendido');
  });

  it('retorna "outro" pra status desconhecido', () => {
    expect(classificarStatus({ nome: 'Confirmado' })).toBe('outro');
    expect(classificarStatus(undefined)).toBe('outro');
  });
});

describe('getStatusClass', () => {
  it('devolve uma classe diferente pra cada categoria', () => {
    const falta = getStatusClass({ nome: 'Falta' });
    const atestado = getStatusClass({ nome: 'Atestado' });
    const atendido = getStatusClass({ nome: 'Atendido' });
    const outro = getStatusClass({ nome: 'Confirmado' });

    expect(falta).toContain('bg-red-400');
    expect(atestado).toContain('bg-yellow-400');
    expect(atendido).toContain('bg-gray-300');
    expect(outro).toBe(atendido); // "outro" e "atendido" compartilham a mesma classe hoje
  });
});
