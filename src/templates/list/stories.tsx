import { Meta, StoryObj } from '@storybook/react';
import { List, ListProps } from './index';

export default {
  title: 'Templates/List',
  component: List,
  args: {
    items: [
      {
        id: '1',
        nome: 'Nome completo',
        perfil: { nome: 'Perfil' },
        login: 'user.login',
      },
      {
        id: '2',
        nome: 'Nome completo 2',
        perfil: { nome: 'Perfil2' },
        login: 'user.login',
      },
    ],
    type: 'simples',
    onSubmit: (e) => {
      console.log(e);
    },
  },
} as Meta<ListProps>;

export const Default: StoryObj<ListProps> = {};
