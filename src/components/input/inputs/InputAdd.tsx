import { Controller } from 'react-hook-form';
import { ButtonHeron } from '../../button';
import { InputProps } from '../types';

export function InputAdd({ id, value, disabled, validate, control, onChange, onClick, buttonAdd }: InputProps) {
  return (
    <div className="grid gap-2 grid-cols-6">
      <Controller
        name={id}
        control={control}
        rules={validate}
        render={({ field }: any) => (
          <textarea
            {...field}
            id={field.id}
            value={value || field.value}
            className="inputAnimado col-span-5"
            autoComplete="off"
            disabled={disabled}
            rows={2}
            onInput={(e: any) => {
              field.onChange(e);
              onChange?.(e);
            }}
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
          />
        )
      )}
    </div>
  );
}