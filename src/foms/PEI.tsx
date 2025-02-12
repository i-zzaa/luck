import { useCallback, useEffect, useMemo, useState } from 'react';

import { useForm } from 'react-hook-form';
import { ButtonHeron, Input } from '../components/index';
import { PEICadastroFields } from '../constants/formFields';
import { useToast } from '../contexts/toast';
import { create, dropDown, update } from '../server';
import { permissionAuth } from '../contexts/permission';
import { Fieldset  } from 'primereact';
import { useLocation, useNavigate } from 'react-router-dom';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { TIPO_PROTOCOLO } from '../constants/protocolo';
import { OBJ_ITEM, OBJ_META } from '../util/util';

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

export default function PEICADASTRO( { paciente, param }: { paciente: { id: number, nome: string}, param?: any}) {
  const defaultValues = {
    pacienteId: '',
    procedimentoEnsinoId: '',
    programaId: '',
    estimuloDiscriminativo: '',
    resposta: '',
    estimuloReforcadorPositivo: '',
  };

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
    const [programa, procedimentoEnsino]: any = await Promise.all([
      dropDown('programa'),
      dropDown('pei/procedimento-ensino'),
    ])

    const drop = {
      programa,
      procedimentoEnsino
    }

    setDropDownList(drop)


    formatarDado(drop)
  }, []);
  
 const formatPortage = (formvalue: any) => {
  const meta = {...formvalue.metas[0]}
  delete formvalue.metas
  const selectedMeta = metas[0]?.selected ? {selected: metas[0].selected} : {}

 return {
  ...formvalue,
  nome: meta.value,
  id: meta.id,
  portage: metas[0].portage,
  faixaEtaria: metas[0].faixaEtaria,
  permiteSubitens: true,
  ...selectedMeta,
  subitems: meta.subitems.map((item: any, key: any) => {
    const selected = metas[0].subitems[key]?.selected ? {selected: metas[0].subitems[key]?.selected} : {}

    return {
      nome: item.value,
      id: item.id,
      ...selected,
    }

  }),
 }
}

