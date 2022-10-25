import { SelectButton } from 'primereact/selectbutton';
import { Text } from '../text';
import { Controller } from 'react-hook-form';

interface SelectButtonProps {
  id: string;
  title: string;
  options: any[];
  control: any;
}

export const SelectButtonComponent = ({
  title,
  options,
  control,
  id,
}: SelectButtonProps) => {
  return (
    <div>
      <div className="card">
        <Text size='sm' color="violet" text={title} />
        <Controller
            name={id}
            control={control}
            render={({ field }: any) => (
              <SelectButton value={field.value} options={options} onChange={field.onChange} optionLabel="nome" multiple />
            )}
          />
      </div>
    </div>
  );
}
            