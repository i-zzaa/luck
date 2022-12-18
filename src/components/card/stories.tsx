import { Meta, StoryObj } from '@storybook/react';
import { Card, CardProps } from './index';

export default {
  title: 'Components/Card',
  component: Card,
  args: {
    children: 'Card',
  },
} as Meta<CardProps>;

export const Default: StoryObj = {};
