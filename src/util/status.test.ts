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

  it('reconhece a concordância de gênero em português (atendida/atestada)', () => {
    // "sessão" é feminino — "sessão atendida"/"guia atestada" são formas
    // plausíveis vindas do backend, e não continham a palavra masculina
    // completa ("atendido"/"atestado") — regressão real: o badge de
    // status mostrava "Atendido" (cor certa), mas o clique no card
    // continuava bloqueado porque essa função classificava como "outro".
    expect(classificarStatus({ nome: 'Sessão atendida com sucesso' })).toBe('atendido');
    expect(classificarStatus({ nome: 'ATENDIDO' })).toBe('atendido');
    expect(classificarStatus({ nome: 'Guia atestada pelo médico' })).toBe('atestado');
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
