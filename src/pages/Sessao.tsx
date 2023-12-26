import { useEffect, useState } from "react"
import { ButtonHeron, Input } from "../components"
import { Checkbox } from "primereact/checkbox"
import { useNavigate, useLocation } from "react-router-dom"
import { Card } from "primereact/card"
import { ProgressBar } from "primereact/progressbar"
import { Rating } from "primereact/rating"
import { useForm } from 'react-hook-form';
import { useToast } from '../contexts/toast';
import { sessionResumoFields } from '../constants/session';
import { CONSTANTES_ROUTERS } from "../routes/OtherRoutes"
import { MultiStateCheckbox } from 'primereact/multistatecheckbox';


const fields = sessionResumoFields;
const fieldsState: any = {};
fields.forEach((field: any) => (fieldsState[field.id] = ''));

export const Sessao = () => {
  const [programas, setProgramas ] = useState<any[]>([])
  const navigator = useNavigate()
  const location = useLocation();
  const { event } = location.state;
  const { renderToast } = useToast();

  const options = [
    { checked: null, icon: '' },
    { checked: true, icon: 'pi pi-check' },
    { checked: false, icon: 'pi pi-times' }
];


  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<any>({ 
   });
  

  const [loop, setLoop] = useState(5)


  const onSubmitResumo = async ({ resumo }: any) => {
    try {

      if ( resumo){
        renderToast({
          type: 'success',
          title: 'Sucesso!',
          message: 'Resumo da sessão enviado!',
          open: true,
        })

        navigator(`/${CONSTANTES_ROUTERS.CALENDAR}`);
        
      }  else {
        renderToast({
          type: 'failure',
          title: 'Erro!',
          message: 'Necessário preencher o resumo',
          open: true,
        })
      }

      

    } catch (error) {
      renderToast({
        type: 'failure',
        title: 'Erro!',
        message: 'Falha ao enviar o resumo',
        open: true,
      });
    }
  };


  useEffect(() => {
    setProgramas([
      {
        nome: "Programa 1",
        atividades: [
          { id: 1, checked:true ,value: "Atividade 1"},
          { id: 2, checked:false ,value: "Atividade 2"},
          { id: 3, checked:null ,value: "Atividade 3"},
          { id: 4, checked:null ,value: "Atividade 4"},
        ]
      },
      {
        nome: "Programa 2",
        atividades: [
          { id: 1, checked:null ,value: "Atividade 1"},
          { id: 2, checked:null ,value: "Atividade 2"},
          { id: 3, checked:null ,value: "Atividade 3"},
          { id: 4, checked:null ,value: "Atividade 4"},
        ]
      },
    ])
  }, [])

  const handleCheked = (value: boolean,  programaId: number, atividadeId: number) => {
    // const result = [...programas]
    // result[programaId][atividadeId] = value
    // setProgramas(result)
  }

  const renderAtividades = (atividades: any[], programaId: number) => atividades.map((atividade: any, atividadeId: number) => {
    return (
      <div key={atividadeId} className="flex align-items-center">
        <Checkbox inputId="ingredient1" name={atividade.value} value={atividade.value} onChange={(e: any)=> handleCheked(e.value.checked, programaId, atividadeId)} checked={atividade.checked} />
        <label  className="ml-2">{atividade.value}</label>
      </div>
      )
  } )

  const renderHeader = () => {
    return  <div className=" mt-20 mx-4 font-inter font-medium">{event.paciente.nome}</div>
  }

  const renderHeaderCard = (value: any) => {
    return (
     <div className="h-2 mt-8">
       <ProgressBar value={value} style={{ height: '6px' }} showValue={false} unit={`${loop}`}></ProgressBar>
     </div>
    )
  }
  const renderFooterCard = (value: any, key: number) => {
    return (
     <div className="h-2 mt-8 flex gap-2 justify-around">

        {
          value.atividades.map((item: any, index: number) =>  <MultiStateCheckbox key={index} value={item.checked} onChange={(e) => {
            // const val = {...item}
            // val.checked = e.value

            // const pro = { ...programas }
            // pro[key].atividades[index] = val
            // setProgramas(pro)
          }} options={options} optionValue="checked" />)
        }
     </div>
    )
  }

  const renderContent = () => {
    switch (event.especialidade.id) {
      case 1:
        return (
          <>

          {programas.map((programa: any, key: number)=> {
            return (
              <div className="px-4 mt-4" key={key}>
                <Card header={()=> renderHeaderCard(2)} footer={renderFooterCard(programa, key)}>
                  <div className="p-2">
                  <div className="mb-4 font-inter font-semibold">
                  { programa.nome } 
                  </div>
                  {/* {renderAtividades(programa.atividades, key)} */}
                  </div>
                </Card>

   
              </div>
            )
          })}
        </>
          
        )

    
      default:
        return (
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
        )

    }

  }

  const renderFooter = () => {
    switch (event.especialidade.id) {
      case 1:
        return (
          <div className="fixed bottom-0 w-[104vw] ml-[-0.5rem]">
            <ButtonHeron
              text="Iniciar sessão"
              icon="pi pi-play"
              type="primary"
              color="white"
              size="full"
              onClick={() => {
                navigator(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
                  state: {
                    event
                  }
                });
              }}
            />
          </div>
        )
    
      default:
        return (
          <div className="fixed bottom-0 w-[104vw] ml-[-0.5rem]">
            <ButtonHeron
              text="Finalizar sessão"
              icon="pi pi-check"
              type="primary"
              color="white"
              size="full"
              onClick={handleSubmit(onSubmitResumo)}
            />
          </div>
        )
    }

  }

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </>
  )
}