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

// Status de acompanhamento de uma meta do protocolo Manual (PEI) — usado
// no cadastro (foms/pei/index.tsx), na listagem (pages/PEI.tsx) e no
// Relatório de Evolução (constants/pdfRelatorioEvolucao.ts). Ainda não
// existe como campo no backend (ver docs/pedido-backend-formatacao.md);
// enquanto isso, uma meta sem status marcado simplesmente não mostra
// rótulo nenhum (nem no cadastro nem no relatório).
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

export const STATUS_META_LABEL: Record<string, string> = STATUS_META_OPTIONS.reduce(
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
