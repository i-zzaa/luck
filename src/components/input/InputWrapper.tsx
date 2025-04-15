import { clsx } from 'clsx';
import { InputProps } from './types';

export function InputWrapper({
  id,
  labelText,
  type,
  errors,
  customCol,
  hidden,
  children,
}: InputProps) {
  return (
    <div
      className={clsx(
        'label-float',
        { 'my-5': !customCol, hidden: hidden && hidden },
        customCol
      )}
    >
      {children}
      {type !== 'switch' && type !== 'checkbox' && <label>{labelText}</label>}
      {errors?.[id] && (
        <p className="text-xs text-red-400 text-end">{errors[id].message}</p>
      )}
    </div>
  );
}