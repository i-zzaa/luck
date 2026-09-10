export enum TIPO_PROTOCOLO {
  portage = 1,
  vbMapp = 2,
  pei = 3,
}

export enum VALOR_PORTAGE {
  sim = '1',
  asVezes = '0.5',
  nao = '0',
}

export enum TIPO_PORTAGE {
  socializacao = 'Socialização',
  cognicao = 'Cognição',
}

export enum VBMAPP {
  um = 1,
  dois = 2,
  tres = 3,
}

// Status de acompanhamento de uma meta — usado no cadastro do Manual
// (foms/pei/index.tsx), na listagem (pages/PEI.tsx) e no Relatório de
// Evolução (constants/pdfRelatorioEvolucao.ts). Só o Manual carrega
// isso como campo de verdade (ainda não existe no backend — ver
// docs/pedido-backend-formatacao.md); Portage e VB-MAPP não têm um
// "status" próprio, mas a tela deriva o mesmo rótulo a partir da
// resposta salva em cada item (ver derivarStatusResposta em
// pages/PEI.tsx: selected '1' -> atingida, '0.5' -> aquisicao). Uma
// meta sem status/resposta simplesmente não mostra rótulo nenhum.
export enum STATUS_META {
  atingida = 'atingida',
  aquisicao = 'aquisicao',
  manutencao = 'manutencao',
}

export const STATUS_META_OPTIONS = [
  { id: STATUS_META.atingida, nome: 'Meta atingida' },
  { id: STATUS_META.aquisicao, nome: 'Em aquisição' },
  {
    id: STATUS_META.manutencao,
    nome: 'Meta atingida, manter em manutenção',
  },
];

export const STATUS_META_LABEL: Record<string, string> =
  STATUS_META_OPTIONS.reduce(
    (acc, item) => ({ ...acc, [item.id]: item.nome }),
    {}
  );

// Verde = atingida (sucesso), vermelho = em aquisição (ainda precisa de
// atenção) — confirmado com quem preenche o relatório hoje.
// "manutencao" reaproveita a cor de "atingida" (é uma meta atingida,
// só que em manutenção).
export const STATUS_META_COLOR_CLASS: Record<string, string> = {
  [STATUS_META.atingida]: 'text-green-500',
  [STATUS_META.manutencao]: 'text-green-500',
  [STATUS_META.aquisicao]: 'text-red-400',
};

// Mesma paleta acima, em RGB — jsPDF (usado no Relatório de Evolução)
// não lê classes Tailwind, precisa do valor de cor direto.
export const STATUS_META_COLOR_RGB: Record<string, [number, number, number]> = {
  [STATUS_META.atingida]: [34, 197, 94],
  [STATUS_META.manutencao]: [34, 197, 94],
  [STATUS_META.aquisicao]: [248, 113, 113],
};

// Rótulo curto pro selo da meta — o texto completo de STATUS_META_LABEL
// ("Meta atingida, manter em manutenção") é bom pro formulário de
// cadastro, mas não cabe numa pílula ao lado da descrição sem estourar
// a linha. Mesmo rótulo usado na tela do PEI (pages/PEI.tsx) e no PDF
// (constants/pdfRelatorioEvolucao.ts) — um lugar só pra não divergir.
export const STATUS_META_LABEL_CURTO: Record<string, string> = {
  [STATUS_META.atingida]: 'Atingida',
  [STATUS_META.manutencao]: 'Atingida (manutenção)',
  [STATUS_META.aquisicao]: 'Em aquisição',
};

// Pílula (fundo claro + texto na mesma cor) — mesma paleta de
// STATUS_META_COLOR_CLASS, em par bg/text em vez de só a cor do texto.
export const STATUS_META_PILL_CLASS: Record<string, string> = {
  [STATUS_META.atingida]: 'bg-green-100 text-green-700',
  [STATUS_META.manutencao]: 'bg-green-100 text-green-700',
  [STATUS_META.aquisicao]: 'bg-red-100 text-red-700',
};
