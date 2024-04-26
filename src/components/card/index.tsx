import clsx from 'clsx';
import { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  legend?: string;
  type?: string;
  customCss?: string;
  onClick?: () => void;
}

export function Card({ children, legend, customCss, onClick, type='default' }: CardProps) {
  return (
    // <fieldset className="py-8 px-8 items-center bg-white rounded-lg border border-gray-200 shadow-md mt-10 ">
    <fieldset className={ clsx( 'px-2 items-center bg-white   shadow-sm mt-2',customCss,  {
      'border-to': type.toUpperCase() === 'TO',
      'border-fono': type.toUpperCase() === 'FONO',
      'border-psico': type.toUpperCase() === 'PSICO',
      'border-black': type.toUpperCase() === 'PSICOPEDAG',
      'border-motricidade': type.toUpperCase() === 'MOTRICIDADE',
      'border-musicoterapia': type.toUpperCase() === 'MUSICOTERAPIA',
      'border-white': type.toUpperCase() === 'DEFAULT',
    })} onClick={onClick}>
      {/* <div className="py-4 sm:flex justify-between  place-content-around gap-4 sm:gap-8 items-center"> */}
      <div className="py-4 w-full ">{children}</div>
    </fieldset>
  );
}
