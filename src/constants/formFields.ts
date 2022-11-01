const loginFields = [
  {
    labelText: "Login",
    labelFor: "login",
    id: "login",
    name: "login",
    type: "text",
    autoComplete: "email",
    isRequired: true,
    placeholder: "Login",
    validate: {
      pattern: {
        value: /^([a-z]{3,})+\.([a-z]{3,})$/i,
        message: "formato padrão xxx.xxx",
      },
      required: "Campo obrigatório!",
      minlength: 8,
    },
  },
  {
    labelText: "Senha",
    labelFor: "senha",
    id: "senha",
    name: "senha",
    type: "password",
    isRequired: true,
    placeholder: "Senha",
    validate: {
      required: "Campo obrigatório!",
    },
  },
];

const userFields = [
  {
    labelText: "Nome",
    labelFor: "nome",
    id: "nome",
    name: "nome",
    type: "text",
    autoComplete: "nome",
    isRequired: true,
    placeholder: "Nome",
    validate: {
      pattern: {
        value: /^[ a-zA-Zá]*$/i,
        message: "Apenas letras",
      },
      required: "Campo obrigatório!",
      minlength: 8,
    },
  },
  {
    labelText: "Login",
    labelFor: "login",
    id: "login",
    name: "login",
    type: "text",
    autoComplete: "email",
    isRequired: true,
    placeholder: "Login (nome.sobrenome)",
    validate: {
      pattern: {
        value: /^([a-z]{3,})+\.([a-z]{3,})$/i,
        message: "formato padrão, ex.: nome.sobrenome",
      },
      required: "Campo obrigatório!",
      minlength: 8,
    },
  },
  {
    labelText: "Senha",
    labelFor: "senha",
    id: "senha",
    name: "senha",
    type: "password",
    autoComplete: "current-password",
    isRequired: true,
    placeholder: "senha",
    validate: {
      required: "Campo obrigatório!",
      minlength: 8,
    },
    hidden: true,
  },
  {
    labelText: "Perfil",
    labelFor: "perfil",
    id: "perfilId",
    name: "perfilId",
    type: "select",
    autoComplete: "perfil",
    isRequired: true,
    placeholder: "Selecione a permissão",
    validate: {
      required: "Campo obrigatório!",
    },
  },
];

const patientFields = [
  {
    labelText: "Paciente",
    labelFor: "paciente",
    id: "nome",
    name: "paciente",
    type: "text",
    autoComplete: "paciente",
    isRequired: true,
    placeholder: "Paciente",
    customCol: "col-span-6 sm:col-span-4",
    singleSelect: false,
    validate: {
      pattern: {
        value: /^[ a-zA-Zá]*$/i,
        message: "Apenas letras",
      },
      required: "Campo obrigatório!",
      minlength: 8,
    },
  },
  {
    labelText: "Data de nascimento",
    labelFor: "data-nascimento",
    id: "dataNascimento",
    name: "dataNascimento",
    type: "date",
    autoComplete: "data-nascimento",
    isRequired: true,
    placeholder: "Data de nascimento",
    customCol: "col-span-6 sm:col-span-4   sm:col-span-2",
    singleSelect: false,
    validate: {
      required: "Campo obrigatório!",
    },
  },
  {
    labelText: "Responsável",
    labelFor: "responsavel",
    id: "responsavel",
    name: "responsavel",
    type: "text",
    autoComplete: "responsavel",
    isRequired: true,
    placeholder: "Nome completo do responsável",
    customCol: "col-span-6 sm:col-span-4",
    singleSelect: false,
    validate: {
      pattern: {
        value: /^[ a-zA-Zá]*$/i,
        message: "Apenas letras",
      },
      required: "Campo obrigatório!",
      minlength: 8,
    },
  },
  {
    labelText: "Telefone",
    labelFor: "telefone",
    id: "telefone",
    name: "telefone",
    type: "tel",
    autoComplete: "telefone",
    isRequired: true,
    placeholder: "Telefone",
    customCol: "col-span-6 sm:col-span-4   sm:col-span-2",
    singleSelect: false,
    validate: {
      required: "Campo obrigatório!",
    },
  },

  {
    labelText: "Data do Contato",
    labelFor: "dataContato",
    id: "dataContato",
    name: "dataContato",
    type: "date",
    autoComplete: "dataContato",
    isRequired: true,
    placeholder: "Data do contato",
    customCol: "col-span-6 sm:col-span-3",
    singleSelect: false,
    validate: {
      required: "Campo obrigatório!",
    },
  },
  {
    labelText: "Convênio",
    labelFor: "convenio",
    id: "convenioId",
    name: "convenio",
    type: "select",
    autoComplete: "convenio",
    isRequired: true,
    placeholder: "Convênio",
    customCol: "col-span-6 sm:col-span-3",
    singleSelect: false,
    validate: {
      required: "Campo obrigatório!",
    },
  },
  {
    labelText: "Período",
    labelFor: "periodo",
    id: "periodoId",
    name: "periodo",
    type: "select",
    autoComplete: "periodo",
    isRequired: true,
    placeholder: "Período",
    customCol: "col-span-6 sm:col-span-3",
    singleSelect: false,
    validate: {
      required: "Campo obrigatório!",
    },
  },
  {
    labelText: "Especialidade",
    labelFor: "especialidade",
    id: "especialidades",
    name: "especialidade",
    type: "multiselect",
    singleSelect: false,
    validate: {
      required: "Campo obrigatório!",
    },
    autoComplete: "especialidade",
    isRequired: true,
    placeholder: "Especialidade",
    customCol: "col-span-6 sm:col-span-3",
  },
  {
    labelText: "Tipo Sessão",
    labelFor: "tipoSessao",
    id: "tipoSessaoId",
    name: "tipoSessao",
    type: "select",
    autoComplete: "tipoSessao",
    isRequired: true,
    placeholder: "Tipo  de Sessão",
    customCol: "col-span-6 sm:col-span-3",
    singleSelect: false,
    validate: {
      required: "Campo obrigatório!",
    },
  },
  {
    labelText: "Prioridade",
    labelFor: "prioridade",
    id: "statusId",
    name: "status",
    type: "select",
    autoComplete: "prioridade",
    isRequired: true,
    placeholder: "Prioridade",
    customCol: "col-span-6 sm:col-span-3",
    singleSelect: false,
    validate: {
      required: "Campo obrigatório!",
    },
  },
  {
    labelText: "Observação",
    labelFor: "Observação",
    id: "observacao",
    name: "observacao",
    type: "textarea",
    autoComplete: "observacao",
    isRequired: false,
    placeholder: "",
    customCol: "col-span-6 sm:col-span-6",
    singleSelect: false,
  },
];

