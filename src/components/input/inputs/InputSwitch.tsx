import { Controller } from 'react-hook-form';
import { InputSwitch } from 'primereact/inputswitch';
import { InputProps } from '../types';

export function InputSwitchField({ id, value, disabled, validate, control, onChange, labelText }: InputProps) {
  return (
    <Controller
      name={id}
      control={control}
      rules={validate}
      render={({ field }: any) => (
        <div className="grid grid-cols-6 justify-start items-center h-8">
          <span className="col-span-4 text-violet-800">{labelText}</span>
          <div className="col-span-2">
            <InputSwitch
              checked={value || field.value}
              onChange={(e: any) => {
                field.onChange(e.value);
                onChange?.(e.value);
              }}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    />
  );
}