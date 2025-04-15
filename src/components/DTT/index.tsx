import { useState } from 'react';
import { MultiStateCheckbox } from 'primereact/multistatecheckbox';
import { CheckboxDTTProps, DTTENUM } from './types';
import { IconC, IconDT, IconDP, IconDG, IconDV } from './icons';

export default function CheckboxDTT({ value, onChange, disabled }: CheckboxDTTProps) {
  const [valueCurrent, setValue] = useState(value);

  const optionsCurrent = [
    { value: DTTENUM.c, icon: IconC },
    { value: DTTENUM.dt, icon: IconDT },
    { value: DTTENUM.dp, icon: IconDP },
    { value: DTTENUM.dg, icon: IconDG },
    { value: DTTENUM.dv, icon: IconDV },
  ];

  const iconTemplate = ({ option }: any) => option?.icon;

  return (
    <MultiStateCheckbox
      value={valueCurrent}
      options={optionsCurrent}
      onChange={(e) => {
        const selected = e.value;
        onChange(selected);
        setValue(selected);
      }}
      optionLabel="value"
      optionValue="value"
      iconTemplate={iconTemplate}
      className="w-8 h-8"
      disabled={disabled}
    />
  );
}