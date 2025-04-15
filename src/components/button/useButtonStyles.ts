import { clsx } from 'clsx';
import { ButtonProps } from './types';

export function useButtonStyles(type: ButtonProps['type'] = 'primary', color: ButtonProps['color'] = 'white', size: ButtonProps['size'] = 'full') {
  const typeClasses = {
    primary: 'bg-violet-800 hover:bg-violet-600',
    second: 'bg-yellow-400 hover:bg-violet-800',
    transparent: 'bg-transparent hover:bg-transparent',
  };

  const colorClasses = {
    white: 'text-white',
    red: 'text-red-400 hover:text-violet-800 focus:text-violet-600',
    green: 'text-green-400 hover:text-violet-800 focus:text-violet-600',
    yellow: 'text-yellow-400 hover:text-violet-800 focus:text-violet-600',
    violet: 'text-violet-800 hover:text-violet-600 focus:text-violet-600',
  };

  const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
    full: 'w-full',
    sm: '',
    icon: '',
    link: '',
    md: 'sm:w-2/5 w-full',
  };

  const buttonClass = clsx(
    'text-sm rounded-md border-none',
    typeClasses[type],
    colorClasses[color],
    sizeClasses[size]
  );

  return buttonClass;
}
