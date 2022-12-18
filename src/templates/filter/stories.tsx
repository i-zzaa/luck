import { Meta, StoryObj } from '@storybook/react';
import { Filter, FilterProps } from './index';

export default {
  title: 'Templates/Filter',
  component: Filter,
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
    onSubmit: (e: any) => {
      console.log(e);
    },
  },
} as Meta<FilterProps>;

export const Default: StoryObj<FilterProps> = {};
