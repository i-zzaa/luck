import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getList } from "../server";
import { useForm } from "react-hook-form";
import { Tree } from "primereact/tree";
import { Card } from "primereact/card";
import { Timeline } from "primereact/timeline";
import { formatdate } from "../util/util";
import clsx from "clsx";

export const Patient = () => {
  const location = useLocation();
  const { patient } = location.state;

  const [dropDownProgram, setDropDownProgram] = useState([])
  const [dropDownInfo, setDropDownInfo] = useState([])

  const [programas, setProgramas ] = useState<any[]>([])
  const [selectedKeys, setSelectedKeys] = useState([]);

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

  const customizedContent = (item: any) => {
    return (
      <Card title={`${item.evento.especialidade.nome} - ${item.terapeuta.usuario.nome}`} subTitle={formatdate(item.evento.dataInicio)}>
          <p>{item.resumo}</p>
          {/* <Button label="Read more" className="p-button-text"></Button> */}
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

  useEffect(() => {
    renderProgram()
    renderSession()
  }, [])
  
  return (
    <div>
      <div className="text-primary font-base grid justify-center p-2 leading-4 my-4"> 
        { patient?.nome } 
        <span className="text-gray-400 font-light text-sm"> [{ patient?.responsavel }]  </span>
      
      </div>

      <div>
        <Tree 
          filter filterMode="strict" filterPlaceholder="Programas" 
          value={dropDownProgram} 
          selectionMode="checkbox" 
          selectionKeys={selectedKeys} 
          onSelectionChange={(e: any) => {
            setSelectedKeys(e.value)
          }} 
          className="w-full md:w-30rem" 
        />
      </div>

      <div className="p-1 my-4">
        <Timeline value={dropDownInfo} align="left" className="gap-2" marker={customizedMarker} content={customizedContent} />
      </div>
    </div>
  )
}