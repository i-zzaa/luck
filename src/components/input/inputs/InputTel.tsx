import { Controller } from 'react-hook-form';
import { InputMask } from 'primereact/inputmask';
import { InputProps } from '../types';

export function InputTel({ id, value, className, disabled, validate, control, onChange }: InputProps) {
  return (
    <Controller
      name={id}
      control={control}
      rules={validate}
      render={({ field }: any) => (
        <InputMask
          value={value || field.value}
          key={field.id}
          type="tel"
          className={`inputAnimado font-inter font-light ${className}`}
          mask="(99) 9999-9999"
          disabled={disabled}
          onChange={(e: any) => {
            field.onChange(e.value);
            onChange?.(e.value);
          }}
        />
      )}
    />
  );
}