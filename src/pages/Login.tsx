import type { CSSProperties } from 'react';
import Login from '../foms/Login';
import logoMark from '../assets/logo_negativo_multialcance.png';

import package_json from '../../package.json';

// Cada lado de uma peça pode ser reto, ter um "nó" saindo pra fora (tab) ou
// um encaixe entrando pra dentro (blank) — a mesma anatomia das peças em
// src/assets/Puzzle Pieces Separated Outline.jpg, usada aqui como modelo.
type PieceEdgeKind = 'flat' | 'tab' | 'blank';
type PieceEdges = {
  top: PieceEdgeKind;
  right: PieceEdgeKind;
  bottom: PieceEdgeKind;
  left: PieceEdgeKind;
};

// Desenha um lado do quadrado. Pra "tab"/"blank" o traço sai da borda, afina
// num pescoço estreito e abre num nó redondo (arco de círculo) antes de
// afinar de novo e voltar — é esse afinamento que faz o nó "prender" e
// parecer peça de quebra-cabeça de verdade, em vez de só uma onda lisa.
const puzzleEdge = (
  [x0, y0]: [number, number],
  [x1, y1]: [number, number],
  kind: PieceEdgeKind,
) => {
  if (kind === 'flat') return `L${x1},${y1}`;

  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = uy; // normal apontando pra fora da peça (caminho no sentido horário)
  const ny = -ux;
  const dir = kind === 'tab' ? 1 : -1;

  const halfNeck = len * 0.13;
  const knobR = len * 0.16;
  const protrude = len * 0.24;

  const point = (t: number, offset = 0): [number, number] => [
    x0 + dx * t + nx * offset * dir,
    y0 + dy * t + ny * offset * dir,
  ];

  const n1 = point(0.5 - halfNeck / len);
  const n2 = point(0.5 - knobR / len, protrude * 0.42);
  const n3 = point(0.5 - knobR / len, protrude);
  const n4 = point(0.5 + knobR / len, protrude);
  const n5 = point(0.5 + knobR / len, protrude * 0.42);
  const n6 = point(0.5 + halfNeck / len);
  const sweep = kind === 'tab' ? 1 : 0;

  return `L${n1} C${n2} ${n2} ${n3} A${knobR},${knobR} 0 0 ${sweep} ${n4} C${n5} ${n5} ${n6} L${x1},${y1}`;
};

// Quadrado de cantos retos (não arredondados, como no modelo) com os 4 lados
// definidos por `edges`.
const buildPuzzlePiecePath = (edges: PieceEdges) => {
  const corners: [number, number][] = [
    [22, 22],
    [78, 22],
    [78, 78],
    [22, 78],
  ];
  return [
    `M${corners[0]}`,
    puzzleEdge(corners[0], corners[1], edges.top),
    puzzleEdge(corners[1], corners[2], edges.right),
    puzzleEdge(corners[2], corners[3], edges.bottom),
    puzzleEdge(corners[3], corners[0], edges.left),
    'Z',
  ].join(' ');
};

