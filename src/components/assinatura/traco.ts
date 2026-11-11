// Traço da assinatura da terapeuta: as mesmas regras do backend
// (heron-list-nest/src/util/assinatura.ts) — mudou lá, muda aqui.
// Base: módulo de assinatura do PEIgo Clínica (app/assinatura/traco.ts).
//
// O desenho é guardado em fração do quadro (0 a 1), nunca em pixels: o
// quadro do celular, o do tablet e a caixa do PDF têm tamanhos
// diferentes, e o relativo redesenha nítido em qualquer um deles.

export interface PontoAssinatura {
  x: number;
  y: number;
}

/** Cada linha é um traço contínuo; levantar o dedo começa a próxima. */
export type TracoAssinatura = PontoAssinatura[][];

/** Como o cadastro da terapeuta sai no carimbo (foto do momento da assinatura). */
export interface CarimboDados {
  nome: string;
  especialidade: string | null;
  registro: string | null;
}

export interface AssinaturaSessao {
  traco: TracoAssinatura;
  assinadaEm?: string | null;
  carimbo?: CarimboDados | null;
}

export const MAXIMO_LINHAS = 60;
export const MAXIMO_PONTOS = 2000;
export const CASAS_DECIMAIS = 4;
export const EXTENSAO_MINIMA = 0.05;

/**
 * O dedo dispara dezenas de eventos por segundo, quase todos no mesmo
 * lugar. Guardar só o que anda meio por cento do quadro corta o traço
 * para algumas centenas de pontos sem mudar o desenho.
 */
export const DISTANCIA_MINIMA = 0.005;

const entre0e1 = (valor: number) => Math.min(1, Math.max(0, valor));
const arredondar = (valor: number) => Number(valor.toFixed(CASAS_DECIMAIS));

/**
 * Onde o dedo tocou, em fração do quadro. Fora das bordas é preso na
 * borda: arrastar para fora não vira coordenada negativa (o backend recusa).
 */
export function pontoNoQuadro(
  cliente: { clientX: number; clientY: number },
  quadro: { left: number; top: number; width: number; height: number }
): PontoAssinatura {
  if (!quadro.width || !quadro.height) return { x: 0, y: 0 };

  return {
    x: arredondar(entre0e1((cliente.clientX - quadro.left) / quadro.width)),
    y: arredondar(entre0e1((cliente.clientY - quadro.top) / quadro.height)),
  };
}

export function deveGuardarPonto(anterior: PontoAssinatura | undefined, novo: PontoAssinatura) {
  if (!anterior) return true;
  return Math.hypot(novo.x - anterior.x, novo.y - anterior.y) >= DISTANCIA_MINIMA;
}

export const contarPontos = (traco: TracoAssinatura) =>
  traco.reduce((total, linha) => total + linha.length, 0);

/** O lado maior do retângulo que o traço ocupa, em fração do quadro. */
export function extensaoDoTraco(traco: TracoAssinatura): number {
  const xs: number[] = [];
  const ys: number[] = [];

  for (const linha of traco) {
    for (const ponto of linha) {
      xs.push(ponto.x);
      ys.push(ponto.y);
    }
  }

  if (!xs.length) return 0;
  return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
}

/** Tem desenho de verdade, e não um encostão de dedo. Libera o "Assinar e salvar". */
export const tracoTemConteudo = (traco: TracoAssinatura) =>
  contarPontos(traco) >= 2 && extensaoDoTraco(traco) >= EXTENSAO_MINIMA;

/** Já não cabe mais nada: o backend recusa acima destes limites. */
export const tracoCheio = (traco: TracoAssinatura) =>
  traco.length >= MAXIMO_LINHAS || contarPontos(traco) >= MAXIMO_PONTOS;

/** O traço como caminho de SVG, na escala pedida (assinatura de volta na tela). */
export function caminhoSvg(traco: TracoAssinatura, largura: number, altura: number): string {
  return (traco || [])
    .filter((linha) => linha.length)
    .map((linha) => {
      const pontos = linha.map(
        (ponto) => `${(ponto.x * largura).toFixed(2)} ${(ponto.y * altura).toFixed(2)}`
      );
      // Linha de um ponto só vira um pinguinho: repete o ponto para o
      // traço ter comprimento e a ponta arredondada desenhá-lo.
      return `M ${pontos[0]} L ${pontos.length > 1 ? pontos.slice(1).join(' L ') : pontos[0]}`;
    })
    .join(' ');
}

const MINUSCULAS = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);

/**
 * O cadastro grava o nome em maiúsculas ("RINELANDIA DA SILVA LIMA"); no
 * carimbo ele sai como se escreve: "Rinelandia da Silva Lima".
 */
export function nomeDoCarimbo(nome = '') {
  return nome
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((parte, i) =>
      i > 0 && MINUSCULAS.has(parte) ? parte : parte.charAt(0).toUpperCase() + parte.slice(1)
    )
    .join(' ');
}
