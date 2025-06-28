import { clsx } from 'clsx';
import { BASE_CLASS, bgClassMap, TagProps } from './types';

export function Tag({ onClick, type, disabled }: TagProps) {
  const typeKey = type.toUpperCase();
  const bgClass = bgClassMap[typeKey] || 'bg-gray-400';

  return (
    <button
      onClick={onClick}
      className={clsx(BASE_CLASS, bgClass, {
        'opacity-25 cursor-not-allowed': !disabled,
      })}
      disabled={!disabled}
    >
      {typeKey}
    </button>
  );
}