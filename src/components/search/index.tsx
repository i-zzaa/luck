export interface SearchProps {
  onSubmit?: () => void;
  control: any;
  loading: boolean;
}
import { ButtonHeron } from '../button';
import { Input } from '../input';

export function Search({ onSubmit, control, loading}: SearchProps) {
  return (
    <div className="grid grid-cols-12 items-center gap-1">
        <Input
          labelText="Search"
          id="search"
          type="text"
          customCol="col-span-11"
          control={control}
        />

        <div className="mt-4">
          <ButtonHeron 
            text="Buscar"
            icon="pi pi-search"
            type="primary"
            size="icon"
            onClick={onSubmit}
            loading={loading}
          />
        </div>
    </div>
  );
}