import { useEffect } from 'react';
import { Fieldset } from 'primereact';
import { Input, ButtonHeron } from '../../components';
import { PEICadastroFields } from '../../constants/formFields';
import { TIPO_PROTOCOLO } from '../../constants/protocolo';
import { usePeiForm } from './usePeiForm';

export default function PEICADASTRO({ paciente, param }: { paciente: { id: number; nome: string }; param?: any }) {
  const {
    control,
    errors,
    handleSubmit,
    loading,
    metas,
    dropDownList,
    state,
    addMeta,
    addSubitem,
    removeMeta,
    renderDropdown,
    onSubmit,
    hasPermition,
    removeSubitemFromMeta,
  } = usePeiForm({ paciente, param });

  useEffect(() => {
    renderDropdown();
  }, [renderDropdown]);

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className='h-[90vh] flex flex-col overflow-y-auto'>
        {PEICadastroFields.map((item: any) => (
          <div key={item.id}>
            {hasPermition(item.permission) ? (
              <Input
                labelText={item.labelText}
                id={item.id}
                type={item.type}
                customCol={item.customCol}
                control={control}
                options={item.type === 'select' ? dropDownList[item.name] : undefined}
                buttonAdd={item.buttonAdd}
              />
            ): null}
          </div>
        ))}

        <div className='mt-8'>
          <div className="text-gray-400 font-inter flex justify-between m-2 leading-4">
            <span className="font-bold">METAS</span>
            {!state?.tipoProtocolo || state?.tipoProtocolo === TIPO_PROTOCOLO.pei ? (
              <ButtonHeron
                text="Add Meta"
                icon="pi pi-plus"
                type="primary"
                size="sm"
                onClick={addMeta}
                typeButton="button"
              />
            ) : null}
          </div>

          {metas.map((item: any, key: number) => (
            <Fieldset key={item.id} legend={`${item.labelText} ${key + 1}`} className='mb-2' toggleable>
              <div className="text-gray-400 font-inter flex justify-end">
                <ButtonHeron
                  text="Add subitem"
                  icon="pi pi-plus"
                  type="primary"
                  size="sm"
                  onClick={() => addSubitem(key)}
                  typeButton="button"
                />
              </div>

              <Input
                labelText="Descrição"
                id={item.id}
                type="input-add"
                customCol="col-span-6 sm:col-span-6"
                control={control}
                onClick={() => removeMeta(key)}
                disabled={state?.tipoProtocolo !== TIPO_PROTOCOLO.pei}
              />

              {item?.subitems?.map((subitem: any, index: number) => (
                <Input
                  key={subitem.id}
                  labelText={`Item ${index + 1}`}
                  id={subitem.id}
                  type="input-add"
                  customCol="col-span-6 sm:col-span-6"
                  control={control}
                  onClick={() => removeSubitemFromMeta(key, index)}
                />
              ))}
            </Fieldset>
          ))}
        </div>

        <div className='mt-auto'>
          <ButtonHeron
            text="Salvar"
            type="primary"
            size="full"
            onClick={handleSubmit(onSubmit)}
            loading={loading}
          />
        </div>
      </div>
    </form>
  );
}
