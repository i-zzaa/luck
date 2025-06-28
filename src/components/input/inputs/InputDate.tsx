import { Controller } from 'react-hook-form';
import { InputProps } from '../types';

export function InputDate({ id, value, disabled, validate, control, onChange }: InputProps) {
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
          type="date"
          className="inputAnimado"
          autoComplete="off"
          min={validate?.min}
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