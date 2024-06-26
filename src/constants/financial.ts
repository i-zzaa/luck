export const filterFinancialFields = [
  {
    permission: 'FINANCEIRO_FILTRO_SELECT_TERAPEUTA',
    labelText: 'Terapeuta',
    id: 'terapeutaId',
    name: 'terapeutas',
    customCol: 'col-span-6 sm:col-span-2',
    type: 'select',
  },

  {
    permission: 'FINANCEIRO_FILTRO_SELECT_DATA_INICIAL',
    labelText: 'Data Inicial',
    id: 'dataInicio',
    name: 'dataInicio',
    customCol: 'col-span-6 sm:col-span-1',
    type: 'date',
  },
  {
    permission: 'FINANCEIRO_FILTRO_SELECT_DATA_FINAL',
    labelText: 'Data Final',
    id: 'datatFim',
    name: 'datatFim',
    customCol: 'col-span-6 sm:col-span-1',
    type: 'date',
  },
  {
    permission: 'FINANCEIRO_FILTRO_SELECT_TERAPEUTA',
    labelText: 'Status Eventos',
    labelFor: 'statusEventos',
    id: 'statusEventosId',
    name: 'statusEventos',
    autoComplete: 'statusEventos',
    isRequired: false,
    placeholder: 'statusEventos',
    customCol: 'col-span-6 sm:col-span-2',
    type: 'select',
    singleSelect: false,
  },
];
export const filterFinancialPacienteFields = [
  {
    permission: 'FINANCEIRO_FILTRO_SELECT_PACIENTE',
    labelText: 'Paciente',
    id: 'pacienteId',
    name: 'pacientes',
    customCol: 'col-span-6 sm:col-span-2',
    type: 'select',
  },

  {
    permission: 'FINANCEIRO_FILTRO_SELECT_DATA_INICIAL',
    labelText: 'Data Inicial',
    id: 'dataInicio',
    name: 'dataInicio',
    customCol: 'col-span-6 sm:col-span-1',
    type: 'date',
  },
  {
    permission: 'FINANCEIRO_FILTRO_SELECT_DATA_FINAL',
    labelText: 'Data Final',
    id: 'datatFim',
    name: 'datatFim',
    customCol: 'col-span-6 sm:col-span-1',
    type: 'date',
  },
  {
    permission: 'FINANCEIRO_FILTRO_SELECT_TERAPEUTA',
    labelText: 'Status Eventos',
    labelFor: 'statusEventos',
    id: 'statusEventosId',
    name: 'statusEventos',
    autoComplete: 'statusEventos',
    isRequired: false,
    placeholder: 'statusEventos',
    customCol: 'col-span-6 sm:col-span-2',
    type: 'select',
    singleSelect: false,
  },
];
