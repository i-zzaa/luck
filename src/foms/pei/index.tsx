import { useEffect } from 'react';
import clsx from 'clsx';
import { Fieldset } from 'primereact/fieldset';
import { Input, ButtonHeron } from '../../components';
import { PEICadastroFields } from '../../constants/formFields';
import { STATUS_META_OPTIONS, TIPO_PROTOCOLO } from '../../constants/protocolo';
import { usePeiForm } from './usePeiForm';
import { useIsTabRoute } from '../../components/Nav/useIsTabRoute';
import { ABOVE_TAB_BAR } from '../../components/Nav/bottomTabBarLayout';
import { metaObsFieldId, metaStatusFieldId } from './metaStatusFields';

export default function PEICADASTRO({ paciente, param }: { paciente: { id: number; nome: string }; param?: any}) {
  const isTabRoute = useIsTabRoute();
  const {
    control,
    errors,
    handleSubmit,
    loading,
    metas,
    dropDownList,
    tipoProtocolo,
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
    <div className="mt-8 space-y-6 pb-24">
      {/* <div className='h-[90vh] flex flex-col overflow-y-auto'> */}
      <div className='flex flex-col overflow-y-auto'>
        {PEICadastroFields.map((item: any) => (
          <div key={item.id}>
          <Input
              labelText={item.labelText}
              id={item.id}
              type={item.type}
              customCol={item.customCol}
              control={control}
              options={item.type === 'select' ? dropDownList[item.name] : undefined}
              buttonAdd={item.buttonAdd}
              disabled={tipoProtocolo !== TIPO_PROTOCOLO.pei && item.name === 'programa'}
            />
          </div>
        ))}

        <div className='mt-8'>
          <div className="text-gray-400 font-inter flex justify-between m-2 leading-4">
            <span className="font-bold">METAS</span>
            {tipoProtocolo === TIPO_PROTOCOLO.pei ? (
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
                disabled={tipoProtocolo !== TIPO_PROTOCOLO.pei}
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

              {/* Status/observação — só no nível da meta (não por
                  subitem) e só no Manual, que é o único protocolo com
                  essa lista de metas em texto livre (Portage/VB-MAPP
                  reaproveitam essa mesma tela, mas reportam resultado
                  por tabela/grade, não por meta). Ambos opcionais — ver
                  metaStatusFields.ts e a exclusão correspondente na
                  validação de onSubmit. */}
              {tipoProtocolo === TIPO_PROTOCOLO.pei && (
                <>
                  <Input
                    labelText="Status da meta"
                    id={metaStatusFieldId(item.id)}
                    type="select"
                    customCol="col-span-6 sm:col-span-6"
                    control={control}
                    options={STATUS_META_OPTIONS}
                  />
                  <Input
                    labelText="Observação"
                    id={metaObsFieldId(item.id)}
                    type="textarea"
                    customCol="col-span-6 sm:col-span-6"
                    control={control}
                  />
                </>
              )}
            </Fieldset>
          ))}
        </div>

      </div>
      <div
        className={clsx(
          'fixed inset-x-0 z-10 px-4 pt-3 bg-background border-t border-gray-300 pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
          // acima da tab bar flutuante quando ela está visível na mesma
          // tela (rota /protocolo-av) — ver Nav/bottomTabBarLayout.ts
          isTabRoute ? ABOVE_TAB_BAR : 'bottom-0'
        )}
      >
        <ButtonHeron
          text="Salvar"
          type="primary"
          size="full"
          typeButton="button"
          onClick={handleSubmit(onSubmit)}
          loading={loading}
        />
      </div>
    </div>
  );
}
