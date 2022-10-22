export interface TagProps {
  onClick?: () => void;
  type: 'to' | 'fono' | 'psico' | 'PsicoPEDAG';
  disabled: boolean;
}
import { clsx } from 'clsx';

const CLASSFIX = "text-sm items-center flex text-white py-2 px-6 rounded-full cursor-not-allowed cursor-pointer opacity-25 disabled:opacity-100 ";

export function Tag({ onClick, type, disabled}: TagProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(CLASSFIX, {
        'bg-to': type.toUpperCase() === 'TO',
        'bg-fono': type.toUpperCase() === 'FONO',
        'bg-psico': type.toUpperCase() === 'PSICO',
        'bg-black': type.toUpperCase() === 'PSICOPEDAG',
      })}
      disabled={!disabled}
    >
      {type.toUpperCase()}
    </button>
  );
}