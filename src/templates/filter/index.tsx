import { Card } from "../../components/card";
import { Input } from "../../components/input";
import { ButtonHeron } from "../../components/button";
import { useForm } from "react-hook-form";

export interface FilterProps {
  id: string;
  legend?: string;
  fields: any;
  dropdown: any;
  rule: boolean;
  loading: boolean;
  onSubmit: (formState: any) => any; 
  onInclude: () => any; 
  onReset: () => any;
}

export function Filter({ 
  id,
  legend,
  fields,
  rule,
  loading,
  dropdown,
  onSubmit,
  onInclude,
  onReset,
}: FilterProps) {
  const {  handleSubmit, control, reset } = useForm();

  const handleReset = () => {
    reset();
    onReset();
  }

  return (
    <Card legend={legend}>
      <form id={id}  action="#"  onSubmit={handleSubmit(onSubmit)} className="flex-1">
        <div className="grid grid-cols-2 gap-4">
          {fields.map((field: any) => (
            <Input
              key={field.id}
              labelText={field.labelText}
              id={field.id}
              type={field.type}
              customCol={field.customCol}
              control={control}
              disabled={rule && field.id === "naFila"}
              options={field.type === "select" ? dropdown[field.name] : undefined}
            />
          ))}
        </div>

        <div className="flex items-center mt-10 gap-2 justify-between">    
          <div className='sm:text-end'>
            <ButtonHeron 
              text="Cadastrar"
              icon="pi pi-user-plus"
              type="primary"
              size="sm"
              onClick={onInclude}
            />
          </div>
          <div className="sm:w-2/4 ml-auto grid grid-cols-2 gap-2">
            <div className='text-end'>
              <ButtonHeron 
                text="Limpar"
                icon="pi pi-filter-slash"
                type="second"
                size="md"
                onClick={handleReset}
              />
            </div>
            <div className='text-end'>
              <ButtonHeron 
                text="Pesquisar"
                icon="pi pi-filter"
                type="primary"
                size="md"
                loading={loading}
                onClick={()=> handleSubmit(onSubmit)}
              />
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
}