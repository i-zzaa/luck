import { useCallback, useEffect, useMemo, useState } from 'react';

import { useForm } from 'react-hook-form';
import { ButtonHeron, Input } from '../components/index';
import { PEICadastroFields } from '../constants/formFields';
import { useToast } from '../contexts/toast';
import { create, dropDown, update } from '../server';
import { permissionAuth } from '../contexts/permission';
import { Divider, Fieldset } from 'primereact';
import { useLocation, useNavigate } from 'react-router-dom';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';

const fields = PEICadastroFields;
const fieldsState: any = {};
fields.forEach((field: any) => (fieldsState[field.id] = ''));


interface FormProps {
  pacienteId: any,
  procedimentoEnsinoId: string | number,
  programaId: string,
  estimuloDiscriminativo: string,
  resposta: string,
  estimuloReforcadorPositivo: string,
}

export default function PEICADASTRO() {
  const defaultValues = {
    pacienteId: '',
    procedimentoEnsinoId: '',
    programaId: '',
    estimuloDiscriminativo: '',
    resposta: '',
    estimuloReforcadorPositivo: '',
  };

  const METAS = {
    labelText: 'Meta',
    labelFor: 'meta',
    id: 'meta-0',
    name: 'meta',
    type: 'input-add',
    customCol: 'col-span-5 sm:col-span-5',
    buttonAdd: true,
    subitems: []
  }

  const SUBITEM = {
    labelText: 'Item',
    labelFor: 'item',
    id: 'item-0',
    name: 'item',
    type: 'input-add',
    customCol: 'col-span-5 sm:col-span-5',
    buttonAdd: true,
  }

  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>([]);
  const [metas, setMetas]= useState<any>([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { renderToast } = useToast();
  const { hasPermition } = permissionAuth();

  const { state } = location;

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    reset,
    watch
  } = useForm<FormProps>({ defaultValues });

  const renderDropdown = useCallback(async () => {
    const [paciente, programa, procedimentoEnsino]: any = await Promise.all([
      dropDown('paciente'),
      dropDown('programa'),
      dropDown('pei/procedimento-ensino'),
    ])

    setDropDownList({
      paciente,
      programa,
      procedimentoEnsino
    })
  }, []);
  
  const onSubmit = async (formvalue: any) => {
    setLoading(true);
    try {

    const payload: any = {
      metas: []
    }

     Object.keys(formvalue).map((key: any, index) => {
      if (key.includes('-meta-') && !key.includes(`-sub-item-`)) {
        const match =  key.match(/\d+/);
        const matchLast = key.match(/(\d+)$/);

        const programaId = Number(match[0]);
        const metaId = Number(matchLast[0]);

        const subitems : any=  []
        
        Object.keys(formvalue).map((sub, subIndex) => {
          if (sub.includes(`${programaId}-meta-${metaId}-sub-item-`)) {
            subitems.push({
              ...SUBITEM,
              id:  sub,
              value: formvalue[sub],
            })
          }
        })

        payload.metas.push({
          ...METAS,
          id: key,
          subitems,
          value: formvalue[key],
        })
      } else if  (key.includes('Id')){
        payload[key] = formvalue[key].id
      } else if(!key.includes('-meta-') && ! key.includes('-sub-item-') && !key.includes('Id')) {
        payload[key] = formvalue[key]
      } 
    })

    if (Boolean(state))  payload.id = state.id
    
      Boolean(state) ? await update('pei', payload)  : await create('pei', payload);
      navigate(`/${CONSTANTES_ROUTERS.PEI}`, { state: {pacienteId: formvalue.pacienteId}})

      reset()
      setLoading(false);
      setMetas([])
      renderToast({
        type: 'success',
        title: 'Sucesso!',
        message: 'PEI Cadastrado.',
        open: true,
      });

    } catch (error) {
      setLoading(false);
      renderToast({
        type: 'failure',
        title: 'Erro!',
        message: 'Falha na conexão',
        open: true,
      });
    }
  };

  const addMeta = () => {
    const item = [...metas]

    const programaId: any = watch('programaId');

    METAS.id = `${programaId.id}-meta-${item.length}`
    item.push(METAS)

    setMetas(item)
  }

  const removeMeta = (index: any) => {
    const item = [...metas]
    
    setValue(item[index].id, undefined);
    
    item.splice(index, 1);
    setMetas(item)
  }

  const removeSubitem = (idMeta: any, index: number) => {
    const item = [...metas]
    const subitem =  item[idMeta].subitems[index]
    item[idMeta].subitems.splice(index, 1);

    setValue(subitem.id, undefined);
    setMetas(item)
  }

  const addSubitem = (idMeta: number) => {
    const item = [...metas]

    const subitems = item[idMeta]?.subitems ? [...item[idMeta].subitems] : []

    const metakey =   item[idMeta].id

    SUBITEM.id = `${item[idMeta].id}-sub-item-${subitems.length}`
    subitems.push(SUBITEM)

    item[idMeta].subitems = subitems

    setMetas(item)

  }

  useEffect(()=> {
    if (Boolean(state)) {
      const {paciente, programa, estimuloDiscriminativo, resposta, estimuloReforcadorPositivo, metas, procedimentoEnsino} = state
      setValue('pacienteId', paciente)
      setValue('programaId', programa)
      setValue('procedimentoEnsinoId', procedimentoEnsino)
      setValue('estimuloDiscriminativo', estimuloDiscriminativo)
      setValue('resposta', resposta)
      setValue('estimuloReforcadorPositivo', estimuloReforcadorPositivo)

      setMetas(metas)
      metas.map((meta: any)=> {
        setValue(meta.id, meta.value)
        meta.subitems && meta.subitems.map((subitem: any)=>  setValue(subitem.id, subitem.value))
      })
    }
  }, [])
  
  useEffect(() => {
    renderDropdown()
  }, []);

  return (
    <form className="mt-8 space-y-6 " onSubmit={handleSubmit(onSubmit)} >
      <div className='h-[90vh] flex flex-col overflow-y-auto'>
          {fields.map((item: any) => (
            <div>
              {
                hasPermition(item.permission) ? (
                  <Input
                    key={item.id}
                    labelText={item.labelText}
                    id={item.id}
                    type={item.type}
                    customCol={item.customCol}
                    control={control}
                    options={
                      item.type === 'select' ? dropDownList[item.name] : undefined
                    }
                    buttonAdd={item.buttonAdd}
                  />
                ) : null
              }
            </div>
          ))}
        <div className='mt-8'>
          <div className="text-gray-400 font-inter flex  justify-between m-2 leading-4"> 
            <span className="font-bold"> METAS </span>
            <ButtonHeron
              text="Add Meta"
              icon="pi pi-plus"
              type="primary"
              size="sm"
              onClick={()=> addMeta()}
              typeButton="button"
            />
          </div>
          {
          metas.map((item: any, key: number) => {
              return (
                <Fieldset legend={`${item.labelText} ${key+1}`}  className='mb-2' toggleable>
                <div className="text-gray-400 font-inter flex  justify-end "> 
                  <ButtonHeron
                    text="Add subitem"
                    icon="pi pi-plus"
                    type="primary"
                    size="sm"
                    onClick={()=> addSubitem(key)}
                    typeButton="button"
                  />
                </div>

                <Input
                  key={item.id}
                  labelText="Decrição"
                  id={item.id}
                  type="input-add"
                  customCol="col-span-6 sm:col-span-6"
                  control={control}
                  options={undefined}
                  onClick={()=>removeMeta(key)}
                />

                {
                  item?.subitems && item?.subitems.map((subitem: any, index: number) => {
                    return (
                      <Input
                        key={subitem.id}
                        labelText={`Item ${index + 1}`}
                        id={subitem.id}
                        type="input-add"
                        customCol="col-span-6 sm:col-span-6"
                        control={control}
                        options={undefined}
                        onClick={()=>removeSubitem(key, index)}

                      />
                    )
                  })
                }
                </Fieldset>
              )
            })
          }
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
