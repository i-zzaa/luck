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

const fields = sessionResumoFields;
const fieldsState: any = {};
fields.forEach((field: any) => (fieldsState[field.id] = ''));

/*
  O protocolo será preenchido pela líder
  O programa será escolhhi pela aplicadora 
*/

export const Protocolo = () => {
  const [dropDownProgram, setDropDownProgram] = useState([])
  const [protocolo, setProtocolo] = useState([]) as any
  const [programas, setProgramas] = useState([]) as any

  const navigator = useNavigate()
  const location = useLocation();
  const { event } = location.state;
  const { renderToast } = useToast();

  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<any>({ });

  const renderProgram =  useMemo(async () => {
    const list = await getList('programa/dropdown')
    setDropDownProgram(list)
  }, [])

  const onSubmit = async (formValue: any) => {
    // const data = await create('sessao/protocolo', {
    //   formValue
    // })

    navigator(`/${CONSTANTES_ROUTERS.SESSION}`, {
      state: {
        event,
        // session: data
      }
    });
  }

  const renderContentLider = () => {
    return <div className="grid  gap-2 p-2">
     <span className="text-gray-800"> Selecione os programas</span>
      <Controller
        name="programas"
        control={control}
        render={() => (
         <Tree 
          filter filterMode="strict" filterPlaceholder="Programas" 
          value={dropDownProgram} 
          selectionKeys={programas} 
          selectionMode="checkbox" 
          className="w-full md:w-30rem" 
          onSelectionChange={(e: any) => {
            setProgramas(e.value)
            return e.value
          }}
        />
      )} />
    </div>
  }

  const renderContentAplicadora = () => {
    return <div className="grid  gap-2 p-2">
     <span className="text-gray-800"> Selecione as atividade para a sessão</span>
      <Controller
        name="programas"
        control={control}
        render={() => (
         <Tree 
          filter filterMode="strict" filterPlaceholder="Programas" 
          value={dropDownProgram} 
          selectionKeys={programas} 
          selectionMode="checkbox" 
          className="w-full md:w-30rem" 
          onSelectionChange={(e: any) => {
            setProgramas(e.value)
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
          text="Salvar Protocolo"
          icon="pi pi-play"
          type="primary"
          color="white"
          size="full"
          onClick={handleSubmit(onSubmit)}
        />
      </div>
    )
  }

  useEffect(() => {
    renderProgram
  }, [])

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </>
  )
}