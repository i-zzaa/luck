export interface TextProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  text?: any;
  color?:
    | 'gray'
    | 'gray-dark'
    | 'gray-light'
    | 'yellow'
    | 'violet'
    | 'black'
    | 'white';
  className?: string;
}
import { clsx } from 'clsx';

export function Text({
  size = 'md',
  color = 'gray-dark',
  text,
  className,
}: TextProps) {
  return (
    <span
      className={clsx(
        'font-normal tracking-wider',
        {
          'text-xs': size === 'xs',
          'text-sm': size === 'sm',
          'text-md': size === 'md',
          'text-lg': size === 'lg',

          'text-white': color === 'white',
          'text-gray-300': color === 'gray-light',
          'text-gray-400': color === 'gray',
          'text-gray-800': color === 'gray-dark',
          'text-violet-800': color === 'violet',
          'text-yellow-400': color === 'yellow',
          'text-black': color === 'black',
        },
        className
      )}
    >
      {text}
    </span>
  );
}
