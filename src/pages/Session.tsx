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
import CheckboxSN from "../components/checkboxSN";
import { Fieldset } from "primereact/fieldset";
import { TIPO_PROTOCOLO } from "../constants/protocolo";


const MAINTENANCE = 'maintenance';
const ACTIVITY = 'activity';
const PORTAGE = 'portage';
const VBMAPP = 'vbmapp';

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
  const [listVBMapp, setLisVBMapp] = useState([] as any);
  const [dtt, setDTT] = useState([] as any);
  const [maintenance, setMaintenance] = useState([] as any);
  const [session, setSession] = useState({});
  const [portage, setPortage] = useState([] as any);
  const [vbmapp, setVBMapp] = useState([] as any);

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
          // formatarDado(result.portage, PORTAGE),
          // formatarDado(result.vbmapp, PORTAGE),
          formatarDado(result.maintenance,  MAINTENANCE)
        ])

        setList(atividades)
        setListPortage(result.portage)
        setLisVBMapp(result.vbmapp)
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
      const result = await getList(`/pei/activity/session/${state.item.paciente.id}`)

      const [atividades, maintenance, portage, vbmappCurrent] = await Promise.all([
        formatarDado(result.atividades, ACTIVITY, TIPO_PROTOCOLO.portage),
        formatarDado(result.maintenance, MAINTENANCE, TIPO_PROTOCOLO.portage),
        formatarDado(result.portage, PORTAGE, TIPO_PROTOCOLO.portage),
        formatarDado(result.vbmapp, VBMAPP, TIPO_PROTOCOLO.vbMapp)
      ])

      setList(atividades)
      setDTT(result.sessao)
      setListMaintenance(maintenance)
      setListPortage(portage)
      setLisVBMapp(vbmappCurrent)
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
        vbmapp: vbmapp,
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
// Função auxiliar recursiva que transforma cada nó
const transformNode = async (node: any, type: string, tipoProtocolo = TIPO_PROTOCOLO.portage): Promise<any> => {
  // Cria o objeto base para o nó
  const transformed: any = {
    key: node.key,
    label: node.label,
  };

  // Se o nó tiver `permiteSubitens`, aplica a lógica especial
  if (node.permiteSubitens && node.children && node.children.length > 0) {
    // Mantemos os filhos, mas garantimos que cada um tenha `children` com 10 `nulls`

    transformed.estimuloDiscriminativo = node?.estimuloDiscriminativo || ''
    transformed.estimuloReforcadorPositivo = node?.estimuloReforcadorPositivo || ''
    transformed.resposta = node?.resposta || ''

    transformed.children = await Promise.all(
      node.children.map(async (child: any) => ({
        key: child.key,
        label: child.label,
        children: Array.from({ length: 10 }).map(() => null),
        // permiteSubitens: node.permiteSubitens
      }))
    );
  }else if( tipoProtocolo === TIPO_PROTOCOLO.vbMapp && node.permiteSubitens) {

    // transformed.estimuloDiscriminativo = node?.estimuloDiscriminativo || ''
    // transformed.estimuloReforcadorPositivo = node?.estimuloReforcadorPositivo || ''
    // transformed.resposta = node?.resposta || ''

    transformed.children = Array.from({ length: 10 }).map(() => null)
    transformed.permiteSubitens = node.permiteSubitens

  }
  // Se o nó tiver filhos normais (e não for `permiteSubitens`), aplica transformação recursiva
  else if (node.children && node.children.length > 0) {
    transformed.children = await Promise.all(
      node.children.map(async (child: any) => transformNode(child, type, tipoProtocolo))
    );
  }
  // Se o nó não tiver filhos, recebe um array padrão de `nulls`
  else {
    transformed.children = Array.from({
      length: type === ACTIVITY || type === PORTAGE ||  type === VBMAPP ? repeatActivity : repeatMaintenance,
    }).map(() => null);
  }

  return transformed;
};

