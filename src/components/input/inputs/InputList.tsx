import { Controller } from 'react-hook-form';
import { InputProps } from '../types';
import { ListBox } from 'primereact/listbox';

export function InputList({ id, options, validate, control }: InputProps) {
  return (
    <Controller
      name={id}
      control={control}
      rules={validate}
      render={({ field }: any) => (
        <ListBox
          value={field.value}
          options={options}
          onChange={(e) => field.onChange(e.value)}
          multiple
          filter
          optionLabel="nome"
          listStyle={{ maxHeight: '300px' }}
        />
      )}
    />
  );
}