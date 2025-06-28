import clsx from 'clsx';
import { CardProps } from './types';
import { useBorderColorClass } from './useBorderClass';

export function Card({
  children,
  type = 'DEFAULT',
  className,
  onClick,
}: CardProps) {
  const borderClass = useBorderColorClass(type.toLocaleUpperCase());

  const fieldsetClass = clsx(
    'px-2 bg-white shadow-sm mt-2',
    borderClass,
    className
  );

  return (
    <fieldset className={fieldsetClass} onClick={onClick}>
      <div className="py-4 w-full">{children}</div>
    </fieldset>
  );
}
