import { Card } from "../../components/card";
import { Input } from "../../components/input";
import { ButtonHeron } from "../../components/button";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

export interface FilterProps {
  id: string;
  legend?: string;
  nameButton?: string;
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
  nameButton,
  dropdown,
  onSubmit,
  onInclude,
  onReset,
}: FilterProps) {
  const { setValue, handleSubmit, control, reset } = useForm();

  const handleReset = () => {
    reset();
    onReset();
  }

  const handleSubmit2 = (formState: any) => {
    if (formState.devolutiva) {
      setValue("naFila", true);
      formState.naFila = true;
    }
    onSubmit(formState);
  };

  useEffect(()=> {
    if (rule) {
      setValue("naFila", true);
    }
  })

  return (
    <Card legend={legend}>
      <form id={id}  action="#"  onSubmit={handleSubmit(handleSubmit2)} className="flex-1">
        <div className="grid grid-cols-6 gap-4">
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
              hidden={field.hidden && rule}
            />
          ))}
        </div>

        <div className="flex items-center mt-10 gap-2 justify-between">    
          {!rule && (<div className='sm:text-end'>
            <ButtonHeron 
              text={nameButton || "Cadastrar"}
              icon="pi pi-user-plus"
              type="primary"
              size="sm"
              onClick={onInclude}
            />
          </div>)}
          <div className="hidden sm:w-2/4 ml-auto sm:grid grid-cols-2 gap-2">
            <div className='text-end'>
              <ButtonHeron 
                text="Limpar"
                icon="pi pi-filter-slash"
                type="second"
                size="full"
                onClick={handleReset}
              />
            </div>
            <div className='text-end'>
              <ButtonHeron 
                text="Pesquisar"
                icon="pi pi-filter"
                type="primary"
                size="full"
                loading={loading}
                onClick={()=> handleSubmit(handleSubmit2)}
              />
            </div>
          </div>
          <div className="sm:w-2/4 ml-auto grid sm:hidden grid-cols-2 gap-2">
            <div className='text-end'>
              <ButtonHeron 
                text="Limpar"
                icon="pi pi-filter-slash"
                type="second"
                size="icon"
                onClick={handleReset}
              />
            </div>
            <div className='text-end'>
              <ButtonHeron 
                text="Pesquisar"
                icon="pi pi-filter"
                type="primary"
                size="icon"
                loading={loading}
                onClick={()=> handleSubmit(handleSubmit2)}
              />
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
}