const formatVBMapp = (formvalue: any) => {
  const {procedimentoEnsinoId, estimuloDiscriminativo, estimuloReforcadorPositivo, resposta, metas, pacienteId, programaId} = {...formvalue}
 
  const programaObj = dropDownList?.programa?.filter((item: any)=> item.id === programaId )[0]

  const formated = metas.map((metaCurrent: any) => {

    return {
      id: metaCurrent.id,
      nome: metaCurrent.value,
      procedimentoEnsinoId, 
      estimuloDiscriminativo, 
      estimuloReforcadorPositivo, 
      resposta,
      pacienteId,
      permiteSubitens: true,
      subitems: metaCurrent.subitems.map((item: any, key: any) => {
      const selected = metas[0].subitems[key]?.selected ? {selected: metas[0].subitems[key]?.selected} : {}
        return {
          nome: item.value,
          id: item.id,
          ...selected,
        }

      }),
    }
  })


 return {
  programa: programaObj.nome.toLowerCase(),
  metas: formated
 }
}


  const onSubmit = async (formvalue: any) => {

    formvalue.pacienteId = paciente

    setLoading(true);
    try {

    const payload: any = {
      metas: []
    }
    
    if (Object.values(formvalue).some(valor => valor === "")) {
      setLoading(false);
      renderToast({
        type: 'failure',
        title: 'Valores Vazios!',
        message: 'Preencha a descrição da meta e/ou do item ou exclua-o',
        open: true,
      });

      return
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
              ...OBJ_ITEM,
              id:  sub,
              value: formvalue[sub],
            })
          }
        })

        payload.metas.push({
          ...OBJ_META,
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

    if (Boolean(state?.item?.id))  payload.id = state.item.id

    if (state?.tipoProtocolo === TIPO_PROTOCOLO.pei)  {
      Boolean(state?.item?.id) ? await update('pei', payload)  : await create('pei', payload);
      navigate(`/${CONSTANTES_ROUTERS.PEI}`, { state: {pacienteId: formvalue.pacienteId}})
    }else if(state?.tipoProtocolo === TIPO_PROTOCOLO.portage) {
      const response = formatPortage(payload)
      navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, { state: { pacienteId: formvalue.pacienteId, tipoProtocolo: TIPO_PROTOCOLO.portage, metaEdit: response}})
    }else if(state?.tipoProtocolo === TIPO_PROTOCOLO.vbMapp) {
      const response = formatVBMapp(payload)
      navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, { state: { pacienteId: formvalue.pacienteId, tipoProtocolo: TIPO_PROTOCOLO.vbMapp, metaEdit: response}})
    }

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

    OBJ_META.id = `${programaId.id}-meta-${item.length}`
    item.push(OBJ_META)

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

    OBJ_ITEM.id = `${item[idMeta].id}-sub-item-${subitems.length}`
    subitems.push(OBJ_ITEM)

    item[idMeta].subitems = subitems

    setMetas(item)

  }

  const formatarDado = (drop: any) => {
    if (Boolean(state?.item?.programa) || (state?.tipoProtocolo && state?.tipoProtocolo === TIPO_PROTOCOLO.vbMapp)) {
      const {paciente, programa, estimuloDiscriminativo, resposta, estimuloReforcadorPositivo, metas, procedimentoEnsinoId
      } = state.item
  
      const programaObj = typeof programa !== 'object' ? drop?.programa?.filter((item: any)=> item.nome.toLowerCase() === programa )[0] : programa
      const procedimentoEnsinoObj = typeof procedimentoEnsinoId !== 'object' ? drop?.procedimentoEnsino?.filter((item: any)=> item.id === procedimentoEnsinoId)[0] : programa

      setValue('pacienteId', paciente)
      setValue('programaId', programaObj)
      setValue('procedimentoEnsinoId', procedimentoEnsinoObj)
      setValue('estimuloDiscriminativo', estimuloDiscriminativo)
      setValue('resposta', resposta)
      setValue('estimuloReforcadorPositivo', estimuloReforcadorPositivo)

      setMetas(metas)
      metas.map((meta: any)=> {
        setValue(meta.id, meta.value)
        meta.subitems && meta.subitems.map((subitem: any)=>  setValue(subitem.id, subitem.value))
      })
    } else if (state?.tipoProtocolo && state?.tipoProtocolo === TIPO_PROTOCOLO.portage) {
      const {paciente, metas} = param.item

      const procedimentoEnsino = drop.procedimentoEnsino?.filter((item: any)=> item.id ===metas[0].procedimentoEnsino )[0]
      const programa = drop?.programa?.filter((item: any)=> item.id ===metas[0].programa )[0]

      setMetas(metas)
      setValue(metas[0].id, metas[0].value)
      setValue('pacienteId', paciente)
      setValue('programaId', programa)
      setValue('procedimentoEnsinoId', procedimentoEnsino)
      setValue('estimuloDiscriminativo', metas[0].estimuloDiscriminativo)
      setValue('resposta', metas[0].resposta)
      setValue('estimuloReforcadorPositivo', metas[0].estimuloReforcadorPositivo)


      if (metas[0]?.subitems) {
        metas[0]?.subitems.map((subitem: any)=>  setValue(subitem.id, subitem.value))
      }else {
        metas[0].subitems = []
      }
    }
    // else if (state?.tipoProtocolo && state?.tipoProtocolo === TIPO_PROTOCOLO.vbMapp) {
    //   const {paciente, metas} = param.item

    //   const procedimentoEnsino = drop?.procedimentoEnsino?.filter((item: any)=> item.id ===metas[0].procedimentoEnsino )[0]
    //   const programa = drop?.programa?.filter((item: any)=> {
    //     return item.nome.toLowerCase() === metas[0].programa.toLowerCase()
    //   } )[0]

    //   setMetas(metas)


    //   setValue(metas[0].id, metas[0].value)
    //   setValue('pacienteId', paciente)
    //   setValue('programaId', programa)
    //   setValue('procedimentoEnsinoId', procedimentoEnsino)
    //   setValue('estimuloDiscriminativo', metas[0].estimuloDiscriminativo || '')
    //   setValue('resposta', metas[0].resposta || '')
    //   setValue('estimuloReforcadorPositivo', metas[0].estimuloReforcadorPositivo || '')


    //   if (metas[0]?.subitems) {
    //     metas[0]?.subitems.map((subitem: any)=>  setValue(subitem.id, subitem.value))
    //   }else {
    //     metas[0].subitems = []
    //   }
    // }
  }
  
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
            {(!state?.tipoProtocolo || state?.tipoProtocolo === TIPO_PROTOCOLO.pei )&& <ButtonHeron
              text="Add Meta"
              icon="pi pi-plus"
              type="primary"
              size="sm"
              onClick={()=> addMeta()}
              typeButton="button"
            />}
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
                  labelText="Descrição"
                  id={item.id}
                  type="input-add"
                  customCol="col-span-6 sm:col-span-6"
                  control={control}
                  options={undefined}
                  onClick={()=>removeMeta(key)}
                  disabled={state?.tipoProtocolo !== TIPO_PROTOCOLO.pei }
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
