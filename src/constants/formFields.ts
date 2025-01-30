const loginFields = [
  {
    labelText: 'Login',
    labelFor: 'username',
    id: 'username',
    name: 'username',
    type: 'text',
    autoComplete: 'text',
    isRequired: true,
    placeholder: 'Login',
    validate: {
      pattern: {
        value: /^([a-z]{3,})+\.([a-z]{3,})$/i,
        message: 'formato padrão xxx.xxx',
      },
      required: 'Campo obrigatório!',
      minlength: 8,
    },
  },
  {
    labelText: 'Senha',
    labelFor: 'password',
    id: 'password',
    name: 'password',
    type: 'password',
    isRequired: true,
    placeholder: 'Senha',
    validate: {
      required: 'Campo obrigatório!',
    },
  },
];

const PEIFields = [
  {
    permission: 'PEI_FILTRO_BOTAO_CADASTRAR',
    labelText: 'Paciente',
    id: 'pacienteId',
    name: 'paciente',
    type: 'select',
    singleSelect: true,
    customCol: 'col-span-6 sm:col-span-6',
  },
  {
    permission: 'PEI_FILTRO_SELECT_PROTOCOLO',
    labelText: 'Protocolo',
    id: 'protocoloId',
    name: 'protocolo',
    type: 'select',
    singleSelect: true,
    customCol: 'col-span-6 sm:col-span-6',
  },
];

const PEICadastroFields = [
  // {
  //   permission: 'PEI_FILTRO_BOTAO_CADASTRAR',
  //   labelText: 'Paciente',
  //   id: 'pacienteId',
  //   name: 'paciente',
  //   type: 'select',
  //   singleSelect: true,
  //   customCol: 'col-span-6 sm:col-span-6',
  // },
  {
    permission: 'PEI_FILTRO_BOTAO_CADASTRAR',
    labelText: 'Procedimento de Ensino',
    id: 'procedimentoEnsinoId',
    name: 'procedimentoEnsino',
    type: 'select',
    singleSelect: false,
    customCol: 'col-span-6 sm:col-span-6',
  },
  {
    permission: 'PEI_FILTRO_BOTAO_CADASTRAR',
    labelText: 'Programa',
    id: 'programaId',
    name: 'programa',
    type: 'select',
    singleSelect: true,
    customCol: 'col-span-6 sm:col-span-6',
  },
  {
    permission: 'PEI_FILTRO_BOTAO_CADASTRAR',
    labelText: 'Estímulo Discriminativo',
    id: 'estimuloDiscriminativo',
    name: 'estimuloDiscriminativo',
    type: 'text',
    customCol: 'col-span-6 sm:col-span-6',
  },
  {
    permission: 'PEI_FILTRO_BOTAO_CADASTRAR',
    labelText: 'Resposta',
    id: 'resposta',
    name: 'resposta',
    type: 'text',
    customCol: 'col-span-6 sm:col-span-6',
  },
  {
    permission: 'PEI_FILTRO_BOTAO_CADASTRAR',
    labelText: 'Estímulo Reforçador Positivo',
    id: 'estimuloReforcadorPositivo',
    name: 'estimuloReforcadorPositivo',
    type: 'text',
    customCol: 'col-span-6 sm:col-span-6',
  },
  // {
  //   permission: 'PEI_FILTRO_BOTAO_CADASTRAR',
  //   labelText: 'Meta',
  //   labelFor: 'meta',
  //   id: 'meta0',
  //   name: 'meta',
  //   type: 'input-add',
  //   isRequired: true,
  //   customCol: 'col-span-5 sm:col-span-5',
  //   buttonAdd: true,
  // },
];

export const atividadesFields = {
  labelText: 'Atividade',
  labelFor: 'atividade',
  id: 'atividade0',
  name: 'atividade',
  type: 'input-add',
  isRequired: true,
  placeholder: 'Atividade',
  customCol: 'col-span-5 sm:col-span-5',
  buttonAdd: true,

  validate: {
    required: 'Campo obrigatório!',
  },
};

const programaFields = [
  {
    labelText: 'Programa',
    labelFor: 'nome',
    id: 'nome',
    name: 'nome',
    type: 'text',
    autoComplete: 'text',
    isRequired: true,
    placeholder: 'Programa',
    customCol: 'col-span-6 sm:col-span-6',

    validate: {
      required: 'Campo obrigatório!',
      minlength: 8,
    },
  },
];

const ProtocoloFields = [
  {
    permission: 'PEI_FILTRO_BOTAO_CADASTRAR',
    labelText: 'Paciente',
    id: 'pacienteId',
    name: 'paciente',
    type: 'select',
    singleSelect: true,
    customCol: 'col-span-6 sm:col-span-6',
  },
  {
    permission: 'PEI_FILTRO_BOTAO_CADASTRAR',
    labelText: 'Protocolo',
    id: 'protocoloId',
    name: 'protocolo',
    type: 'select',
    singleSelect: true,
    customCol: 'col-span-6 sm:col-span-6',
  },
];

const PortageCadastroFields = [
  {
    permission: 'PEI_FILTRO_BOTAO_CADASTRAR',
    labelText: 'Atividade',
    id: 'atividadeId',
    name: 'atividade',
    type: 'select',
    singleSelect: true,
    customCol: 'col-span-6 sm:col-span-6',
  },
  {
    permission: 'PEI_FILTRO_BOTAO_CADASTRAR',
    labelText: 'Tipo',
    id: 'tipoId',
    name: 'tipoPortage',
    type: 'select',
    singleSelect: true,
    customCol: 'col-span-6 sm:col-span-6',
  },
  {
    permission: 'PEI_FILTRO_BOTAO_CADASTRAR',
    labelText: 'Faixa Etaria',
    id: 'FaixaEtariaId',
    name: 'faixaEtaria',
    type: 'select',
    singleSelect: true,
    customCol: 'col-span-6 sm:col-span-6',
  },
];

export {
  loginFields,
  PEIFields,
  PEICadastroFields,
  ProtocoloFields,
  PortageCadastroFields,
};

export const Fields: any = {
  programaFields,
};
