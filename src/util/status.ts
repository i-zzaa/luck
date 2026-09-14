// Classificação/cor do status de um evento (Falta, Atestado, Atendido...).
// Usado no badge (ScheduleInfo.tsx), na Agenda e na tela de Sessão — um
// lugar só pra não divergir.
//
// Lê `statusEventos.codigo`, código estável que o backend manda em todo
// evento (coluna NOT NULL em StatusEventos, migration
// 20260821180000_especialidade_status_evento_codigo). Antes o front
// adivinhava a categoria por substring do `nome` livre.
export type CategoriaStatus = 'falta' | 'atestado' | 'atendido' | 'outro';

export const classificarStatus = (statusEventos?: {
  codigo?: string;
  nome?: string;
}): CategoriaStatus => {
  const codigo = statusEventos?.codigo?.toLowerCase();
  if (codigo === 'falta' || codigo === 'atestado' || codigo === 'atendido') {
    return codigo;
  }
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
