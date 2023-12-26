import { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  legend?: string;
  customCss?: string;
  onClick?: () => void;
}

export function Card({ children, legend, customCss, onClick }: CardProps) {
  return (
    // <fieldset className="py-8 px-8 items-center bg-white rounded-lg border border-gray-200 shadow-md mt-10 ">
    <fieldset className={`px-2 items-center bg-white   shadow-sm mt-2 ${customCss}`} onClick={onClick}>
      {/* <div className="py-4 sm:flex justify-between  place-content-around gap-4 sm:gap-8 items-center"> */}
      <div className="py-4 w-full ">{children}</div>
    </fieldset>
  );
}
