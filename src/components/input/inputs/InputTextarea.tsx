import { Controller } from 'react-hook-form';
import { InputProps } from '../types';

export function InputTextarea({ id, value, className, disabled, validate, control, onChange }: InputProps) {
  return (
    <Controller
      name={id}
      control={control}
      rules={validate}
      render={({ field }: any) => (
        <textarea
          {...field}
          id={field.id}
          value={value || field.value}
          style={{ minHeight: '7rem'}}
          className={className}
          disabled={disabled}
          rows={8}
          onChange={(e) => {
            field.onChange(e.target.value);
            onChange?.(e.target.value);
          }}
        />
      )}
    />
  );
}