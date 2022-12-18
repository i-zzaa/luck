import { Meta, StoryObj } from '@storybook/react';
import { Tag, TagProps } from './index';

export default {
  title: 'Components/Tag',
  component: Tag,
  args: {
    type: 'to',
    disabled: false,
  },
} as Meta<TagProps>;

export const TO: StoryObj<TagProps> = {};

export const FONO: StoryObj<TagProps> = {
  args: {
    type: 'fono',
    disabled: false,
  },
};

export const PSICO: StoryObj<TagProps> = {
  args: {
    type: 'psico',
    disabled: false,
  },
};

export const PSICOPEDAG: StoryObj<TagProps> = {
  args: {
    type: 'PsicoPEDAG',
    disabled: false,
  },
};
