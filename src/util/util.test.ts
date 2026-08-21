import { describe, expect, it } from 'vitest';
import {
  diffWeek,
  firtUpperCase,
  formatdate,
  formatdateeua,
  getPrimeiroDoMes,
  getUltimoDoMes,
} from './util';

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

describe('diffWeek', () => {
  it('calcula a semana atual em relação ao início (1-indexado)', () => {
    expect(diffWeek('2026-08-01', '2026-08-01')).toBe(1);
    expect(diffWeek('2026-08-01', '2026-08-08')).toBe(2);
    expect(diffWeek('2026-08-01', '2026-08-15')).toBe(3);
  });
});

describe('getPrimeiroDoMes / getUltimoDoMes', () => {
  it('devolve o primeiro dia do mês', () => {
    expect(getPrimeiroDoMes(2026, 8)).toBe('2026-08-01');
    expect(getPrimeiroDoMes(2026, 2)).toBe('2026-02-01');
  });

  it('devolve o último dia do mês, respeitando meses de 28/29/30/31 dias', () => {
    expect(getUltimoDoMes(2026, 8)).toBe('2026-08-31'); // 31 dias
    expect(getUltimoDoMes(2026, 4)).toBe('2026-04-30'); // 30 dias
    expect(getUltimoDoMes(2026, 2)).toBe('2026-02-28'); // 2026 não é bissexto
    expect(getUltimoDoMes(2028, 2)).toBe('2028-02-29'); // 2028 é bissexto
  });
});
