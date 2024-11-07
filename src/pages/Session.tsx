import {  useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from 'react-router-dom';
import JoditEditor from 'jodit-react';
import { Card } from "../components/card";
import { ButtonHeron } from "../components/button";
import { create, getList, update } from "../server";
import { useToast } from "../contexts/toast";
import { CONSTANTES_ROUTERS } from "../routes/OtherRoutes";
import { ChoiceItemSchedule } from "../components/choiceItemSchedule";
import { Accordion, AccordionTab } from "primereact/accordion";
import CheckboxDTT from "../components/DTT";
import { NotFound } from "../components/notFound";
import CheckboxSN from "../components/Checkbox";
import CheckboxPortage from "../components/CheckboxPortage";


const MAINTENANCE = 'maintenance';
const ACTIVITY = 'activity';
const PORTAGE = 'portage';

export const Session = () => {
  const { renderToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const { state } = location;

  const editor = useRef(null);
  const [repeatActivity, setRepeatActivity] = useState(10);
  const [repeatMaintenance, setRepeatMaintenance] = useState(1);
  const [content, setContent] = useState('');
  const [list, setList] = useState([] as any);
  const [listMaintenance, setListMaintenance] = useState([] as any);
  const [listPortage, setListPortage] = useState([] as any);
  const [dtt, setDTT] = useState([] as any);
  const [maintenance, setMaintenance] = useState([] as any);
  const [session, setSession] = useState({});
  const [portage, setPortage] = useState([] as any);

  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const getSumaryContent = async() => {
    try {
      const result = await getList(`/sessao/${state.item.id}`)
      if (result) {
        setContent(result.resumo)
        setSession(result)
        setIsEdit(true)

        const [atividades, maintenance] = await Promise.all([
          formatarDado(result.sessao, ACTIVITY),
          formatarDado(result.portage, PORTAGE),
          formatarDado(result.maintenance,  MAINTENANCE)
        ])

        setList(atividades)
        setListPortage(result.portage)
        setListMaintenance(maintenance)
        setDTT(result.sessao)
      }else {
        await getActivity()
      }
    }catch (e) {}
  }

  // const getTeste = async() => {
  //   try {
  //     const result = await getList(`/sessao/teste`)
  //     console.log(result);
  //   }catch (e) {}
  // }

  const getActivity = async() => {
    try {
      const result = await getList(`/pei/activity/session/${state.item.id}`)

      const [atividades, maintenance, portage] = await Promise.all([
        formatarDado(result.atividades, ACTIVITY),
        formatarDado(result.maintenance, MAINTENANCE),
        formatarDado(result.portage, PORTAGE)
      ])

      setList(atividades)
      setDTT(result.sessao)
      setListMaintenance(maintenance)
      setListPortage(portage)
    }catch (e) {}
  }

  const handleSubmitSumary = async() => {
    try {
     const payload = {
        calendarioId: state.item.id,
        pacienteId: state.item.paciente.id,
        sessao: dtt,
        maintenance: listMaintenance,
        selectedMaintenanceKeys: maintenance,
        resumo: content,
        date: state.item.date,
        portage: portage,
        ...session
      };

      isEdit ?  await update('/sessao', payload):  await create('/sessao', payload)

      renderToast({
        type: 'success',
        title: '',
        message: 'Sessão atualizada!',
        open: true,
      });

      navigate(`/${CONSTANTES_ROUTERS.CALENDAR}`)
    } catch (error) {
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Sessão não atualizada!',
        open: true,
      });
    }
  }


  const renderHeader = useMemo(() => {
    return  (
      <ChoiceItemSchedule
        start={state.item?.data.start}
        end={state.item?.data.end}
        statusEventos={state.item?.statusEventos.nome}
        title={state.item?.title}
        localidade={state.item?.localidade.nome}
        isExterno={state.item?.isExterno}
        km={state.item?.km}
        modalidade={state.item?.modalidade.nome}
        dataInicio={state.item?.dataInicio}
        dataFim={state.item?.dataFim}
        dataAtual={state.item?.dataAtual}
      />
    )
  }, [])

  const formatarDado = async (data: any, type: string = ACTIVITY) => {
    const result = await Promise.all( data.map(async (programa: any, key: number)=> {
  
      return {
        key: programa.key,
        label: programa.label,
        children: await Promise.all( programa.children.map(async (meta: any, metakey: number)=> {
          const item: any = {
            key: meta.key,
            label: meta.label,
          }

          if (meta?.children) {
            item.children = await Promise.all( meta.children.map(async (sub: any, subkey: number)=> {
              
              const children = sub.children || Array.from({ length: type === ACTIVITY || PORTAGE ? repeatActivity :  repeatMaintenance}).map((index)=> {
                return null
              })

              // const firstFourAreC =  sub.children ? sub.children.slice(0, 3).every((value: string) => value === "C") : false

              return {
                key: sub.key,
                label: sub.label,
                // disabled: firstFourAreC,
                children
              }
            }))
          } else {
            item.children =  Array.from({ length: type === ACTIVITY  || PORTAGE? repeatActivity :  repeatMaintenance}).map((index)=> {
              return null
            })
          }

          return item
        }))
      }
    }))

    return result
  }

  const renderedCheckboxes = (programaId: number, metaId: number, activityId: number, checkKey: number, value?: any) => {
    return (
      <CheckboxDTT 
        key={checkKey} 
        value={value} 
        disabled={list[programaId].children[metaId].children[activityId].disabled || isEdit} 
        onChange={(newValue: any) => {
          const current = [...list];
          
          // Verifica o valor atual do checkbox para evitar contagem duplicada
          const previousValue = list[programaId].children[metaId].children[activityId].children[checkKey];
          
          // Só atualiza e faz a verificação se houver uma mudança real no valor
          if (previousValue !== newValue) {
            current[programaId].children[metaId].children[activityId].children[checkKey] = newValue;
            
            // const children = current[programaId].children[metaId].children[activityId].children;
  
            // Verifica se há 4 'C' consecutivos, ignorando mudanças no mesmo checkbox
            // const fourConsecutiveC = children.some((_: any, idx: any) => {
            //   if (idx + 3 < children.length) {
            //     return children.slice(idx, idx + 4).every((val: string) => val === "C");
            //   }
            //   return false;
            // });
  
            // Desabilita o item se houver 4 'C' consecutivos
            // current[programaId].children[metaId].children[activityId].disabled = fourConsecutiveC;
  
            setDTT(current);
          }
        }}
      />
    );
  };

  const renderedCheckboxesMaintenance = (programaId: number, metaId: number, activityId: number, value?: any) => {
    return (
      <CheckboxSN 
        key={0} 
        value={value} 
        disabled={listMaintenance[programaId].children[metaId].children[activityId].disabled || isEdit} 
        onChange={(newValue: any) => {
          const current = [...listMaintenance];
  
          // Verifica o valor atual do checkbox para evitar contagem duplicada
          const previousValue = listMaintenance[programaId].children[metaId].children[activityId].children[0];
  
          // Só atualiza e faz a verificação se houver uma mudança real no valor
          if (previousValue !== newValue) {
            current[programaId].children[metaId].children[activityId].children[0] = newValue;
  
            // const children = current[programaId].children[metaId].children[activityId].children;
  
            // Desabilita o item se houver 4 'C' consecutivos
            // current[programaId].children[metaId].children[activityId].disabled = fourConsecutiveC;
  
            setMaintenance(current);
          }
        }}
      />
    );
  };

  const renderedCheckboxesPortage = (programaId: number, metaId: number, checkKey: number, value?: any) => {
    return (
      <CheckboxDTT 
        key={0} 
        value={value} 
        disabled={isEdit} 
        onChange={(newValue: any) => {
          const current = [...listPortage];
  
          // Verifica o valor atual do checkbox para evitar contagem duplicada
          // const previousValue = list[programaId].children[metaId].children[activityId].children[checkKey];
  
          // Só atualiza e faz a verificação se houver uma mudança real no valor
          // if (previousValue !== newValue) {
            // current[programaId].children[metaId].children[activityId].children[checkKey] = newValue;
            setPortage(current);
          // }
        }}
      />
    );
  };

  const renderPortage  = () => {
    return !!listPortage.length &&  (
      <div className="mt-8">
        <div className="text-gray-400 font-inter grid justify-start mx-2  mt-8 leading-4"> 
          <span className="font-bold"> Portage </span>
        </div>
        { (<Card customCss="rounded-lg cursor-not-allowed max-w-[100%]">
          <Accordion>
            {
              listPortage.map((programa: any, key: number)=> (
                <AccordionTab 
                  key={key} 
                  tabIndex={key}
                  header={
                    <div className="flex items-center  w-full">
                      <span>{ programa.label}</span>
                    </div>
                  }>
                    {
                      programa?.children.map((meta: any, metaKey: number) => (
                        <li className="my-2 grid gap-2  items-center" key={metaKey}>
  
                        <span>{ meta.label}</span>
                        {
                         <div className="flex gap-1">
                           {
                              meta?.children.map((itm: any, checkKey: number) => renderedCheckboxesPortage(key, metaKey, checkKey, itm))
                           }
                         </div>
                        }
                      </li>
                      ))
                      
                    }
                </AccordionTab>
              ))
            }
          </Accordion>
        </Card>)
      }
      </div>
    )
  }



  const renderActivity = () => {
    return (
      <div className="mt-8">
        <div className="text-gray-400 font-inter grid justify-start mx-2  mt-8 leading-4"> 
          <span className="font-bold"> ABA </span>
        </div>
        {!!list.length && <div className="text-red-400 font-inter grid justify-start mx-2 leading-4 mt-2"> 
          <span className="text-md">Interrompa o treino da atividade ao atingir 4 tentativas corretas consecutivas.</span>
        </div>}
        {list.length ? (<Card customCss="rounded-lg cursor-not-allowed max-w-[100%]">
          <Accordion>
            {
              list.map((programa: any, key: number)=> (
                <AccordionTab 
                  key={key} 
                  tabIndex={key}
                  header={
                    <div className="flex items-center  w-full">
                      <span>{ programa.label}</span>
                    </div>
                  }>
                    {
                      programa?.children.map((meta: any, metaKey: number) => (
                        <div key={metaKey} className="my-8">
                          <span className="font-bold font-inter">Meta {metaKey + 1}: </span> <span className="font-base font-inter">{ meta.label}</span>
                          <ul className="list-disc mt-2 font-inter ml-4">
                          {
                            meta?.children.map((act: any, actKey: number) => {
                              return (
                                <li className="my-2" key={actKey}>
                                  <span>{ act.label}</span>
                                  <div className="flex gap-1 -ml-4">
                                    {
                                       act?.children.map((itm: any, checkKey: number) => renderedCheckboxes(key, metaKey, actKey, checkKey, itm))
                                    }
                                  </div>
                                </li>
                              )
                            })
                          }
                          </ul>
                        </div>
                      ))
                      
                    }
                </AccordionTab>
              ))
            }
          </Accordion>
        </Card>): (
        <Card customCss="rounded-lg cursor-not-allowed max-w-[100%]">
          <div className="grid gap-4 justify-center ">
            <NotFound />
            <ButtonHeron
              text="Selecionar Metas"
              icon="pi pi-book"
              type="primary"
              color='white'
              size="sm"
              onClick={()=>   navigate(`/${CONSTANTES_ROUTERS.METAS}`, { state: state.item})}
            />
          </div>
        </Card>
        )
      }
      </div>
    )
  }

  const renderMaintenance  = () => {
    return !!listMaintenance.length &&  (
      <div className="mt-8">
        <div className="text-gray-400 font-inter grid justify-start mx-2  mt-8 leading-4"> 
          <span className="font-bold"> Manutenção </span>
        </div>
        { (<Card customCss="rounded-lg cursor-not-allowed max-w-[100%]">
          <Accordion>
            {
              listMaintenance.map((programa: any, key: number)=> (
                <AccordionTab 
                  key={key} 
                  tabIndex={key}
                  header={
                    <div className="flex items-center  w-full">
                      <span>{ programa.label}</span>
                    </div>
                  }>
                    {
                      programa?.children.map((meta: any, metaKey: number) => (
                        <div key={metaKey} className="my-8">
                          <span className="font-bold font-inter">Meta {metaKey + 1}: </span> <span className="font-base font-inter">{ meta.label}</span>
                          <ul className="list-disc mt-2 font-inter ml-4">
                          {
                            meta?.children.map((act: any, actKey: number) => {
                              return (
                                <li className="my-2 flex gap-2 -ml-4 items-center" key={actKey}>
                                  { renderedCheckboxesMaintenance(key, metaKey, actKey, 0)}
                                  <span>{ act.label}</span>
                                </li>
                              )
                            })
                          }
                          </ul>
                        </div>
                      ))
                      
                    }
                </AccordionTab>
              ))
            }
          </Accordion>
        </Card>)
      }
      </div>
    )
  }

  const renderSumary = () => {
    return (
      <>
        <div className="text-gray-400 font-inter grid justify-start mx-2  mt-8 leading-4"> 
          <span className="font-bold"> Resumo </span>
        </div>
        <Card  customCss="rounded-lg cursor-not-allowed max-w-[100%]">
          <JoditEditor
          ref={editor}
          value={content}
          config={{
            readonly: isEdit,
            language: 'pt_br',
            buttons: "bold,italic,underline,strikethrough,font,fontsize,paragraph,copyformat,table,fullsize,preview",
            saveModeInStorage: true,

          }}
          onBlur={newContent => setContent(newContent)} // preferred to use only this option to update the content for performance reasons
          onChange={newContent => {}}
        /> 
      </Card>
      </>
    )
  }

  const renderFooter = () => {
    return (
      <div className="mt-auto">
        <ButtonHeron
          text="Salvar"
          icon="pi pi-check"
          type="primary"
          size="full"
          loading={loading}
          onClick={() => handleSubmitSumary()}
          disabled={isEdit}
        />
      </div>
    )
  }

  useEffect(() => {
    getSumaryContent()
    // getTeste()
  }, [])
  

  return (
    <div  className="grid overflox-y-auto">
      { renderHeader }
      <div className="">
        { renderPortage() }
        { renderActivity() }
        { renderMaintenance() }
        { renderSumary() }
      </div>
        { renderFooter()}
    </div>
  )
}
