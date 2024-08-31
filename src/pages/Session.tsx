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

export const Session = () => {
  const { renderToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const { state } = location;

  const editor = useRef(null);
  const [repeatActivity, setRepeatActivity] = useState(10);
  const [content, setContent] = useState('');
  const [list, setList] = useState([] as any);
  const [listMaintenance, setListMaintenance] = useState([] as any);
  const [dtt, setDTT] = useState([] as any);
  const [session, setSession] = useState({});

  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const getSumaryContent = async() => {
    try {
      const result = await getList(`/sessao/${state.item.id}`)
      if (result) {
        setContent(result.resumo)
        setSession(result)
        setIsEdit(true)

        const atividades = await formatarDado(result.atividades)
        setList(atividades)

        setDTT(result.sessao)
      }else {
        await getActivity()
      }
    }catch (e) {}
  }

  const getActivity = async() => {
    try {
      const result = await getList(`/pei/activity/session/${state.item.id}`)

      const atividades = await formatarDado(result.atividades)
      setList(atividades)

      const maintenance = await formatarDado(result.maintenance)
      setListMaintenance(maintenance)
    }catch (e) {}
  }

  const handleSubmitSumary = async() => {
    try {
     const payload = {
        calendarioId: state.item.id,
        pacienteId: state.item.paciente.id,
        sessao: JSON.stringify(dtt),
        resumo: content,
        date: state.item.date,
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

  const formatarDado = async (data: any) => {
    const result = await Promise.all( data.map(async (programa: any, key: number)=> {
      return {
        key: programa.key,
        label: programa.label,
        children: await Promise.all( programa.children.map(async (meta: any, metakey: number)=> {
          return {
            key: meta.key,
            label: meta.label,
            children:  await Promise.all( meta.children.map(async (sub: any, subkey: number)=> {
              const children = sub.children || Array.from({ length: repeatActivity }).map((index)=> {
                return null
              })

              const firstFourAreC =  sub.children ? sub.children.slice(0, 3).every((value: string) => value === "C") : false

              return {
                key: sub.key,
                label: sub.label,
                disabled: firstFourAreC,
                children
              }
            }))
          }
        }))
      }
    }))

    return result

  }

  const renderedCheckboxes = (programaId: number, metaId: number, activityId: number, checkKey: number, value?: any) => {

    return <CheckboxDTT key={checkKey}  value={value} disabled={ list[programaId].children[metaId].children[activityId].disabled || isEdit} 
    onChange={(value: any)=> {
      const current = [...list]

      const firstFourAreC =  list[programaId].children[metaId].children[activityId].children.slice(0, 3).every((value: string) => value === "C");
      list[programaId].children[metaId].children[activityId].disabled = firstFourAreC

      current[programaId].children[metaId].children[activityId].children[checkKey] = value
      setDTT(current)
    }}/>
  };


  const renderActivity = () => {
    return (
      <div className="mt-8">
        <div className="text-gray-400 font-inter grid justify-start mx-2  mt-8 leading-4"> 
          <span className="font-bold"> ABA </span>
        </div>
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
              text="Selecionar Metas-DTT"
              icon="pi pi-book"
              type="primary"
              color='white'
              size="sm"
              onClick={()=>   navigate(`/${CONSTANTES_ROUTERS.METASDTT}`, { state: state.item})}
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
          // disabled={isEdit}
        />
      </div>
    )
  }

  useEffect(() => {
    getSumaryContent()
  }, [])
  

  return (
    <div  className="h-[90vh] flex flex-col">
      { renderHeader }
      <div className="overflox-y-auto">
        { renderActivity() }
        { renderMaintenance() }
        { renderSumary() }
      </div>
        { renderFooter()}
    </div>
  )
}
