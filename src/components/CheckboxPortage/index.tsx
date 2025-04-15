import { useState } from 'react';
import { MultiStateCheckbox } from 'primereact/multistatecheckbox';
import { CheckboxPortageProps } from './types';
import { IconSim, IconAsVezes, IconNao } from './icons';
import { VALOR_PORTAGE } from '../../constants/protocolo';

export default function CheckboxPortage({ value, onChange, disabled }: CheckboxPortageProps) {
  const [valueCurrent, setValue] = useState(value);

  const optionsCurrent = [
    { value: VALOR_PORTAGE.sim, icon: IconSim },
    { value: VALOR_PORTAGE.asVezes, icon: IconAsVezes },
    { value: VALOR_PORTAGE.nao, icon: IconNao },
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
