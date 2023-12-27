import { useEffect, useState } from "react"
import { ButtonHeron } from "../components"
import { useNavigate, useLocation } from "react-router-dom"
import { Controller, useForm } from 'react-hook-form';
import { useToast } from '../contexts/toast';
import { sessionResumoFields } from '../constants/session';
import { CONSTANTES_ROUTERS } from "../routes/OtherRoutes"
import { create, getList } from "../server"
import { Tree } from "primereact"

const fields = sessionResumoFields;
const fieldsState: any = {};
fields.forEach((field: any) => (fieldsState[field.id] = ''));

export const Protocolo = () => {
  const [dropDownProgram, setDropDownProgram] = useState([])
  const [programas, setProgramas] = useState([]);

  const navigator = useNavigate()
  const location = useLocation();
  const { event } = location.state;
  const { renderToast } = useToast();

  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<any>({ 
   });

  const renderProgram = async () => {
    const list = await getList('programa/dropdown')
    setDropDownProgram(list)
  }

  const onSubmit = async (formValue: any) => {
    const data = await create('sessao/protocolo', {
      formValue
    })

    navigator(`/${CONSTANTES_ROUTERS.SESSION}`, {
      state: {
        event,
        session: data
      }
    });
  }

  useEffect(() => {
    renderProgram()
  }, [])

  const renderContent = () => {
    return (
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
    )
  }

  const renderHeader = () => {
    return  <div className="flex justify-center items-center mt-8  font-inter font-medium">
      {event.paciente.nome}
    </div>
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

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </>
  )
}