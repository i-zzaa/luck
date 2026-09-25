import { Controller } from 'react-hook-form';
import { SeletorBottomSheet } from '../../seletorBottomSheet';
import { InputProps } from '../types';

// Seleção múltipla em bottom sheet (ver components/seletorBottomSheet); os
// chips continuam com a cor da especialidade.
export function InputMultiSelect({ id, labelText, value, options, disabled, validate, control, onChange }: InputProps) {
  return (
    <Controller
      name={id}
      control={control}
      rules={validate}
      render={({ field }: any) => (
        <SeletorBottomSheet
          id={id}
          titulo={labelText}
          multiple
          value={value || field.value}
          options={options}
          onChange={(valor) => {
            onChange?.(valor);
            field.onChange(valor);
          }}
          disabled={disabled}
        />
      )}
    />
  );
}
