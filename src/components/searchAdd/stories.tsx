import { Meta, StoryObj } from '@storybook/react';
import { SearchAdd, SearchAddProps } from './index';

export default {
  title: 'Components/SearchAdd',
  component: SearchAdd,
  args: {
    textButton: '',
    iconButton: 'pi pi-user-plus',
  },
} as Meta<SearchAddProps>;

export const Default: StoryObj<SearchAddProps> = {};
