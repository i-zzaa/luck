import { Controller } from 'react-hook-form';
import { Checkbox } from 'primereact/checkbox';
import { InputProps } from '../types';

export function InputCheckbox({ id, value, className, disabled, validate, control, onChange, labelText }: InputProps) {
  return (
    <Controller
      name={id}
      control={control}
      rules={validate}
      render={({ field }: any) => (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={value || field.value}
            onChange={(e: any) => {
              field.onChange(e.target.checked);
              onChange?.(e.target.checked);
            }}
            disabled={disabled}
            className={className}
          />
          <span className="text-violet-800">{labelText}</span>
        </div>
      )}
    />
  );
}