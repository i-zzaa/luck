export enum statusPacienteId {
  queue_avaliation = 1,
  queue_therapy = 2,
  therapy = 3,
  avaliation = 4,
  crud_therapy = 5,
}

export const patientAvaliationFields = [
  {
    labelText: 'Paciente',
    id: 'nome',
    name: 'pacientes',
    type: 'text',
    customCol: 'col-span-6 sm:col-span-4',
    singleSelect: false,
    validate: {
      pattern: {
        value: /^[ a-zA-Zá]*$/i,
        message: 'Apenas letras',
      },
      required: 'Campo obrigatório!',
      minlength: 8,
    },
  },
  {
    labelText: 'Data de nascimento',
    id: 'dataNascimento',
    name: 'dataNascimento',
    type: 'date',
    customCol: 'col-span-6 sm:col-span-4   sm:col-span-2',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
  },
  {
    labelText: 'Responsável',
    id: 'responsavel',
    name: 'responsavel',
    type: 'text',
    customCol: 'col-span-6 sm:col-span-4',
    singleSelect: false,
    validate: {
      pattern: {
        value: /^[ a-zA-Zá]*$/i,
        message: 'Apenas letras',
      },
      required: 'Campo obrigatório!',
      minlength: 8,
    },
  },
  {
    labelText: 'Telefone',
    id: 'telefone',
    name: 'telefone',
    type: 'tel',
    customCol: 'col-span-6 sm:col-span-4   sm:col-span-2',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
  },

  {
    labelText: 'Data do Contato',
    id: 'dataContato',
    name: 'dataContato',
    type: 'date',
    customCol: 'col-span-6 sm:col-span-3',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
  },
  {
    labelText: 'Convênio',
    id: 'convenioId',
    name: 'convenios',
    type: 'select',
    customCol: 'col-span-6 sm:col-span-3',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
  },
  {
    labelText: 'Período',
    id: 'periodoId',
    name: 'periodos',
    type: 'select',
    customCol: 'col-span-6 sm:col-span-3',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
  },
  {
    labelText: 'Especialidade',
    id: 'especialidades',
    name: 'especialidades',
    type: 'multiselect',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
    customCol: 'col-span-6 sm:col-span-3',
  },
  {
    labelText: 'Tipo Sessão',
    id: 'tipoSessaoId',
    name: 'tipoSessao',
    type: 'select',
    customCol: 'col-span-6 sm:col-span-3',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
  },
  {
    labelText: 'Prioridade',
    id: 'statusId',
    name: 'status',
    type: 'select',
    customCol: 'col-span-6 sm:col-span-3',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
  },
  {
    labelText: 'Observação',
    id: 'observacao',
    name: 'observacao',
    type: 'textarea',
    customCol: 'col-span-6 sm:col-span-6',
    singleSelect: false,
    validate: {
      required: false,
    },
  },
];

export const patientTherapyFields = [
  {
    labelText: 'Paciente',
    id: 'nome',
    name: 'pacientes',
    type: 'text',
    customCol: 'col-span-6 sm:col-span-4',
    singleSelect: false,
    validate: {
      pattern: {
        value: /^[ a-zA-Zá]*$/i,
        message: 'Apenas letras',
      },
      required: 'Campo obrigatório!',
      minlength: 8,
    },
  },
  {
    labelText: 'Data de nascimento',
    id: 'dataNascimento',
    name: 'dataNascimento',
    type: 'date',
    customCol: 'col-span-6 sm:col-span-4   sm:col-span-2',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
  },
  {
    labelText: 'Responsável',
    id: 'responsavel',
    name: 'responsavel',
    type: 'text',
    customCol: 'col-span-6 sm:col-span-4',
    singleSelect: false,
    validate: {
      pattern: {
        value: /^[ a-zA-Zá]*$/i,
        message: 'Apenas letras',
      },
      required: 'Campo obrigatório!',
      minlength: 8,
    },
  },
  {
    labelText: 'Telefone',
    id: 'telefone',
    name: 'telefone',
    type: 'tel',
    customCol: 'col-span-6 sm:col-span-4   sm:col-span-2',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
  },

  {
    labelText: 'Data Contato',
    id: 'dataVoltouAba',
    name: 'dataVoltouAba',
    type: 'date',
    customCol: 'col-span-6 sm:col-span-3',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
  },
  {
    labelText: 'Convênio',
    id: 'convenioId',
    name: 'convenios',
    type: 'select',
    customCol: 'col-span-6 sm:col-span-3',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
  },
  {
    labelText: 'Período',
    id: 'periodoId',
    name: 'periodos',
    type: 'select',
    customCol: 'col-span-6 sm:col-span-3',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
  },
  {
    labelText: 'Especialidade',
    id: 'especialidades',
    name: 'especialidades',
    type: 'multiselect',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
    customCol: 'col-span-6 sm:col-span-3',
  },
  {
    labelText: 'Prioridade',
    id: 'statusId',
    name: 'status',
    type: 'select',
    customCol: 'col-span-6 sm:col-span-3',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
  },
  {
    labelText: 'Observação',
    id: 'observacao',
    name: 'observacao',
    type: 'textarea',
    customCol: 'col-span-6 sm:col-span-6',
    singleSelect: false,
    validate: {
      required: false,
    },
  },
];

