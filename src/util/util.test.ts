import { describe, expect, it } from 'vitest';
import { firtUpperCase, formatdate, formatdateeua } from './util';

describe('firtUpperCase', () => {
  it('deixa só a primeira letra maiúscula', () => {
    expect(firtUpperCase('terapia')).toBe('Terapia');
  });

  it('não mexe no resto da string', () => {
    expect(firtUpperCase('tERAPIA')).toBe('TERAPIA');
  });
});

describe('formatdate', () => {
  it('formata pra DD/MM/YYYY', () => {
    expect(formatdate('2026-08-20')).toBe('20/08/2026');
  });
});

describe('formatdateeua', () => {
  // Sempre chamada com Date nativo no código real (Home.tsx, Schedule.tsx)
  // — nunca com string "DD/MM/YYYY", que o moment não consegue parsear
  // sem ambiguidade.
  it('formata um Date nativo pra YYYY-MM-DD', () => {
    expect(formatdateeua(new Date(2026, 7, 20))).toBe('2026-08-20');
  });

  it('formata uma string ISO pra YYYY-MM-DD', () => {
    expect(formatdateeua('2026-08-20')).toBe('2026-08-20');
  });
});
