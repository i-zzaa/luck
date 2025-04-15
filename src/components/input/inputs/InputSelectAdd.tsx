import { Controller } from 'react-hook-form';
import { Dropdown } from 'primereact/dropdown';
import { ButtonHeron } from '../../button';
import { InputProps } from '../types';

export function InputSelectAdd({ id, value, options, disabled, validate, control, onChange, onClick, buttonAdd }: InputProps) {
  return (
    <div className="grid gap-2 grid-cols-6">
      <Controller
        name={id}
        control={control}
        rules={validate}
        render={({ field }: any) => (
          <Dropdown
            className="col-span-5"
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
      {buttonAdd ? (
        <ButtonHeron
          text="Add"
          icon="pi pi-plus"
          type="primary"
          size="icon"
          onClick={() => onClick?.('add')}
          typeButton="button"
          disabled={disabled}
        />
      ) : (
        !disabled && (
          <ButtonHeron
            text="Remove"
            icon="pi pi-trash"
            type="transparent"
            color="red"
            size="icon"
            onClick={() => onClick?.('remove')}
            typeButton="button"
          />
        )
      )}
    </div>
  );
}