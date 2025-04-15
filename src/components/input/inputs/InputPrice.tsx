import { Controller } from 'react-hook-form';
import { InputNumber } from 'primereact/inputnumber';
import { InputProps } from '../types';

export function InputPrice({ id, value, disabled, validate, control, onChange }: InputProps) {
  return (
    <Controller
      name={id}
      control={control}
      rules={validate}
      render={({ field }: any) => (
        <div className="inputAnimado font-inter" id={field.id}>
          <div className="p-inputgroup">
            <InputNumber
              value={value || field.value}
              disabled={disabled}
              onInput={(e: any) => {
                field.onChange(e);
                onChange?.(e);
              }}
            />
            <span className="p-inputgroup-addon">R$</span>
          </div>
        </div>
      )}
    />
  );
}