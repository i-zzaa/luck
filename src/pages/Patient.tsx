import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { create, getList } from "../server";
import { Controller, useForm } from "react-hook-form";
import { Tree } from "primereact/tree";
import { Card } from "primereact/card";
import { Timeline } from "primereact/timeline";
import { formatdate } from "../util/util";
import clsx from "clsx";
import { ButtonHeron } from "../components/button";
import { CONSTANTES_ROUTERS } from "../routes/OtherRoutes";

export const Patient = () => {
  const location = useLocation();
  const { patient } = location.state;
  const [dropDownProgram, setDropDownProgram] = useState([])
  const [dropDownInfo, setDropDownInfo] = useState([])
  const [programas, setProgramas ] = useState(null)
  const navigator = useNavigate()

  const {
    handleSubmit,
    formState: { errors },
    control,
    setValue,
  } = useForm<any>();


  const customizedMarker = (item: any) => {
    return (
      <span className={clsx('flex w-2rem h-2rem items-center p-2 rounded-full justify-center text-white border-circle z-1 shadow-1', {
        'bg-to': item.evento.especialidade.nome.toUpperCase() === 'TO',
        'bg-fono': item.evento.especialidade.nome.toUpperCase() === 'FONO',
        'bg-psico': item.evento.especialidade.nome.toUpperCase() === 'PSICO',
        'bg-black': item.evento.especialidade.nome.toUpperCase() === 'PSICOPEDAG',
      })} >
          <i className="pi pi-calendar"></i>
      </span>
    );
  };

  const onSubmit = async (formValue: any) => {
    const data = await create('sessao/protocolo', {
      formValue
    })

    navigator(`/${CONSTANTES_ROUTERS.CALENDAR}`, {
      state: {
        event,
        session: data
      }
    });
  }

  const renderTitle = (item: any) => {
    return (
      <>
        { item.evento.especialidade.nome } <span className="text-sm text-gray-400 font-light">[{item.terapeuta.usuario.nome}]</span>
      </>
    )
  }

  const customizedContent = (item: any) => {
    return (
      <Card title={renderTitle(item)} subTitle={formatdate(item.evento.dataInicio)}>
        <p>{item.resumo}</p>
      </Card>
    );
  };

  const renderProgram = async () => {
    const list = await getList('programa/dropdown')
    setDropDownProgram(list)
  }

  const renderSession = async () => {
    const list = await getList(`sessao/${patient.id}`)
    setDropDownInfo(list)
  }

  const renderHeader = () => {
    return  (
      <div className="text-primary font-base grid justify-start m-4 p-2 leading-4"> 
        <span className="font-bold"> Protuário </span>
        { patient.nome } 
        <span className="text-gray-400 font-light text-sm"> [{ patient?.responsavel }]  </span>
      </div>
    )
  }

  const renderContent = () => {
    return (
      <>
        <Controller
          name="programas"
          control={control}
          render={(field: any) => (
          <Tree 
            filterPlaceholder="Programas" 
            value={dropDownProgram} 
            selectionKeys={programas} 
            selectionMode="checkbox" 
            className="w-full md:w-30rem" 
            onSelectionChange={(e: any) => {
              setProgramas(e.value)

              setValue('programas', e.value)
              return e.value
            }}
          />
        )} />

        <div className="p-1 my-4">
          <Timeline value={dropDownInfo} align="left" className="gap-2" marker={customizedMarker} content={customizedContent} />
        </div>
      </>
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
    renderProgram()
    renderSession()
  }, [])
  
  return (
    <div>
      { renderHeader() }
      { renderContent() }
      { renderFooter() }
    </div>
  )
}