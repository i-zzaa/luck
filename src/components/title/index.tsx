import { clsx } from 'clsx';
import { COLOR_CLASSES, SIZE_CLASSES, TitleProps } from './types';

export function Title({
  size = 'md',
  color = 'gray-dark',
  children,
}: TitleProps) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const colorClass = COLOR_CLASSES[color] || COLOR_CLASSES['gray-dark'];

  return <span className={clsx('font-bold', sizeClass, colorClass)}>{children}</span>;
}