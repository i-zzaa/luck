import { useCallback, useEffect, useState } from "react";
import { Filter } from "../templates/filter";
import { PEIFields } from "../constants/formFields";
import { deleteItem, dropDown, filter } from "../server";
import { useToast } from "../contexts/toast";
import { Card } from "../components/card";
import { NotFound } from "../components/notFound";
import { LoadingHeron } from "../components/loading";
import { useLocation, useNavigate } from "react-router-dom";
import { CONSTANTES_ROUTERS } from "../routes/OtherRoutes";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Fieldset } from "primereact/fieldset";
import { ButtonHeron } from "../components/button";
import { TIPO_PROTOCOLO } from "../constants/protocolo";

const fieldsConst = PEIFields;
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ''));

const PEI = () => {
  const { renderToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;

  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>([]);
  const [list, setList] = useState({}) as any;

  const [protocolo, setProtocolo] = useState(TIPO_PROTOCOLO.pei )

  const handleEditPrograma = (item: any) => {
    navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, { state: { item, tipoProtocolo: TIPO_PROTOCOLO.pei } })
  }

  const handleRemovePrograma = async(item: any) => {
   setLoading(true)
   try {

    const pacienteId = item.paciente
    await deleteItem(`pei/${item.id}`)

    onSubmitFilter({ pacienteId })
    renderToast({
      type: 'success',
      title: 'Sucesso!',
      message: 'PEI removido!',
      open: true,
    });

   } catch (error) {
     renderToast({
       type: 'failure',
       title: '401',
       message: 'PEI não encontrado!',
       open: true,
     });
   }
   setLoading(false)
  }

  const renderFiledSet = (title: string, text: string) => (
    <Fieldset className="text-[8px]">
      <div className="font-bold text-wrap"> { title } </div>
      <div className="font-normal text-wrap"> { text }</div>
    </Fieldset>
  )

  const renderContent = () => {
    if (!loading) {
      return list.length ? (
        <Card >
           {/* <div className="flex my-2 items-center  w-full">
            <div className="ml-auto" >
                <ButtonHeron
                    text="Revisar Metas"
                    type="primary"
                    size="sm"
                    icon="pi pi-check-circle"
                    onClick={()=>{}}
                    loading={loading}
                  />
              </div>
           </div> */}
          <Accordion >
          {
            list.map((item: any, key: number) => {
              return (
                <AccordionTab 
                key={key} 
                header={
                  <div className="flex items-center  w-full">
                    <span>{ item.programa.nome}</span>

                    {protocolo === TIPO_PROTOCOLO.pei && (<div className="ml-auto" >
                      <ButtonHeron
                        text="editar"
                        type="transparent"
                        size="icon"
                        icon="pi pi-pencil"
                        color='violet'
                        onClick={()=>handleEditPrograma(item)}
                        loading={loading}
                      />
                      <ButtonHeron
                        text="remove"
                        icon="pi pi-trash"
                        type="transparent"
                        color='red'
                        size="icon"
                        onClick={()=>handleRemovePrograma(item)}
                        loading={loading}
                      />
                    </div>)}
                  </div>
                } tabIndex={key}>
                  <div className="w-full overflow-y-auto">
                    { <div className="font-bold my-2" > { item.procedimentoEnsino.nome }</div>}
                   
                    <div className=" grid grid-cols-3 gap-1">
                      {item.estimuloDiscriminativo &&  renderFiledSet('SD (estímulo discriminativo)', item.estimuloDiscriminativo)}
                      { item.resposta && renderFiledSet('Resposta', item.resposta)}
                      { item.estimuloReforcadorPositivo && renderFiledSet('SR+ (estímulo reforçador positivo))', item.estimuloReforcadorPositivo)}
                    </div>
                    <div className="my-2">
                      {
                        item.metas.map((meta: any, indexMeta: number)=> {
                          return (
                            <div key={indexMeta}>
                              <span className="flex align-items-center gap-2 w-full font-inter">Meta {indexMeta + 1}: {meta.value}</span>
                              <ul className="list-disc	ml-8 font-inter">
                                {
                                  meta.subitems &&  meta.subitems.map((subitem: any, index: number)=> {
                                  //  return <li key={index} className="flex items-center gap-2"> <i className="pi pi-check-circle text-green-400"></i>{subitem.value} </li>
                                   return <li key={index}> {subitem.value} </li>
                                })
                                }
                              </ul>
                            </div>
                          )
                        })
                      }
                    </div>
                  </div>
                </AccordionTab>
              )
            }) 
          }
        </Accordion>
        </Card>
      ) : (
       <Card> <NotFound /> </Card>
      );
    } else {
      return <LoadingHeron />;
    }
  }

  const onSubmitFilter = async ({ pacienteId, protocoloId }: any) => {
    setLoading(true)

    setProtocolo(protocoloId)
    try {
      const { data }: any = await filter('pei', {paciente: pacienteId, protocoloId});

      setList(data);
    } catch (error) {
      setList([]);
      renderToast({
        type: 'failure',
        title: '401',
        message: 'PEI não encontrado!',
        open: true,
      });
    }
    setLoading(false)
  }

  const renderFilter = () => {
    return (
      <Filter
        id="form-filter-pei"
        legend="Filtro"
        nameButton="Cadastrar"
        fields={fieldsConst}
        dropdown={dropDownList}
        onSubmit={(value)=>  onSubmitFilter(value)}
        onReset={()=> setList([])}
        screen="PEI"
        loading={loading}
        onInclude={() => navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, { state: { tipoProtocolo: TIPO_PROTOCOLO.pei } })}
        defaultValues={state}
      />
    )
  }
  
  const renderPrograma = useCallback(async () => {
    const [paciente, protocolo]: any = await Promise.all([
      dropDown('paciente'),
      dropDown('protocolo'),
    ])

    setDropDownList({
      paciente,
      protocolo
    })
  }, []);

  useEffect(() => {
    if (state) {
      onSubmitFilter(state)
    }
    renderPrograma();
  }, []);
  
  return (
    <div>
      { renderFilter() }
      { renderContent() }
    </div>
  );
};

export default PEI;
