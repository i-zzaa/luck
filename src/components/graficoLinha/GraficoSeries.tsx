import { useEffect, useRef, useState } from 'react';

export type SerieGrafico = {
  id: string;
  cor: string;
  // stroke-dasharray — as linhas se distinguem por cor E traço, não só
  // pela cor.
  traco: string;
  valores: (number | null)[];
};

type Props = {
  datas: string[];
  series: SerieGrafico[];
  // Série em destaque: as outras esmaecem e só ela mostra os valores.
  destaque?: string | null;
  altura?: number;
  ariaLabel?: string;
};

// Várias linhas no mesmo eixo 0–100% (uma por item de uma meta, em
// Primeira Resposta). Mesmo desenho do GraficoLinha: medido em pixels
// reais, pontos sem valor (null) quebram a linha em vez de ligar sessões
// sem apuração. Sem hover: no celular, o destaque vem de tocar no item
// (ver pages/primeiraResposta/ProgramaCard.tsx).
export function GraficoSeries({
  datas,
  series,
  destaque = null,
  altura = 150,
  ariaLabel,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setLargura(entry.contentRect.width)
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const margem = { top: 18, right: 20, bottom: 26, left: 40 };
  const areaW = Math.max(largura - margem.left - margem.right, 0);
  const areaH = altura - margem.top - margem.bottom;

  const x = (i: number) =>
    margem.left + (datas.length <= 1 ? areaW / 2 : (i * areaW) / (datas.length - 1));
  const y = (v: number) => margem.top + areaH - (v / 100) * areaH;

  const segmentos = (valores: (number | null)[]) => {
    const lista: string[] = [];
    let atual = '';
    valores.forEach((v, i) => {
      if (v === null) {
        if (atual) lista.push(atual);
        atual = '';
        return;
      }
      atual += `${atual ? 'L' : 'M'}${x(i)},${y(v)}`;
    });
    if (atual) lista.push(atual);
    return lista;
  };

  // A destacada por último, pra ficar por cima das outras.
  const ordenadas = destaque
    ? [...series.filter((s) => s.id !== destaque), ...series.filter((s) => s.id === destaque)]
    : series;

  return (
    <div
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      className="relative w-full min-w-0 overflow-hidden"
      style={{ height: altura }}
    >
      {largura > 0 && (
        <svg width={largura} height={altura} className="absolute inset-0 block font-inter">
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

          {ordenadas.map((serie) => {
            const ativa = destaque === serie.id;
            const apagada = !!destaque && !ativa;
            // Com uma série só não há o que destacar: mostra os valores.
            const mostrarValores = ativa || series.length === 1;

            return (
              <g key={serie.id} opacity={apagada ? 0.18 : 1}>
                {segmentos(serie.valores).map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={serie.cor}
                    strokeWidth={ativa ? 3.5 : 2.5}
                    strokeDasharray={serie.traco || undefined}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ))}
                {serie.valores.map((v, i) =>
                  v === null ? null : (
                    <g key={i}>
                      <circle
                        cx={x(i)}
                        cy={y(v)}
                        r={3.5}
                        fill={serie.cor}
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                      />
                      {mostrarValores && (
                        <text
                          x={Math.min(Math.max(x(i), margem.left + 12), largura - 16)}
                          y={y(v) - 8}
                          textAnchor="middle"
                          fontSize={11}
                          fontWeight={700}
                          fill="#27272a"
                        >
                          {v}%
                        </text>
                      )}
                    </g>
                  )
                )}
              </g>
            );
          })}

          {datas.map((data, i) => (
            <text
              key={i}
              x={Math.min(Math.max(x(i), 32), largura - 32)}
              y={altura - 6}
              textAnchor="middle"
              fontSize={10}
              fill="#71717a"
            >
              {data}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}
