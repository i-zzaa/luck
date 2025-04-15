import clsx from 'clsx';
import { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  legend?: string;
  type?: string;
  className?: string;
  onClick?: () => void;
}

const borderClasses: Record<string, string> = {
  TO: 'border-to',
  FONO: 'border-fono',
  PSICO: 'border-psico',
  PSICOPEDAG: 'border-black',
  MOTRICIDADE: 'border-motricidade',
  MUSICOTERAPIA: 'border-musicoterapia',
  DEFAULT: 'border-white',
};

export function Card({
  children,
  legend,
  type = 'DEFAULT',
  className,
  onClick,
}: CardProps) {
  const borderClass = borderClasses[type.toUpperCase()] || borderClasses.DEFAULT;

  const fieldsetClass = clsx(
    'px-2 items-center bg-white shadow-sm mt-2',
    borderClass,
    className
  );

  return (
    <fieldset className={fieldsetClass} onClick={onClick}>
      <div className="py-4 w-full">{children}</div>
    </fieldset>
  );
}
