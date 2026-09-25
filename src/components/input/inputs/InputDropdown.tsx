import { Controller } from 'react-hook-form';
import { SeletorBottomSheet } from '../../seletorBottomSheet';
import { InputProps } from '../types';

// Seleção em bottom sheet (ver components/seletorBottomSheet) no lugar do
// Dropdown do PrimeReact: no celular a lista abria colada no campo e ficava
// atrás do teclado ao buscar.
export function InputDropdown({ id, labelText, value, options, disabled, validate, control, onChange }: InputProps) {
  return (
    <Controller
      name={id}
      control={control}
      rules={validate}
      render={({ field }: any) => (
        <SeletorBottomSheet
          id={id}
          titulo={labelText}
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
