// A API usa `id === 0` como sentinela pra "horário livre/vago" dentro da
// resposta de /evento/filtro — uma convenção implícita, não documentada
// em nenhum campo explícito. Isso é frágil (um evento real com id 0 por
// qualquer motivo seria tratado como vaga livre) e aparece repetido em
// pelo menos 2 lugares (Schedule.tsx, Home.tsx).
//
// FALLBACK TEMPORÁRIO: prefere um campo `tipo` explícito
// (`"livre" | "agendado"`) se o backend mandar; enquanto não vier, cai no
// sentinela `id === 0` como hoje. Ver docs/pedido-backend-formatacao.md.
export const isSlotLivre = (item: any): boolean => {
  if (item?.tipo) return item.tipo === 'livre';
  return item?.id === 0;
};

// Decide se já existe um registro de sessão pra buscar (GET /sessao/:id)
// em vez de partir pro fluxo de sessão nova. Hoje isso é uma HEURÍSTICA
// (assume que "atendido" ou "data já passou" implica que um registro foi
// criado) — nem sempre verdadeiro (ex.: terapeuta que não abriu o app por
// dias pode ter uma sessão passada sem nenhum registro ainda).
//
// FALLBACK TEMPORÁRIO: prefere `item.temSessaoRegistrada` (booleano
// explícito) se o backend mandar; sem ele, cai na heurística atual — o
// chamador precisa calcular e passar essa heurística como `fallback`.
// Ver docs/pedido-backend-formatacao.md.
export const temSessaoRegistrada = (item: any, fallback: boolean): boolean =>
  typeof item?.temSessaoRegistrada === 'boolean'
    ? item.temSessaoRegistrada
    : fallback;

// Decide se o clique no card de um evento pode abrir a tela de Sessão.
// Hoje isso é calculado no cliente combinando duas coisas: "sessão
// passada e nunca marcada como atendida" (naoAtendido) OU
// "statusEventos.atender === false" (o evento não é do tipo que registra
// sessão). NÃO afeta o botão "Pesquisar" (que navega pra Metas, ação
// independente) — só o clique no card em si.
//
// FALLBACK TEMPORÁRIO: prefere `item.sessaoBloqueada` (booleano) se o
// backend mandar; sem ele, cai no cálculo atual — o chamador continua
// calculando `naoAtendido`/`atender` e passa como `fallback`. Ver
// docs/pedido-backend-formatacao.md.
export const sessaoBloqueada = (item: any, fallback: boolean): boolean =>
  typeof item?.sessaoBloqueada === 'boolean' ? item.sessaoBloqueada : fallback;