const filterFields = [
  {
    labelText: "Paciente",
    labelFor: "paciente",
    id: "pacientes",
    name: "paciente",
    autoComplete: "paciente",
    isRequired: false,
    placeholder: "Paciente",
    customCol: "col-span-6 sm:col-span-3",
    type: "select",
    singleSelect: false,
  },
  {
    labelText: "Convênio",
    labelFor: "convenio",
    id: "convenios",
    name: "convenio",
    autoComplete: "convenio",
    isRequired: false,
    placeholder: "convenio",
    customCol: "col-span-6 sm:col-span-3",
    type: "select",
    singleSelect: false,
  },
  {
    labelText: "Especialidade",
    labelFor: "especialidade",
    id: "especialidades",
    name: "especialidade",
    autoComplete: "especialidades",
    isRequired: false,
    placeholder: "Especialidades",
    customCol: "col-span-6 sm:col-span-3",
    type: "select",
    singleSelect: false,
  },
  {
    labelText: "Prioridade",
    labelFor: "prioridade",
    id: "status",
    name: "status",
    autoComplete: "prioridade",
    isRequired: false,
    placeholder: "Prioridades",
    customCol: "col-span-6 sm:col-span-3",
    type: "select",
    singleSelect: false,
  },
  {
    labelText: "Períodos",
    labelFor: "periodo",
    id: "periodos",
    name: "periodo",
    autoComplete: "periodo",
    isRequired: false,
    placeholder: "Períodos",
    customCol: "col-span-6 sm:col-span-3",
    type: "select",
    singleSelect: false,
  },
  {
    labelText: "Tipo sessão",
    labelFor: "tipoSessao",
    id: "tipoSessoes",
    name: "tipoSessao",
    autoComplete: "tipoSessao",
    isRequired: false,
    placeholder: "Tipo sessão",
    customCol: "col-span-6 sm:col-span-3",
    type: "select",
    singleSelect: false,
  },
  {
    labelText: "Agendados",
    labelFor: "naFila",
    id: "naFila",
    name: "naFila",
    autoComplete: "naFila",
    isRequired: false,
    placeholder: "Agendados",
    customCol: "col-span-6 sm:col-span-2",
    type: "switch",
    singleSelect: false,
  },
  {
    labelText: "Inativos",
    labelFor: "disabled",
    id: "disabled",
    name: "disabled",
    autoComplete: "disabled",
    isRequired: false,
    placeholder: "Inativos",
    customCol: "col-span-6 sm:col-span-2",
    type: "switch",
    singleSelect: false,
  },
  {
    labelText: "Devolutivas",
    labelFor: "devolutiva",
    id: "devolutiva",
    name: "devolutiva",
    autoComplete: "devolutiva",
    isRequired: false,
    placeholder: "Devolutivas",
    customCol: "col-span-6 sm:col-span-2",
    type: "switch",
    singleSelect: false,
  },
];

