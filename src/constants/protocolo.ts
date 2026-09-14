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

// Códigos de status de acompanhamento de uma meta. O status em si vem
// resolvido do backend (/pei/filtro, relatório de evolução, primeiras
// respostas) e a lista do select vem de GET /status-meta/dropdown — aqui
// ficam só as chaves das paletas/rótulos de apresentação abaixo.
export enum STATUS_META {
  atingida = 'atingida',
  aquisicao = 'aquisicao',
  manutencao = 'manutencao',
}

// Rótulo por extenso — tooltip/legenda de Primeiras Respostas.
export const STATUS_META_LABEL: Record<string, string> = {
  [STATUS_META.atingida]: 'Meta atingida',
  [STATUS_META.aquisicao]: 'Em aquisição',
  [STATUS_META.manutencao]: 'Meta atingida, manter em manutenção',
};

// Verde = atingida (sucesso), vermelho = em aquisição (ainda precisa de
// atenção) — confirmado com quem preenche o relatório hoje.
// "manutencao" reaproveita a cor de "atingida" (é uma meta atingida,
// só que em manutenção).
//
// tailwind.config.cjs REDEFINE a paleta inteira (não usa `extend`) com
// só um tom "claro" por cor (green-400/red-400/etc.) — "500" não
// existe nesse config, então `text-green-500` não gera CSS nenhum e a
// cor cai pro preto herdado em vez de verde.
export const STATUS_META_COLOR_CLASS: Record<string, string> = {
  [STATUS_META.atingida]: 'text-green-400',
  [STATUS_META.manutencao]: 'text-green-400',
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
// bg-green-100/text-green-700/bg-red-100/text-red-700 NÃO existem na
// paleta customizada (tailwind.config.cjs só define um tom "400" por
// cor) — usa o hex direto (arbitrary value), que funciona independente
// do que o config define.
export const STATUS_META_PILL_CLASS: Record<string, string> = {
  [STATUS_META.atingida]: 'bg-[#dcfce7] text-[#15803d]',
  [STATUS_META.manutencao]: 'bg-[#dcfce7] text-[#15803d]',
  [STATUS_META.aquisicao]: 'bg-[#fee2e2] text-[#b91c1c]',
};