// Função principal para formatar os dados
const formatarDado = async (data: any, type: string = ACTIVITY, tipoProtocolo = TIPO_PROTOCOLO.portage) => {
  return await Promise.all(data.map(async (programa: any) => transformNode(programa, type, tipoProtocolo)));
};


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

  const renderFiledSet = (title: string, text: string) => (
    <Fieldset className="text-[8px]">
      <div className="font-bold text-wrap"> { title } </div>
      <div className="font-normal text-wrap"> { text }</div>
    </Fieldset>
  )
    
  const renderedCheckboxesPortage = (programaId: number, metaId: number, checkKey: number, item: any) => {
    return (
      <CheckboxDTT
        key={checkKey}
        value={item?.children ? item?.children[checkKey] :  item} // Pegamos o valor correto do checkbox
        disabled={isEdit}
        onChange={(newValue: any) => {
          const current = [...listPortage];
  
          // Percorre os níveis da árvore até o checkbox correto
          const programa = current[programaId];
          const meta = programa.children[metaId];
  
          // Verifica se o item tem um subitem antes dos checkboxes (4 níveis)
          // if (meta.children[checkKey].children) {
          if (meta.children[checkKey] && meta.children[checkKey].children) {
            // Caso 4 níveis: Atualiza o valor no último nível (checkboxes dentro do subitem)
            meta.children[checkKey].children = meta.children[checkKey].children.map((val: any, idx: number) =>
              idx === checkKey ? newValue : val
            );
          } else {
            // Caso 3 níveis: Atualiza diretamente no nível do item
            meta.children = meta.children.map((val: any, idx: number) =>
              idx === checkKey ? newValue : val
            );
          }
  
          setPortage(current); // Atualiza o estado
        }}
      />
    );
  };

  const renderVBMapp  = () => {
    return !!listVBMapp.length && (
      <div className="mt-8">
        <div className="text-gray-400 font-inter grid justify-start mx-2 mt-8 leading-4">
          <span className="font-bold">VB Mapp</span>
        </div>
        <Card className="rounded-lg cursor-not-allowed max-w-[100%]">
          <Accordion>
            {listVBMapp.map((nivel: any, key: any) => (
              <AccordionTab
                key={nivel.key}
                tabIndex={key}
                header={
                  <div className="flex items-center w-full">
                    <span>{nivel.label}</span>
                  </div>
                }
              > 

              <Accordion>
                {nivel?.children.map((programa: any, programaKey: any) => (
                  <AccordionTab
                  key={programa.key}
                  tabIndex={programaKey}
                  className="w-[90%]"
                  header={
                    <div className="flex items-center w-full">
                      <span>{programa.label}</span>
                    </div>
                  }
                > 
                {
                  programa.children.map((meta: any, metaKey: any) => (
                    <li>
                      <span>{meta.label}</span>
                      <div className="flex flex-col gap-1 m-4">
                      {renderItems(meta, key, programaKey)}
                      </div>
                    </li>
                  ))
                }
                </AccordionTab>
                ))}
              </Accordion>
              </AccordionTab>
            ))}
          </Accordion>
        </Card>
      </div>
    );
  }
  
  const renderItems = (items: any, progKey: number, metaKey: number): any => {
    const validChildren = items?.children ? items?.children[0]?.label  : false

    if (validChildren) {
      return  (
        <div>
          <div className=" grid grid-cols-3 gap-1 mb-2">
            { renderFiledSet('SD (estímulo discriminativo)', items?.estimuloDiscriminativo || '')}
            { renderFiledSet('Resposta', items?.resposta || '')}
            { renderFiledSet('SR+ (estímulo reforçador positivo))', items?.estimuloReforcadorPositivo || '')}
          </div>
          {items?.children.map((itm: any, checkKey: any) => {
        return (
          <div key={checkKey} className="flex flex-col ml-2">
            <span>- {itm.label}</span>
            <div className="flex flex-col gap-1">
              {renderItems(itm.children, progKey, metaKey)}
            </div>
          </div>
        )
      })}

        </div>
        )
    }else if (items?.label && items?.children.length === 10) {
      return renderItems(items.children, progKey, metaKey)
    }
    else if (items.length === 10) {
      return (
        <div className="flex gap-1">
          {items.map((_item: any, idx: any) =>
            renderedCheckboxesPortage(progKey, metaKey, idx, _item)
          )}
        </div>
      )
    }else if (items[0]?.children) {
      items.map((itm: any, checkKey: any) => {
        return (
          <div key={checkKey} className="flex flex-col ml-2">
            <span>- {itm.label}</span>
            <div className="flex flex-col gap-1">
              {renderItems(itm.children, progKey, metaKey)}
            </div>
          </div>
        )
      })
    }


    // return items.map((itm, checkKey) => {
    //   // Verifica se o item tem `children` válidos (diferentes de null)
    //   // const validChildren = itm?.children?.filter((child) => child !== null) || [];

    //   if (validChildren) {
    //     // Se o item tem filhos válidos, ele exibe o label e renderiza os filhos
    //     return (
    //       <div key={itm.key} className="flex flex-col">
    //         <span>{itm.label}</span>
    //         <div className="ml-4 flex flex-col gap-1">
    //           {renderItems(validChildren, progKey, metaKey)}
    //         </div>
    //       </div>
    //     );
    //   } else if (itm?.children && itm?.children.length === 10) {
    //     // Se o item tem um array de 10 `nulls`, renderiza os checkboxes
    //     return (
    //       <div key={itm.key} className="flex flex-col gap-1">
    //         <span>{itm?.label}</span>
    //         <div className="flex gap-1">
    //           {itm.children.map((_, idx) =>
    //             renderedCheckboxesPortage(progKey, metaKey, `${checkKey}-${idx}`, itm)
    //           )}
    //         </div>
    //       </div>
    //     );
    //   } else {
    //     // Caso especial: Se um item não tiver filhos mas não for um array de nulls, ainda exibe checkboxes
    //     return (
    //       <div key={checkKey} className="flex flex-col gap-1">
    //         <span>{itm?.label}</span>
    //         <div className="flex gap-1">
    //           {Array.from({ length: 10 }).map((_, idx) =>
    //             renderedCheckboxesPortage(progKey, metaKey, `${checkKey}-${idx}`, itm)
    //           )}
    //         </div>
    //       </div>
    //     );
    //   }
    // });
  };

  const renderPortage = () => {
    return !!listPortage.length && (
      <div className="mt-8">
        <div className="text-gray-400 font-inter grid justify-start mx-2 mt-8 leading-4">
          <span className="font-bold">Portage</span>
        </div>
        <Card className="rounded-lg cursor-not-allowed max-w-[100%]">
          <Accordion>
            {listPortage.map((programa: any, key: any) => (
              <AccordionTab
                key={programa.key}
                tabIndex={key}
                header={
                  <div className="flex items-center w-full">
                    <span>{programa.label}</span>
                  </div>
                }
              >
                {programa?.children.map((meta: any, metaKey: any) => (
                  <li className="my-2 grid gap-2 items-center" key={meta.key}>
                    <span>{meta.label}</span>
                    <div className="flex flex-col gap-1">
                      {renderItems(meta, key, metaKey)}
                    </div>
                  </li>
                ))}
              </AccordionTab>
            ))}
          </Accordion>
        </Card>
      </div>
    );
  };



  const renderActivity = () => {
    return  !!list.length && (
      <div className="mt-8">
        <div className="text-gray-400 font-inter grid justify-start mx-2  mt-8 leading-4"> 
          <span className="font-bold"> Manual </span>
        </div>
        {!!list.length && <div className="text-red-400 font-inter grid justify-start mx-2 leading-4 mt-2"> 
          <span className="text-md">Interrompa o treino da atividade ao atingir 4 tentativas corretas consecutivas.</span>
        </div>}
        {list.length ? (<Card className="rounded-lg cursor-not-allowed max-w-[100%]">
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
          <></>
        // <Card customCss="rounded-lg cursor-not-allowed max-w-[100%]">
        //   <div className="grid gap-4 justify-center ">
        //     <NotFound />
        //     <ButtonHeron
        //       text="Selecionar Metas"
        //       icon="pi pi-book"
        //       type="primary"
        //       color='white'
        //       size="sm"
        //       onClick={()=>   navigate(`/${CONSTANTES_ROUTERS.METAS}`, { state: state.item})}
        //     />
        //   </div>
        // </Card>
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
        { (<Card className="rounded-lg cursor-not-allowed max-w-[100%]">
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
        <Card  className="rounded-lg cursor-not-allowed max-w-[100%]">
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
      !isEdit && <div className="mt-auto">
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
  }, [])
  

  return (
    <div  className="grid overflox-y-auto">
      { renderHeader }
      <div className="">
        { renderActivity() }
        { renderPortage() }
        { renderVBMapp() }
        { renderMaintenance() }
        { renderSumary() }
      </div>
        { renderFooter()}
    </div>
  )
}
