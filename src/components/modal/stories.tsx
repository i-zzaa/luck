import { Meta, StoryObj } from '@storybook/react';
import { Modal, ModalProps } from './index';

export default {
  title: 'Components/Modal',
  component: Modal,
  args: {
    children: 'Modal',
    typeButtonFooter: 'primary',
    textButtonFooter: 'Cadastrar',
    title: 'Cadastrar Usuário',
    open: false,
    onClick: () => {
      console.log(0);
    },
    onClose: () => {
      console.log(0);
    },
  },
} as Meta<ModalProps>;

export const Default: StoryObj = {};
