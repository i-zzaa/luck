import { clsx } from 'clsx';
import { BASE_CLASS, bgClassMap, TagProps } from './types';
import { resolveEspecialidadeCodigo } from '../../util/especialidade';

export function Tag({ onClick, type, disabled }: TagProps) {
  const codigo = resolveEspecialidadeCodigo(type);
  const bgClass = codigo ? bgClassMap[codigo] : 'bg-gray-400';

  return (
    <button
      onClick={onClick}
      className={clsx(BASE_CLASS, bgClass, {
        'opacity-25 cursor-not-allowed': disabled,
      })}
      disabled={disabled}
    >
      {codigo ?? type.toUpperCase()}
    </button>
  );
}