const calendarFields = [
  {
    labelText: "Data",
    labelFor: "data",
    id: "data",
    name: "data",
    autoComplete: "data",
    isRequired: true,
    placeholder: "Data",
    customCol: "col-span-6 sm:col-span-2",
    type: "date",
    singleSelect: false,
    validate: {
      required: true,
    },
  },
  {
    labelText: "Horario Inincial",
    labelFor: "start",
    id: "start",
    name: "start",
    autoComplete: "start",
    isRequired: true,
    placeholder: "Horario Inincial",
    customCol: "col-span-6 sm:col-span-2",
    type: "time",
    singleSelect: false,
    validate: {
      required: true,
    },
  },
  {
    labelText: "Horario Final",
    labelFor: "end",
    id: "end",
    name: "end",
    autoComplete: "end",
    isRequired: true,
    placeholder: "Horario Final",
    customCol: "col-span-6 sm:col-span-2",
    type: "time",
    singleSelect: false,
    validate: {
      required: true,
    },
  },
  {
    labelText: "Paciente",
    labelFor: "paciente",
    id: "pacientes",
    name: "paciente",
    autoComplete: "paciente",
    isRequired: false,
    placeholder: "Paciente",
    customCol: "col-span-6 sm:col-span-6",
    type: "select",
    singleSelect: false,
    validate: {
      required: true,
    },
  },
  {
    labelText: "Modalidade",
    labelFor: "modalidadade",
    id: "modalidadades",
    name: "modalidadade",
    autoComplete: "modalidadades",
    isRequired: false,
    placeholder: "modalidadades",
    customCol: "col-span-6 sm:col-span-3",
    type: "select",
    singleSelect: false,
    validate: {
      required: true,
    },
  },
  {
    labelText: "Especialidade",
    labelFor: "especialidade",
    id: "especialidades",
    name: "especialidade",
    autoComplete: "especialidades",
    isRequired: false,
    placeholder: "Especialidades",
    customCol: "col-span-6 sm:col-span-3",
    type: "select",
    singleSelect: false,
    validate: {
      required: true,
    },
  },
  {
    labelText: "Terapeuta",
    labelFor: "terapeuta",
    id: "terapeutas",
    name: "terapeuta",
    autoComplete: "terapeuta",
    isRequired: false,
    placeholder: "Terapeuta",
    customCol: "col-span-6 sm:col-span-3",
    type: "select",
    singleSelect: false,
    validate: {
      required: true,
    },
  },
  {
    labelText: "Função",
    labelFor: "funcao",
    id: "funcaos",
    name: "funcao",
    autoComplete: "funcaos",
    isRequired: false,
    placeholder: "funcaos",
    customCol: "col-span-6 sm:col-span-3",
    type: "select",
    singleSelect: false,
    validate: {
      required: true,
    },
  },
  {
    labelText: "Local",
    labelFor: "localidade",
    id: "localidades",
    name: "localidade",
    autoComplete: "localidade",
    isRequired: false,
    placeholder: "localidade",
    customCol: "col-span-6 sm:col-span-3",
    type: "select",
    singleSelect: false,
    validate: {
      required: true,
    },
  },

  {
    labelText: "Status",
    labelFor: "staus_evento",
    id: "staus_evento",
    name: "staus_evento",
    autoComplete: "staus_evento",
    isRequired: false,
    placeholder: "staus_evento",
    customCol: "col-span-6 sm:col-span-3",
    type: "select",
    singleSelect: false,
    validate: {
      required: true,
    },
  },
  {
    labelText: "Frequência",
    labelFor: "tipoRepeticao",
    id: "tipoRepeticao",
    name: "tipoRepeticao",
    autoComplete: "tipoRepeticao",
    isRequired: false,
    placeholder: "Tipo de repetição",
    customCol: "col-span-6 sm:col-span-3",
    type: "select",
    singleSelect: false,
    validate: {
      required: true,
    },
  },
];

