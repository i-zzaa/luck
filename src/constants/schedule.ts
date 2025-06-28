export enum STATUS_EVENTS {
  atendido = 'Atendido',
  atestado = 'Atestado',
  livre = 'Livre',
  confirmado = 'Confirmado',
}

export const filterCalendarFields = [
  {
    permission: 'AGENDA_CALENDARIO_FILTRO_BOTAO_PESQUISAR',
    labelText: 'Data Inicial',
    id: 'dataInicio',
    name: 'dataInicio',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'date',
  },
  {
    permission: 'AGENDA_CALENDARIO_FILTRO_BOTAO_PESQUISAR',
    labelText: 'Data Final',
    id: 'datatFim',
    name: 'datatFim',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'date',
  },
];
