import { useEffect, useMemo, useState } from "react";
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
import { Knob } from "primereact/knob";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Accordion, AccordionTab } from "primereact/accordion";
import { ScrollPanel } from "primereact/scrollpanel";

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

  const renderProgram = useMemo(async () => {
    const list = await getList('programa/dropdown')
    setDropDownProgram(list)
  }, [])

  const renderSession = useMemo(async () => {
    const list = await getList(`sessao/${patient.id}`)
    setDropDownInfo(list)
  }, [])


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
        { item.evento.especialidade.nome } <span className="text-sm text-gray-400 font-light">[{item.evento.terapeuta.usuario.nome}]</span>
      </>
    )
  }

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

  const customizedBodyTable = (rowData: any) => <Knob value={rowData.porcentagem}  valueTemplate={'{value}%'} />

  const customizedContent = (item: any) => {
    return (
      <Card title={renderTitle(item)} subTitle={formatdate(item.evento.dataInicio)}>
        <Accordion  className="my-4">
          {
            item.sessoes.map((sessao: any, key: number)=> (
              <AccordionTab header={sessao.label} key={key} tabIndex={key}>
                  <p className="m-0">
                    <DataTable value={sessao.children} size='small' responsiveLayout='scroll' className='-mt-4'  >
                      <Column field="label" header="Atividade"></Column>
                      <Column header="%" body={customizedBodyTable}></Column>
                    </DataTable>
                  </p>
              </AccordionTab>
            ))
          }
          
        </Accordion>

        <ScrollPanel style={{ width: '100%', height: '70px' }}>
          <p>{item.resumo}</p>
        </ScrollPanel>
      </Card>
    );
  };

  const renderHeader = () => {
    return  (
      <div className="text-primary font-base grid justify-start m-4 p-2 leading-4"> 
        <span className="font-bold"> Prontuário </span>
        { patient.nome } 
        <span className="text-gray-400 font-light text-sm"> [{ patient?.responsavel }]  </span>
      </div>
    )
  }

  const renderContent = () => {
    return (
      <>
        <div className="p-1 my-4 overflow-y-auto">
          <Timeline value={dropDownInfo} align="left" className="gap-2" marker={customizedMarker} content={customizedContent} />
        </div>
      </>
    )
  }


  useEffect(() => {
    renderProgram
    renderSession
  }, [])
  
  return (
    <div>
      { renderHeader() }
      { renderContent() }
    </div>
  )
}