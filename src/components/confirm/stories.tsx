import { Meta, StoryObj } from '@storybook/react';
import { Confirm, ConfirmProps } from './index';

export default {
  title: 'Components/Confirm',
  component: Confirm,
  args: {
    text: 'Confirm',
    title: 'Cadastrar Usuário',
    icon: 'pi pi-alert',
  },
} as Meta<ConfirmProps>;

export const Default: StoryObj = {};
