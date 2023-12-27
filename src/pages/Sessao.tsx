import { useEffect, useState } from "react"
import { ButtonHeron, Card, Input } from "../components"
import { Checkbox } from "primereact/checkbox"
import { useLocation, useNavigate } from "react-router-dom"
import { sessionResumoFields } from "../constants/session";
import { useToast } from "../contexts/toast";
import { CONSTANTES_ROUTERS } from "../routes/OtherRoutes";
import { Controller, useForm } from "react-hook-form";
import { create, getList } from "../server";
import { formatdate } from "../util/util";
import { Tree } from "primereact/tree";

const fields = sessionResumoFields;
const fieldsState: any = {};
fields.forEach((field: any) => (fieldsState[field.id] = ''));

export const Sessao = () => {
  const navigator = useNavigate()
  const [dropDownProgram, setDropDownProgram] = useState([])

  const { renderToast } = useToast();
  const location = useLocation();
  const { event, session } = location.state;

  const [programas, setProgramas ] = useState([]) as any
  
  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<any>({ 
   });


   const renderProgram = async () => {
    const data = await getList(`sessao/protocolo/${event.paciente.id}`)
    setDropDownProgram(data)
  }


  const onSubmitResumo = async ({ resumo }: any) => {
    if ( resumo){
      renderToast({
        type: 'success',
        title: 'Sucesso!',
        message: 'Resumo da sessão enviado!',
        open: true,
      })


    }  else {
      renderToast({
        type: 'failure',
        title: 'Erro!',
        message: 'Necessário preencher o resumo',
        open: true,
      })
    }

    try {
      const date = await create('sessao', {
        resumo,
        pacienteId: event.pacient.id,
        programas:programas,
        calendarioId: event.id,
        especialidadeId: event.especialidade.id,
        terapeutaUsuarioId: event.terapeuta.id,
      })

      navigator(`/${CONSTANTES_ROUTERS.CALENDAR}`);
    } catch (error) {
      renderToast({
        type: 'failure',
        title: 'Erro!',
        message: 'Falha ao enviar o resumo',
        open: true,
      });
    }
  };


  const renderHeader = () => {
    return  (
      <div className="text-primary font-base grid justify-start m-4 p-2 leading-4"> 
      <span className="font-bold"> Sessão </span>
        { event.paciente.nome } 
        <span className="text-gray-400 font-light text-sm font-inter"> { formatdate(event.dataInicio) }  </span>
      </div>
    )
  }

  const renderContent = () => {
    return (
      <>
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

      {fields.map((item: any) => (
        <Input
          key={item.id}
          id={item.id}
          type={item.type}
          labelText={item.labelText}
          control={control}
          validate={item.validate}
          errors={errors}
        />
      ))}
    </>
    )
  }
  
  const renderFooter = () => {
    return (
      <div className="fixed bottom-0 w-[104vw] ml-[-0.5rem]">
        <ButtonHeron
          text="Salvar sessão"
          icon="pi pi-check"
          type="primary"
          color="white"
          size="full"
          onClick={handleSubmit(onSubmitResumo)}
        />
      </div>
    )
  }

  useEffect(() => {
    renderProgram()
  }, [])

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </>
  )
}