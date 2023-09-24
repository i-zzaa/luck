import { useEffect, useState } from "react"
import { ButtonHeron } from "../components"
import { Checkbox } from "primereact/checkbox"
import { useNavigate } from "react-router-dom"
import { Card } from "primereact/card"
import { ProgressBar } from "primereact/progressbar"
import { Rating } from "primereact/rating"

export const Sessao = () => {
  const [programas, setProgramas ] = useState<any[]>([])
  const navigator = useNavigate()

  const [paciente, setPaciente] = useState({
    nome: 'João Pedro',
    idade: 4
  })

  const [loop, setLoop] = useState(5)


  useEffect(() => {
    setProgramas([
      {
        nome: "Programa 1",
        atividades: [
          { id: 1, checked:false ,value: "Atividade 1"},
          { id: 2, checked:false ,value: "Atividade 2"},
          { id: 3, checked:false ,value: "Atividade 3"},
          { id: 4, checked:false ,value: "Atividade 4"},
        ]
      },
      {
        nome: "Programa 2",
        atividades: [
          { id: 1, checked:false ,value: "Atividade 1"},
          { id: 2, checked:false ,value: "Atividade 2"},
          { id: 3, checked:false ,value: "Atividade 3"},
          { id: 4, checked:false ,value: "Atividade 4"},
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
        <label htmlFor={atividadeId} className="ml-2">{atividade.value}</label>
      </div>
      )
  } )

  const renderHeader = () => {
    return <div className=" mt-20 mx-4 font-inter font-medium">{paciente.nome}</div>
  }

  const renderHeaderCard = (value: any) => {
    return (
     <div className="h-2 mt-8">
       <ProgressBar value={value} style={{ height: '6px' }} showValue={false} unit={`${loop}`}></ProgressBar>
     </div>
    )
  }
  const renderFooterCard = (value: any) => {
    return (
     <div className="h-2 mt-8">
      <Rating value={value} onChange={(e) => {}} stars={10} />
     </div>
    )
  }

  const renderContent = () => {
    return (
      programas.map((programa: any, key: number)=> {
        return (
          <div className="px-4 mt-4" key={key}>
            <Card header={()=> renderHeaderCard(2)} footer={renderFooterCard}>
              <div className="p-2">
              <div className="mb-4 font-inter font-semibold">
              { programa.nome } -  Atividade 1
              </div>
              {/* {renderAtividades(programa.atividades, key)} */}
              </div>
            </Card>
          </div>
        )
      })
      
    )
  }

  const renderFooter = () => {
    return (
      <div className="fixed bottom-0 w-[104vw] ml-[-0.5rem]">
        <ButtonHeron
          text="Iniciar sessão"
          icon="pi pi-play"
          type="primary"
          color="white"
          size="full"
          onClick={() => navigator('/protocolo')}
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