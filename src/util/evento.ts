// Horário livre/vago dentro da resposta de /evento/filtro. O backend manda
// `tipo: "livre" | "agendado"` em todo item (heron-list-nest:
// TerapeutaService.eventFree / AgendaService.formatEvents) — antes o front
// usava `id === 0` como sentinela implícita.
//
// `temSessaoRegistrada`, `podeAbrirSessao`, `podeEditarMetas` e
// `modalidadeExibicao` também vêm prontos em cada evento e são lidos
// direto do item (useSessionForm.ts, Schedule.tsx).
export const isSlotLivre = (item: any): boolean => item?.tipo === 'livre';
