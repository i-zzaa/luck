export interface TitleProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  children: string;
  color?:
    | 'gray'
    | 'gray-dark'
    | 'gray-light'
    | 'yellow'
    | 'violet'
    | 'black'
    | 'white';
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
  black: 'text-black',
};