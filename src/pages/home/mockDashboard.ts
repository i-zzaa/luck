// MOCK — a lista de "sessões sem resumo pendente" não tem como ser
// calculada só com o que /evento/filtro já devolve hoje: o campo
// `resumo` mora no registro da sessão (GET /sessao/:id), não no evento.
// Buscar sessão por sessão pra cada evento "Atendido" seria N+1
// requisições. Fica mockado até o backend expor esse dado direto no
// evento — ver o pedido em docs/pedido-backend-dashboard.md.
export interface SessaoSemResumo {
  id: number;
  pacienteNome: string;
  data: string; // DD/MM
  horario: string;
}

export const getMockSessoesSemResumo = (): SessaoSemResumo[] => [
  {
    id: 9001,
    pacienteNome: 'Gabriel Luis Guido',
    data: '19/08',
    horario: '10:00',
  },
  {
    id: 9002,
    pacienteNome: 'Ana Clara Souza',
    data: '18/08',
    horario: '15:30',
  },
];
