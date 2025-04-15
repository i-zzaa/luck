import { Controller } from 'react-hook-form';
import { InputProps } from '../types';

export function InputPassword({ id, value, disabled, validate, control, onChange, className }: InputProps) {
  return (
    <Controller
      name={id}
      control={control}
      rules={validate}
      render={({ field }: any) => (
        <input
          {...field}
          id={field.id}
          value={value || field.value}
          type="password"
          className={`inputAnimado ${className}`}
          autoComplete="off"
          disabled={disabled}
          onInput={(e: any) => {
            field.onChange(e);
            onChange?.(e);
          }}
        />
      )}
    />
  );
}