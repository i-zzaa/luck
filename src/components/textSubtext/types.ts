import { ReactNode } from 'react';

export interface TextSubtextProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  text?: string;
  subtext?: ReactNode;
  color?:
    | 'gray'
    | 'gray-dark'
    | 'gray-light'
    | 'yellow'
    | 'violet'
    | 'black'
    | 'white'
    | 'red';
  display: 'flex' | 'grid';
  icon?: string;
  className?: string;
}

export const SIZE_CLASSES = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-md',
  lg: 'text-lg',
};

export const COLOR_CLASSES = {
  white: 'text-white',
  'gray-light': 'text-gray-300',
  gray: 'text-gray-400',
  'gray-dark': 'text-gray-800',
  violet: 'text-violet-800',
  yellow: 'text-yellow-400',
  red: 'text-red-900',
  black: 'text-black',
};