const usuariosFields: any = [
  {
    labelText: "Nome",
    labelFor: "nome",
    id: "nome",
    name: "nome",
    type: "text",
    autoComplete: "nome",
    isRequired: true,
    placeholder: "Nome",
    validate: {
      pattern: {
        value: /^[ a-zA-Zá]*$/i,
        message: "Apenas letras",
      },
      required: "Campo obrigatório!",
      minlength: 8,
    },
  },
  {
    labelText: "Login",
    labelFor: "login",
    id: "login",
    name: "login",
    type: "text",
    autoComplete: "email",
    isRequired: true,
    placeholder: "Login (nome.sobrenome)",
    validate: {
      pattern: {
        value: /^([a-z]{3,})+\.([a-z]{3,})$/i,
        message: "formato padrão, ex.: nome.sobrenome",
      },
      required: "Campo obrigatório!",
      minlength: 8,
    },
  },
  {
    labelText: "Perfil",
    labelFor: "perfies",
    id: "perfilId",
    name: "perfil",
    type: "select",
    autoComplete: "perfil",
    isRequired: true,
    placeholder: "Selecione a permissão",
    validate: {
      required: "Campo obrigatório!",
    },
  },
  {
    labelText: "Especialidade",
    labelFor: "especialidades",
    id: "especialidadeId",
    name: "especialidade",
    type: "select",
    autoComplete: "especialidade",
    isRequired: true,
    placeholder: "Selecione a permissão",
    customCol: "col-span-6 sm:col-span-3",
    hidden: true,
  },
  {
    labelText: "Função",
    labelFor: "funcoes",
    id: "funcoes",
    name: "funcao",
    type: "multiselect",
    autoComplete: "funcao",
    isRequired: true,
    placeholder: "Selecione a permissão",
    customCol: "col-span-6 sm:col-span-3",
    hidden: true,
  },
];

const funcaoFields = [
  {
    labelText: "Nome",
    labelFor: "nome",
    id: "nome",
    name: "nome",
    autoComplete: "nome",
    isRequired: true,
    placeholder: "Nome",
    customCol: "col-span-6 sm:col-span-6",
    type: "text",
    validate: {
      required: true,
    },
  },
  {
    labelText: "Especialidade",
    labelFor: "especialidades",
    id: "especialidadeId",
    name: "especialidade",
    autoComplete: "especialidades",
    isRequired: false,
    placeholder: "Especialidades",
    customCol: "col-span-6",
    type: "select",
    singleSelect: false,
  },
];

const localidadeFields = [
  {
    labelText: "Casa",
    labelFor: "casa",
    id: "casa",
    name: "casa",
    autoComplete: "casa",
    isRequired: true,
    placeholder: "Casa",
    customCol: "col-span-6",
    type: "text",
    validate: {
      required: true,
    },
  },
  {
    labelText: "Sala",
    labelFor: "sala",
    id: "sala",
    name: "sala",
    autoComplete: "sala",
    isRequired: true,
    placeholder: "Sala",
    customCol: "col-span-6",
    type: "text",
    validate: {
      required: true,
    },
  },
];

const modalidadeFields = [
  {
    labelText: "Nome",
    labelFor: "nome",
    id: "nome",
    name: "nome",
    autoComplete: "nome",
    isRequired: true,
    placeholder: "nome",
    customCol: "col-span-6",
    type: "text",
    validate: {
      required: true,
    },
  },
];

const frequenciaFields = [
  {
    labelText: "Nome",
    labelFor: "nome",
    id: "nome",
    name: "nome",
    autoComplete: "nome",
    isRequired: true,
    placeholder: "nome",
    customCol: "col-span-6",
    type: "text",
    validate: {
      required: true,
    },
  },
];

const statusEventosFields = [
  {
    labelText: "Nome",
    labelFor: "nome",
    id: "nome",
    name: "nome",
    autoComplete: "nome",
    isRequired: true,
    placeholder: "nome",
    customCol: "col-span-6",
    type: "text",
    validate: {
      required: true,
    },
  },
];

const filterCalendarFields = [
  {
    labelText: "Pacientes",
    labelFor: "pacientes",
    id: "pacientes",
    name: "pacientes",
    autoComplete: "paciente",
    isRequired: false,
    placeholder: "Paciente",
    customCol: "col-span-6 sm:col-span-2",
    type: "select",
    singleSelect: false,
  },
  {
    labelText: "Terapeutas",
    labelFor: "terapeutas",
    id: "terapeutas",
    name: "terapeutas",
    autoComplete: "terapeuta",
    isRequired: false,
    placeholder: "terapeuta",
    customCol: "col-span-6 sm:col-span-2",
    type: "select",
    singleSelect: false,
  },
  {
    labelText: "Status Eventos",
    labelFor: "statusEventos",
    id: "statusEventos",
    name: "statusEventos",
    autoComplete: "statusEventos",
    isRequired: false,
    placeholder: "statusEventos",
    customCol: "col-span-6 sm:col-span-2",
    type: "select",
    singleSelect: false,
  },
];

export {
  loginFields,
  patientFields,
  userFields,
  filterFields,
  calendarFields,
  filterCalendarFields,
};

export const Fields: any = {
  usuariosFields,
  funcaoFields,
  localidadeFields,
  modalidadeFields,
  frequenciaFields,
  statusEventosFields,
};
