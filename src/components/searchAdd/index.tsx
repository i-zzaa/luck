export interface SearchAddProps {
  onClick?: () => void;
  onSubmit: () => any;
  textButton: string;
  iconButton: string;
  control: any;
  loading?: boolean;
}
import { ButtonHeron } from '../button';
import { Search } from "../search";

export function SearchAdd({ onClick, onSubmit,  textButton, iconButton, control, loading}: SearchAddProps) {

  return (
    <div className="grid grid-cols-8 gap-2 justify-between">
      <form action="#" onSubmit={onSubmit} className="col-span-8 sm:col-span-7">
        <Search onSubmit={onSubmit} control={control} loading={!!loading}/>
      </form>

      <div className="col-span-8 sm:col-span-1">
        <div className='sm:hidden '>
          <ButtonHeron 
            text={textButton}
            icon={iconButton}
            type="primary"
            size="full"
            onClick={onClick}
            />
        </div>

        <div className='hidden sm:block mt-5 text-end'>
          <ButtonHeron 
            text={textButton}
            icon={iconButton}
            type="primary"
            size="icon"
            onClick={onClick}
            />
        </div>
      </div>
    </div>
  );
}