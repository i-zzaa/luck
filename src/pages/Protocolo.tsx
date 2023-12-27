import { useEffect, useMemo, useState } from "react"
import { ButtonHeron } from "../components"
import { useNavigate, useLocation } from "react-router-dom"
import { Controller, useForm } from 'react-hook-form';
import { useToast } from '../contexts/toast';
import { sessionResumoFields } from '../constants/session';
import { CONSTANTES_ROUTERS } from "../routes/OtherRoutes"
import { create, getList } from "../server"
import { Tree } from "primereact"
import { formatdate } from "../util/util";
import { useAuth } from "../contexts/auth";

const fields = sessionResumoFields;
const fieldsState: any = {};
fields.forEach((field: any) => (fieldsState[field.id] = ''));

/*
  O protocolo será preenchido pela líder
  O programa será escolhhi pela aplicadora 
*/

export const Protocolo = () => {
  const [dropDownProtocolo, setDropDownProtocolo] = useState([]) as any
  const [dropDownProgram, setDropDownProgram] = useState([]) as any

  const [protocolo, setProtocolo] = useState([]) as any
  const [programas, setProgramas] = useState([]) as any

  const navigator = useNavigate()
  const location = useLocation();
  const { event } = location.state;
  const { renderToast } = useToast();

  const { user } = useAuth()

  const {
    handleSubmit,
    formState: { errors },
    control,
    setValue
  } = useForm<any>({ });

  const renderProtocolo =  useMemo(async () => {
    const list = await getList('programa/dropdown')
    setDropDownProtocolo(list)
  }, [])

  const renderProgram =  useMemo(async () => {
    const list = await getList(`sessao/protocolo/${event.paciente.id}`)
    setDropDownProgram(list.protocolo)
    setProtocolo(list.protocoloSet)
  }, [])

  const renderAtividade =  useMemo(async () => {
    const list = await getList(`sessao/atividade/${event.paciente.id}`)
    setProgramas(list.atividadeSessaoSet)
  }, [])

  const onSubmit = async (formValue: any) => {

    if (formValue.protocolo) {
      const keys = Object.keys(formValue.protocolo)
      const programas = await Promise.all(dropDownProtocolo.filter(async (item: any) =>  {
        item.children =  await Promise.all(item.children.filter((children: any) => keys.includes(children.key)))
        return  keys.includes(item.key)
      }))

     const payload = {
        protocolo: JSON.stringify(programas),
        protocoloSet: JSON.stringify(formValue.protocolo),
        pacienteId: event.paciente.id,
        terapeutaId: user.id,
      }

      await create('sessao/protocolo', payload)
    }

    if (formValue.atividadeSessao) {
      const keys = Object.keys(formValue.atividadeSessao)
      const atividadeSessao = await Promise.all(dropDownProtocolo.filter(async (item: any) =>  {
        item.children =  await Promise.all(item.children.filter((children: any) => keys.includes(children.key)))
        return  keys.includes(item.key)
      }))

     const payload = {
        atividadeSessao: JSON.stringify(atividadeSessao),
        atividadeSessaoSet: JSON.stringify(formValue.atividadeSessao),
        pacienteId: event.paciente.id,
        terapeutaId: user.id,
      }

      await create('sessao/atividadeSessao', payload)

    }

    renderProtocolo
    renderToast({
      type: 'success',
      title: 'Sucesso',
      message:'Protocolo salvo!',
      open: true,
    });
  }

  const renderContentLider = () => {
    return <div className="grid  gap-2 p-2">
     <span className="text-gray-800"> Selecione o protocolo</span>
      <Controller
        name="protocolo"
        control={control}
        render={() => (
         <Tree 
          filter filterMode="strict" filterPlaceholder="Programas" 
          value={dropDownProtocolo} 
          selectionKeys={protocolo} 
          selectionMode="checkbox" 
          className="w-full md:w-30rem" 
          onSelectionChange={(e: any) => {
            setProtocolo(e.value)
            setValue('protocolo', e.value)
            return e.value
          }}
        />
      )} />
    </div>
  }

  const renderContentAplicadora = () => {
    return <div className="grid  gap-2 p-2">
     <span className="text-gray-800"> Selecione as atividades para a sessão</span>
      <Controller
        name="atividadeSessao"
        control={control}
        render={() => (
         <Tree 
          filter filterMode="strict" filterPlaceholder="atividadeSessao" 
          value={dropDownProgram} 
          selectionKeys={programas} 
          selectionMode="checkbox" 
          className="w-full md:w-30rem" 
          onSelectionChange={(e: any) => {
            setProgramas(e.value)
            setValue('atividadeSessao', e.value)
            return e.value
          }}
        />
      )} />
    </div>
  }

  const renderContent = () => {
    return <div className="grid gap-4">
      { renderContentLider()}
      { renderContentAplicadora()}
    </div>
  }

  const renderHeader = () => {
    return  (
      <div className="text-primary font-base grid justify-start m-4 p-2 leading-4"> 
      <span className="font-bold"> Protocolo </span>
        { event.paciente.nome } 
        <span className="text-gray-400 font-light text-sm font-inter"> { formatdate(event.dataInicio) }  </span>
      </div>
    )
  }

  const renderFooter = () => {
    return (
      <div className="fixed bottom-0 w-[104vw] ml-[-0.5rem]">
        <ButtonHeron
          text="Salvar"
          icon="pi pi-check"
          type="primary"
          color="white"
          size="full"
          onClick={handleSubmit(onSubmit)}
        />
      </div>
    )
  }

  useEffect(() => {
    renderProtocolo
    renderProgram
    renderAtividade
  }, [])

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </>
  )
}