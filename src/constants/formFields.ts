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

export { loginFields };