// Peça de quebra-cabeça reaproveitada tanto no cantinho de destaque quanto
// espalhada de fundo pelo painel roxo, como textura decorativa em baixa
// opacidade.
const PuzzlePiece = ({
  className,
  style,
  edges = { top: 'tab', right: 'blank', bottom: 'tab', left: 'blank' },
}: {
  className?: string;
  style?: CSSProperties;
  edges?: PieceEdges;
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    style={style}
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    aria-hidden="true"
  >
    <path strokeLinejoin="round" strokeLinecap="round" d={buildPuzzlePiecePath(edges)} />
  </svg>
);

// Posições/tamanhos/rotações/lados fixos (não randômicos): randomizar a cada
// render faria as peças "pularem" de lugar sempre que o componente
// re-renderizasse. As combinações de lados variam peça a peça, ecoando as
// diferentes peças do modelo (algumas com lado reto de borda, outras só com
// nós/encaixes).
const SCATTERED_PUZZLE_PIECES: {
  top: string;
  left: string;
  size: string;
  rotate: number;
  opacity: string;
  edges: PieceEdges;
}[] = [
  {
    top: '10%', left: '68%', size: 'w-8 h-8', rotate: 20, opacity: 'opacity-10',
    edges: { top: 'flat', right: 'tab', bottom: 'tab', left: 'tab' },
  },
  {
    top: '22%', left: '14%', size: 'w-6 h-6', rotate: -25, opacity: 'opacity-[0.08]',
    edges: { top: 'blank', right: 'tab', bottom: 'blank', left: 'tab' },
  },
  {
    top: '38%', left: '80%', size: 'w-10 h-10', rotate: 10, opacity: 'opacity-10',
    edges: { top: 'tab', right: 'blank', bottom: 'tab', left: 'blank' },
  },
  {
    top: '58%', left: '10%', size: 'w-7 h-7', rotate: 35, opacity: 'opacity-[0.07]',
    edges: { top: 'blank', right: 'blank', bottom: 'tab', left: 'tab' },
  },
  {
    top: '68%', left: '72%', size: 'w-6 h-6', rotate: -15, opacity: 'opacity-[0.09]',
    edges: { top: 'tab', right: 'tab', bottom: 'blank', left: 'blank' },
  },
  {
    top: '82%', left: '30%', size: 'w-9 h-9', rotate: 5, opacity: 'opacity-[0.08]',
    edges: { top: 'flat', right: 'blank', bottom: 'tab', left: 'blank' },
  },
  {
    top: '48%', left: '45%', size: 'w-5 h-5', rotate: -30, opacity: 'opacity-[0.06]',
    edges: { top: 'blank', right: 'tab', bottom: 'flat', left: 'tab' },
  },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#662977]">
      {/* Marca: no celular é o topo roxo da tela (o formulário sobe da base
          num painel branco, e o teclado cobre só a parte de baixo); no
          computador vira o painel lateral. */}
      <header className="relative shrink-0 h-[268px] lg:h-auto lg:w-[42%] flex flex-col items-center justify-center gap-1.5 overflow-hidden px-6 text-white">
        <div className="hidden lg:block absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white opacity-[0.06] blur-3xl" />
        <div className="hidden lg:block absolute -bottom-28 -left-20 w-96 h-96 rounded-full bg-white opacity-[0.07] blur-3xl" />
        {/* Peças de quebra-cabeça espalhadas de fundo, bem discretas —
            textura decorativa, não devem competir com a marca. */}
        {SCATTERED_PUZZLE_PIECES.map((piece, index) => (
          <PuzzlePiece
            key={index}
            edges={piece.edges}
            className={`absolute text-white ${piece.size} ${piece.opacity}`}
            style={{ top: piece.top, left: piece.left, transform: `rotate(${piece.rotate}deg)` }}
          />
        ))}
        <PuzzlePiece className="absolute top-8 left-6 w-11 h-11 text-white opacity-20 rotate-[-12deg]" />

        <img
          src={logoMark}
          alt="Multi Alcance · Núcleo Terapêutico ABA"
          className="relative w-[214px] lg:w-[300px] h-auto"
          style={{ filter: 'brightness(0) invert(1)', opacity: 0.95 }}
        />
        <p className="relative m-0 text-[15px] lg:text-[17px] font-bold text-yellow-400">
          Cuidado que transforma.
        </p>
        <p className="relative hidden lg:block max-w-xs mt-2 text-center text-sm text-white opacity-80 leading-relaxed">
          Organizamos o atendimento multidisciplinar de forma integrada
          para apoiar o desenvolvimento de crianças e suas famílias.
        </p>
      </header>

      <main className="flex-1 flex flex-col bg-white rounded-t-[28px] lg:rounded-none px-6 pt-7 pb-5 lg:justify-center">
        <div className="w-full max-w-[400px] mx-auto flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-[24px] font-bold text-[#27272a]">Entrar</h1>
            <p className="m-0 text-[14px] leading-[1.45] text-gray-800">
              Use o login e a senha que a clínica cadastrou para você.
            </p>
          </div>
          <Login />
        </div>

        <footer className="mt-auto lg:mt-10 pt-4 flex flex-col items-center gap-1">
          <span className="flex items-center gap-1.5 text-[12px] text-gray-800">
            <i className="pi pi-shield" style={{ fontSize: 12 }} />
            Ambiente seguro e confidencial
          </span>
          <span className="text-[11px] text-[#71717a]">v{package_json.version}</span>
        </footer>
      </main>
    </div>
  );
}
