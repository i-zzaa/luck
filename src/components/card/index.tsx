import { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  legend?: string;
}

export function Card({ children, legend}: CardProps) {
  return (
    <fieldset className="py-8 px-8 items-center bg-white rounded-lg border border-gray-200 shadow-md mt-10 ">
      <div className="py-4 sm:flex justify-between  place-content-around gap-4 sm:gap-8 items-center">
        { children }
      </div>
    </fieldset>
  )
}