export const filterAvaliationFields = [
  {
    labelText: 'Paciente',
    id: 'pacientes',
    name: 'pacientes',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    labelText: 'Convênio',
    id: 'convenios',
    name: 'convenios',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    labelText: 'Especialidade',
    id: 'especialidades',
    name: 'especialidades',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    labelText: 'Prioridade',
    id: 'status',
    name: 'status',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    labelText: 'Períodos',
    id: 'periodos',
    name: 'periodos',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    labelText: 'Tipo sessão',
    id: 'tipoSessoes',
    name: 'tipoSessao',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    labelText: 'Agendados',
    id: 'naFila',
    name: 'naFila',
    customCol: 'col-span-6 sm:col-span-2',
    type: 'switch',
    singleSelect: false,
  },
  {
    labelText: 'Inativos',
    id: 'disabled',
    name: 'disabled',
    customCol: 'col-span-6 sm:col-span-2',
    type: 'switch',
    singleSelect: false,
  },
  {
    labelText: 'Devolutivas',
    id: 'devolutiva',
    name: 'devolutiva',
    customCol: 'col-span-6 sm:col-span-2',
    type: 'switch',
    singleSelect: false,
  },
];

export const filterTerapyFields = [
  {
    labelText: 'Paciente',
    id: 'pacientes',
    name: 'pacientes',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    labelText: 'Convênio',
    id: 'convenios',
    name: 'convenios',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    labelText: 'Especialidade',
    id: 'especialidades',
    name: 'especialidades',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    labelText: 'Períodos',
    id: 'periodos',
    name: 'periodos',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    labelText: 'Prioridade',
    id: 'status',
    name: 'status',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    labelText: 'Agendados',
    id: 'naFila',
    name: 'naFila',
    customCol: 'col-span-3 sm:col-span-2',
    type: 'switch',
    singleSelect: false,
  },
  {
    labelText: 'Inativos',
    id: 'disabled',
    name: 'disabled',
    customCol: 'col-span-3 sm:col-span-1',
    type: 'switch',
    singleSelect: false,
  },
];

export const filterPatientFields = [
  {
    labelText: 'Paciente',
    labelFor: 'pacientes',
    id: 'pacienteId',
    name: 'pacientes',
    autoComplete: 'paciente',
    isRequired: false,
    placeholder: 'Paciente',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    labelText: 'Convênio',
    labelFor: 'convenios',
    id: 'convenioId',
    name: 'convenios',
    autoComplete: 'convenio',
    isRequired: false,
    placeholder: 'convenio',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    labelText: 'Especialidade',
    labelFor: 'especialidades',
    id: 'especialidadeId',
    name: 'especialidades',
    autoComplete: 'especialidades',
    isRequired: false,
    placeholder: 'Especialidades',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    labelText: 'Terapeuta',
    labelFor: 'terapeuta',
    id: 'terapeutaId',
    name: 'terapeutas',
    autoComplete: 'Terapeuta',
    isRequired: false,
    placeholder: 'Terapeuta',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    labelText: 'Modalidade',
    labelFor: 'modalidades',
    id: 'modalidadeId',
    name: 'modalidades',
    autoComplete: 'modalidade',
    isRequired: false,
    placeholder: 'modalidade',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
];

export const filterCurdPatientFields = [
  {
    labelText: 'Paciente',
    id: 'pacientes',
    name: 'pacientes',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    labelText: 'Convênio',
    id: 'convenios',
    name: 'convenios',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    labelText: 'Especialidade',
    id: 'especialidades',
    name: 'especialidades',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
];

export const patientCrudFields = [
  {
    labelText: 'Paciente',
    id: 'nome',
    name: 'pacientes',
    type: 'text',
    customCol: 'col-span-6 sm:col-span-4',
    singleSelect: false,
    validate: {
      pattern: {
        value: /^[ a-zA-Zá]*$/i,
        message: 'Apenas letras',
      },
      required: 'Campo obrigatório!',
      minlength: 8,
    },
  },
  {
    labelText: 'Data de nascimento',
    id: 'dataNascimento',
    name: 'dataNascimento',
    type: 'date',
    customCol: 'col-span-6 sm:col-span-4   sm:col-span-2',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
  },
  {
    labelText: 'Responsável',
    id: 'responsavel',
    name: 'responsavel',
    type: 'text',
    customCol: 'col-span-6 sm:col-span-4',
    singleSelect: false,
    validate: {
      pattern: {
        value: /^[ a-zA-Zá]*$/i,
        message: 'Apenas letras',
      },
      required: 'Campo obrigatório!',
      minlength: 8,
    },
  },
  {
    labelText: 'Telefone',
    id: 'telefone',
    name: 'telefone',
    type: 'tel',
    customCol: 'col-span-6 sm:col-span-4   sm:col-span-2',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
  },

  {
    labelText: 'Data do Contato',
    id: 'dataVoltouAba',
    name: 'dataVoltouAba',
    type: 'date',
    customCol: 'col-span-6 sm:col-span-3',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
  },
  {
    labelText: 'Convênio',
    id: 'convenioId',
    name: 'convenios',
    type: 'select',
    customCol: 'col-span-6 sm:col-span-3',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
  },
  {
    labelText: 'Especialidade',
    id: 'especialidades',
    name: 'especialidades',
    type: 'multiselect',
    singleSelect: false,
    validate: {
      required: 'Campo obrigatório!',
    },
    customCol: 'col-span-6 sm:col-span-3',
  },
  {
    labelText: 'Observação',
    id: 'observacao',
    name: 'observacao',
    type: 'textarea',
    customCol: 'col-span-6 sm:col-span-6',
    singleSelect: false,
    validate: {
      required: false,
    },
  },
];
