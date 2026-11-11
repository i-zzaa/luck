import { describe, expect, it } from 'vitest';
import { caminhoSvg, nomeDoCarimbo, pontoNoQuadro, tracoTemConteudo } from './traco';

describe('traço da assinatura', () => {
  it('prende o ponto dentro do quadro', () => {
    expect(pontoNoQuadro({ clientX: -10, clientY: 250 }, { left: 0, top: 0, width: 100, height: 200 })).toEqual({
      x: 0,
      y: 1,
    });
  });

  it('encostão de dedo não conta como assinatura', () => {
    expect(tracoTemConteudo([[{ x: 0.5, y: 0.5 }, { x: 0.501, y: 0.5 }]])).toBe(false);
    expect(tracoTemConteudo([[{ x: 0.1, y: 0.5 }, { x: 0.6, y: 0.4 }]])).toBe(true);
  });

  it('vira caminho SVG na escala pedida', () => {
    expect(caminhoSvg([[{ x: 0, y: 0 }, { x: 1, y: 0.5 }]], 200, 100)).toBe('M 0.00 0.00 L 200.00 50.00');
  });
});

describe('nome do carimbo', () => {
  it('sai como se escreve, com preposições em minúscula', () => {
    expect(nomeDoCarimbo('RINELANDIA DA SILVA LIMA')).toBe('Rinelandia da Silva Lima');
  });
});
