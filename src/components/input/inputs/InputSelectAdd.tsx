import { Controller } from 'react-hook-form';
import { SeletorBottomSheet } from '../../seletorBottomSheet';
import { ButtonHeron } from '../../button';
import { InputProps } from '../types';

export function InputSelectAdd({ id, labelText, value, options, disabled, validate, control, onChange, onClick, buttonAdd }: InputProps) {
  return (
    <div className="grid gap-2 grid-cols-6">
      <Controller
        name={id}
        control={control}
        rules={validate}
        render={({ field }: any) => (
          <div className="col-span-5">
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
          </div>
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