import { Controller } from 'react-hook-form';
import { MultiSelect } from 'primereact/multiselect';
import { setColorChips } from '../../../util/util';
import { InputProps } from '../types';

export function InputMultiSelect({ id, value, options, disabled, validate, control, onChange }: InputProps) {
  return (
    <Controller
      name={id}
      control={control}
      rules={validate}
      render={({ field }: any) => (
        <MultiSelect
          disabled={disabled}
          id={field.id}
          display="chip"
          optionLabel="nome"
          filter
          value={value || field.value}
          onChange={(e: any) => {
            setColorChips();
            onChange?.(e.value);
            field.onChange(e.value);
          }}
          options={options}
        />
      )}
    />
  );
}