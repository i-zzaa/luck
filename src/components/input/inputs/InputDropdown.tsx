import { Controller } from 'react-hook-form';
import { Dropdown } from 'primereact/dropdown';
import { InputProps } from '../types';

export function InputDropdown({ id, value, options, disabled, validate, control, onChange }: InputProps) {
  return (
    <Controller
      name={id}
      control={control}
      rules={validate}
      render={({ field }: any) => (
        <Dropdown
          value={value || field.value}
          virtualScrollerOptions={{ itemSize: 38 }}
          options={options}
          onChange={(e: any) => {
            onChange?.(e.value);
            field.onChange(e.value);
          }}
          optionLabel="nome"
          filter
          showClear
          filterBy="nome"
          disabled={disabled}
        />
      )}
    />
  );
}
