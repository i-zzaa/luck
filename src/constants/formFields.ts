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

export { loginFields };

export const Fields: any = {
  programaFields,
};
