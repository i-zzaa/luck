import { useEffect, useRef, useState } from 'react';

export type PontoGrafico = { data: string; valor: number | null };

type Props = {
  pontos: PontoGrafico[];
  altura?: number;
  cor?: string;
};

// Gráfico de linha simples em SVG puro (o projeto não tem lib de gráfico):
// eixo Y fixo de 0 a 100% e as datas embaixo de cada ponto. Pontos sem
// valor (null — sessão sem porcentagem apurada) ficam sem marcador e quebram a linha, pra não
// inventar uma ligação entre sessões que não tiveram apuração.
export function GraficoLinha({ pontos, altura = 160, cor = '#662977' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  // Mede o container pra desenhar em pixels reais — com viewBox fixo o
  // texto das datas escalaria junto e ficaria ilegível no celular.
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setLargura(entry.contentRect.width)
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // left precisa caber "100%" inteiro — com 34 o "1" era cortado.
  const margem = { top: 16, right: 16, bottom: 28, left: 44 };
  const areaW = Math.max(largura - margem.left - margem.right, 0);
  const areaH = altura - margem.top - margem.bottom;

  const x = (i: number) =>
    margem.left +
    (pontos.length <= 1 ? areaW / 2 : (i * areaW) / (pontos.length - 1));
  const y = (v: number) => margem.top + areaH - (v / 100) * areaH;

  // Segmentos contínuos entre pontos com valor.
  const segmentos: string[] = [];
  let atual = '';
  pontos.forEach((p, i) => {
    if (p.valor === null) {
      if (atual) segmentos.push(atual);
      atual = '';
      return;
    }
    atual += `${atual ? 'L' : 'M'}${x(i)},${y(p.valor)}`;
  });
  if (atual) segmentos.push(atual);

  // Com muitas sessões as datas se sobrepõem — mostra só uma a cada N.
  const passoData = Math.max(1, Math.ceil((pontos.length * 64) / (areaW || 1)));

  return (
    // SVG absoluto: não entra no cálculo de largura do container. Com ele
    // no fluxo, a largura em px medida travava o pai no tamanho antigo e
    // o gráfico não encolhia junto com a tela (gerando scroll horizontal).
    <div
      ref={ref}
      className="relative w-full min-w-0 overflow-hidden"
      style={{ height: altura }}
    >
      {largura > 0 && (
        <svg
          width={largura}
          height={altura}
          className="absolute inset-0 block font-inter"
        >
          {[0, 50, 100].map((v) => (
            <g key={v}>
              <line
                x1={margem.left}
                x2={margem.left + areaW}
                y1={y(v)}
                y2={y(v)}
                stroke="#e4e4e7"
                strokeWidth={1}
              />
              <text
                x={margem.left - 6}
                y={y(v)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                fill="#71717a"
              >
                {v}%
              </text>
            </g>
          ))}

          {segmentos.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={cor}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={margem.top}
              y2={margem.top + areaH}
              stroke="#CBCBCB"
              strokeWidth={1}
            />
          )}

          {pontos.map((p, i) => (
            <g key={i}>
              {p.valor !== null && (
                <circle
                  cx={x(i)}
                  cy={y(p.valor)}
                  r={hover === i ? 5 : 4}
                  fill={cor}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              )}
              {i % passoData === 0 && (
                <text
                  // Data centralizada no ponto, mas presa dentro do SVG —
                  // senão a última (e a primeira, em tela estreita) sai
                  // cortada pela borda.
                  x={Math.min(Math.max(x(i), 32), largura - 32)}
                  y={altura - 8}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#71717a"
                >
                  {p.data}
                </text>
              )}
              {/* Área de hover maior que o ponto, cobrindo a coluna toda. */}
              <rect
                x={
                  x(i) -
                  (pontos.length > 1
                    ? areaW / (pontos.length - 1) / 2
                    : areaW / 2)
                }
                y={margem.top}
                width={pontos.length > 1 ? areaW / (pontos.length - 1) : areaW}
                height={areaH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          ))}

          {hover !== null && (
            <text
              x={Math.min(Math.max(x(hover), 70), largura - 70)}
              y={margem.top - 2}
              textAnchor="middle"
              fontSize={10}
              fontWeight={600}
              fill="#27272a"
            >
              {pontos[hover].data}:{' '}
              {pontos[hover].valor === null
                ? 'sem registro'
                : `${pontos[hover].valor}%`}
            </text>
          )}
        </svg>
      )}
    </div>
  );
}
