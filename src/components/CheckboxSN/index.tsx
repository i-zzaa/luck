import { useState } from 'react';
import { MultiStateCheckbox } from 'primereact/multistatecheckbox';
import { CheckboxSNProps } from './types';
import { IconYes, IconNo } from './icons';

export default function CheckboxSN({ value, onChange, disabled }: CheckboxSNProps) {
  const [valueCurrent, setValue] = useState(value);

  const optionsCurrent = [
    { value: 'S', icon: IconYes },
    { value: 'N', icon: IconNo },
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