import { useEffect, useState } from "react"
import { ButtonHeron, Card, Input } from "../components"
import { Checkbox } from "primereact/checkbox"
import { useLocation, useNavigate } from "react-router-dom"
import { sessionResumoFields } from "../constants/session";
import { useToast } from "../contexts/toast";
import { CONSTANTES_ROUTERS } from "../routes/OtherRoutes";
import { useForm } from "react-hook-form";
import { create, getList } from "../server";

const fields = sessionResumoFields;
const fieldsState: any = {};
fields.forEach((field: any) => (fieldsState[field.id] = ''));

export const Sessao = () => {
  const navigator = useNavigate()
  const { renderToast } = useToast();
  const location = useLocation();
  const { event, session } = location.state;

  const [programas, setProgramas ] = useState<any[]>([])
  
  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<any>({ 
   });

   const renderList = async() => {
    const data = await getList(`sessao/programa/${event.paciente.id}`)
    setProgramas(data)
   }

  useEffect(() => {
    
  }, [])

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

  const handleCheked = (value: boolean,  programaId: number, atividadeId: number) => {
    // const result = [...programas]
    // result[programaId][atividadeId] = value
    // setProgramas(result)
  }

  const renderAtividades = (atividades: any[], programaId: number) => atividades.map((atividade: any, atividadeId: any) => {
    return (
      <div key={atividadeId} className="flex align-items-center">
        <Checkbox inputId="ingredient1" name={atividade.value} value={atividade.value} onChange={(e: any)=> handleCheked(e.value.checked, programaId, atividadeId)} checked={atividade.checked} />
        <label  className="ml-2">{atividade.value}</label>
      </div>
      )
  } )

  const renderHeader = () => {
    return <div className=" mt-20 mx-4 font-inter font-medium">Selecione as atividades para sessão</div>
  }

  const renderContent = () => {
    return (
      <div>
        {
        programas.map((programa: any, key: number)=> {
          return (
            <div className="px-4 mt-4" key={key}>
              <Card>
              <div className="p-2">
              <div className="mb-4 font-inter font-semibold">
              { programa.nome}
              </div>
              {renderAtividades(programa.atividades, key)}
              </div>
            </Card>
            </div>
          )
        })
        }

        <div className="px-4 mt-4" >
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmitResumo)}>
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
            </form>
        </div>
      </div>
      
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

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </>
  )
}