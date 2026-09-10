import { describe, expect, it } from 'vitest';
import {
  classificarPercentual,
  transformarPortagePorAvaliacao,
} from './portageEvolucao';

describe('classificarPercentual', () => {
  it('classifica por faixa (alto >=80, medio >=50, baixo abaixo disso)', () => {
    expect(classificarPercentual('100%')).toBe('alto');
    expect(classificarPercentual('80%')).toBe('alto');
    expect(classificarPercentual('79%')).toBe('medio');
    expect(classificarPercentual('50%')).toBe('medio');
    expect(classificarPercentual('49%')).toBe('baixo');
    expect(classificarPercentual('0%')).toBe('baixo');
  });

  it('classifica "Não se aplica" (não-numérico) como "na"', () => {
    expect(classificarPercentual('Não se aplica')).toBe('na');
  });
});

describe('transformarPortagePorAvaliacao', () => {
  const buildData = (headers: string[]) => ({
    headers,
    Socializacao: [
      ['0 a 1', ...headers.slice(1).map(() => '100%')],
      ['1 a 2', ...headers.slice(1).map(() => '80%')],
    ],
    Cognicao: [['0 a 1', ...headers.slice(1).map(() => '90%')]],
  });

  it('sem avaliação nenhuma (só o header vazio), não monta nada', () => {
    expect(transformarPortagePorAvaliacao({ headers: [''] })).toEqual([]);
  });

  it('com 1 avaliação só, usa o rótulo original do backend (não "Primeira/Atual")', () => {
    const data = buildData(['', 'Avaliação 10/01/2026']);

    const [avaliacao] = transformarPortagePorAvaliacao(data);

    expect(avaliacao.titulo).toBe('Avaliação 10/01/2026');
  });

  it('com 2+ avaliações, pega só as duas pontas — Primeira Aplicação e Aplicação Atual', () => {
    const data = buildData([
      '',
      'Avaliação 01/04/2026',
      'Reavaliação 01/03/2026',
      'Avaliação 01/01/2026',
    ]);

    const avaliacoes = transformarPortagePorAvaliacao(data);

    expect(avaliacoes).toHaveLength(2);
    expect(avaliacoes[0].titulo).toBe('Primeira Aplicação: 01/01/2026');
    expect(avaliacoes[1].titulo).toBe('Aplicação Atual: 01/04/2026');
    // A reavaliação do meio (índice 2) fica de fora — só as pontas.
    expect(avaliacoes.map((a) => a.titulo).join()).not.toContain('01/03/2026');
  });

  it('pula avaliação sem nenhum dado preenchido (índice inteiro vazio)', () => {
    const data = {
      headers: ['', 'Avaliação 01/02/2026', 'Avaliação 01/01/2026'],
      Socializacao: [
        ['0 a 1', '', '100%'],
        ['1 a 2', '', '90%'],
      ],
      Cognicao: [],
    };

    const avaliacoes = transformarPortagePorAvaliacao(data);

    expect(avaliacoes).toHaveLength(1);
    expect(avaliacoes[0].titulo).toContain('01/01/2026');
  });

  it('linhas trazem só as faixas etárias com dado real naquela avaliação', () => {
    const data = {
      headers: ['', 'Avaliação 01/02/2026'],
      Socializacao: [
        ['0 a 1', '100%'],
        ['1 a 2', 'Não se aplica'],
      ],
      Cognicao: [],
    };

    const [avaliacao] = transformarPortagePorAvaliacao(data);

    expect(avaliacao.colunas).toEqual(['Áreas', '0 a 1']);
    expect(avaliacao.linhas).toEqual([['Socialização', '100%']]);
  });
});
