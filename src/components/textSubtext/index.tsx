import { clsx } from 'clsx';
import { COLOR_CLASSES, SIZE_CLASSES, TextSubtextProps } from './types';

export function TextSubtext({
  size = 'md',
  color = 'gray-dark',
  text,
  display = 'grid',
  subtext,
  icon,
  className,
}: TextSubtextProps) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const colorClass = COLOR_CLASSES[color] || COLOR_CLASSES['gray-dark'];

  return (
    <div
      className={clsx(
        'flex gap-4 font-normal tracking-wider text-start items-center text-ellipsis overflow-hidden whitespace-nowrap',
        sizeClass,
        colorClass,
        className
      )}
    >
      {icon && (
        <div className="flex items-center">
          <i className={icon}></i>
        </div>
      )}

      <span className={display}>
        {text}&nbsp;
        <strong className="font-inter">{subtext}</strong>
      </span>
    </div>
  );
}
