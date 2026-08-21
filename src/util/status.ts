// Classificação/cor do status de um evento (Falta, Atestado, Atendido...).
// Antes essa mesma lógica existia DUPLICADA em ScheduleInfo.tsx (pra cor do
// badge) e Home.tsx (pra contagem do dashboard) — cada uma com suas
// próprias strings, sem nenhuma garantia de ficarem em sincronia se uma
// mudasse sem a outra. Consolidado aqui num único lugar.
//
// FALLBACK TEMPORÁRIO: o ideal é o backend já mandar uma classificação
// pronta e estável (`statusEventos.codigo`), em vez do frontend adivinhar
// por substring do texto livre (`statusEventos.nome`) — texto livre pode
// mudar de pontuação/capitalização sem aviso e quebrar esse matching. Até
// o backend expor esse campo (ver docs/pedido-backend-formatacao.md),
// `classificarStatus` cai no matching por substring como faz hoje.
export type CategoriaStatus = 'falta' | 'atestado' | 'atendido' | 'outro';

export const classificarStatus = (statusEventos?: {
  codigo?: string;
  nome?: string;
}): CategoriaStatus => {
  const codigo = statusEventos?.codigo?.toLowerCase();
  if (codigo === 'falta' || codigo === 'atestado' || codigo === 'atendido') {
    return codigo;
  }

  const normalized = (statusEventos?.nome || '').toLowerCase();
  if (normalized.includes('falta')) return 'falta';
  if (normalized.includes('atestado')) return 'atestado';
  if (normalized.includes('atendido')) return 'atendido';
  return 'outro';
};

const CLASSE_POR_CATEGORIA: Record<CategoriaStatus, string> = {
  falta: 'bg-red-400 text-white',
  atestado: 'bg-yellow-400 text-gray-800',
  atendido: 'bg-gray-300 text-gray-800',
  outro: 'bg-gray-300 text-gray-800',
};

export const getStatusClass = (statusEventos?: {
  codigo?: string;
  nome?: string;
}): string => CLASSE_POR_CATEGORIA[classificarStatus(statusEventos)];
