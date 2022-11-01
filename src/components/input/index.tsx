import { Controller } from "react-hook-form";

import { MultiSelect } from "primereact/multiselect";
import { InputMask } from "primereact/inputmask";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Checkbox } from 'primereact/checkbox';
import { ListBox } from "primereact/listbox";

import { colorsData, colorsTextData, setColorChips } from "../../util/util";
import { clsx } from 'clsx';

export interface InputProps {
  id: string;
  type: string;
  labelText: string;
  value?: any;
  options?: any;
  customClass?: string;
  customCol?: string;
  disabled?: boolean;
  onChange?: (value: any) => void;
  validate?: any;
  errors?: any;
  hidden?: any;
  control?: any;
}

export interface OptionsProps  {
  nome: string;
  value: string | number;
}

export function Input({ 
  onChange,
  value,
  labelText,
  id,
  type,
  customClass,
  options,
  customCol,
  validate,
  errors,
  control,
  disabled,
  hidden
}: InputProps) {

  const renderType = () => {
    switch (type) {
      case "select":
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <Dropdown
                value={value || field.value}
                options={options}
                onChange={(e: any) => {
                  onChange && onChange(e.value)
                  return field.onChange(e.value)
                }}
                optionLabel="nome"
                filter
                showClear
                filterBy="nome"
              />
            )}
          />
        );
      case "multiselect":
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <MultiSelect
                id={field.id}
                display="chip"
                optionLabel="nome"
                filter
                value={value || field.value}
                onChange={(e: any) => {
                  setColorChips();
                  return field.onChange(e.value);
                }}
                options={options}
              />
            )}
          />
        );
      case "list":
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
                listStyle={{ maxHeight: "300px" }}
              />
            )}
          />
        );
      case "textarea":
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <textarea
                id={field.id}
                {...field}
                value={value || field.value}
                className={customClass}
                placeholder={field.placeholder}
              />
            )}
          />
        );
      case "switch":
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => {
              return (
                <div className="grid grid-cols-6 justify-start items-center h-8">
                  <span className="col-span-4 text-violet-800">
                    {" "}
                    {labelText}{" "}
                  </span>
                  <div className="col-span-2">
                    <InputSwitch
                      checked={field.value}
                      onChange={field.onChange}
                      color="#685ec5"
                      value={value}
                      disabled={disabled}
                    />
                  </div>
                </div>
              );
            }}
          />
        );
      case "tel":
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <InputMask
                value={value || field.value}
                key={field.id}
                type={type}
                className={"inputAnimado font-sans-serif" + customClass}
                mask="(99) 9999-9999"
                onChange={(e: any) => {
                  return field.onChange(e.value);
                }}
              />
            )}
          />
        );
      case "checkbox":
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <>
                <Checkbox
                  checked={value}
                  type={type}
                  className={"inputAnimado " + customClass}
                  onChange={ (e: any) =>{
                    field.onChange(e.target.checked)
                    onChange && onChange(e.target.checked)
                  }}
                />
                <span className="col-span-4 text-violet-800">
                {" "}
                {labelText}{" "}
              </span>
            </>
            )}
          />
        );
      case "time":
        return (
          <Controller
          name={id}
          control={control}
          rules={validate}
          render={({ field }: any) => (
            <input
              id={field.id}
              {...field}
              value={value || field.value}
              key={field.id}
              type={type}
              className={"inputAnimado font-sans-serif "  + customClass}
              onInput={(e: any)=> {
                field.onChange(e)
                onChange && onChange(e)
              }}
            />
          )}
        />
      );
        default:
          return (
            <Controller
              name={id}
              control={control}
              rules={validate}
              render={({ field }: any) => (
                <input
                  id={field.id}
                  {...field}
                  value={value || field.value}
                  key={field.id}
                  type={type}
                  className={"inputAnimado "  + customClass}
                  autoComplete="off"
                  onInput={(e: any)=> {
                    field.onChange(e)
                    onChange && onChange(e)
                  }}
                />
              )}
            />
          );
    }
  };

  return (
    <div className={clsx('label-float', {'my-5': !customCol, "hidden": hidden && hidden}, customCol)} >
      {renderType()}
      {type !== "switch" && type !== "checkbox" && <label> {labelText} </label>}
      {errors && errors[id] && (
        <p className="text-xs text-red-400 text-end">{errors[id].message}</p>
      )}
    </div>
  );
}