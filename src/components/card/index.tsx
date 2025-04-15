import clsx from 'clsx';
import { CardProps } from './types';
import { useBorderClass } from './useBorderClass';

export function Card({
  children,
  legend,
  type = 'DEFAULT',
  className,
  onClick,
}: CardProps) {
  const borderClass = useBorderClass(type);

  const fieldsetClass = clsx(
    'px-2 items-center bg-white shadow-sm mt-2',
    borderClass,
    className
  );

  return (
    <fieldset className={fieldsetClass} onClick={onClick}>
      {legend && <legend className="text-xs font-semibold">{legend}</legend>}
      <div className="py-4 w-full">{children}</div>
    </fieldset>
  );
}
