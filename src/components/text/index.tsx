import { clsx } from 'clsx';
import { COLOR_CLASSES, SIZE_CLASSES, TextProps } from './types';

export function Text({
  size = 'md',
  color = 'gray-dark',
  text,
  className,
}: TextProps) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const colorClass = COLOR_CLASSES[color] || COLOR_CLASSES['gray-dark'];

  return (
    <span
      className={clsx('font-normal tracking-wider', sizeClass, colorClass, className)}
    >
      {text}
    </span>
  );
}