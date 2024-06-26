import {  useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from 'react-router-dom';
import { diffWeek } from "../util/util";
import JoditEditor from 'jodit-react';
import { Card } from "../components/card";
import { ButtonHeron } from "../components/button";
import { create, getList, update } from "../server";
import { useToast } from "../contexts/toast";
import { CONSTANTES_ROUTERS } from "../routes/OtherRoutes";

export const Session = () => {
  const { renderToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const { state } = location;

  const editor = useRef(null);
  const [content, setContent] = useState('');
  const [session, setSession] = useState({});
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const getSumaryContent = async() => {
    try {
      const result = await getList(`/sessao/sumary/${state.item.id}`)
      if (result) {
        setContent(result.resumo)
        setSession(result)
        setIsEdit(true)
      }
    }catch (e) {}
  }

  async function handleSubmitSumary() {
    try {
     const payload = {
        calendarioId: state.item.id,
        pacienteId: state.item.paciente.id,
        sessao: {
          teste: "ok"
        },
        resumo: content,
        ...session
      };

      isEdit ?  await update('/sessao/sumary', payload):  await create('/sessao/sumary', payload)

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

  const avaliationCount = () => {
    let text = state.item.modalidade.nome;
    if (text !== 'Avaliação' || !state.item?.dataInicio || !state.item?.dataFim)
      return <span>{text}</span>;

    const current = diffWeek(state.item.dataInicio, state.item.dataAtual);
    const diffTotal = diffWeek(state.item.dataInicio, state.item.dataFim);

    return (
      <>
        <span>
          {text}
          <span className="font-inter ml-2">{`${current}/${diffTotal}`}</span>{' '}
        </span>
      </>
    );
  };

  const renderHeader = useMemo(() => {
    return  (
      <div className="flex gap-2 w-full item-center"> 
        <div className="grid text-center font-inter text-sm text-gray-400"> 
          <span> {state.item.data.start}</span> -
          <span>{state.item.data.end}</span>
        </div>
        <div className="text-gray-800 text-sm text-center grid justify-center">  
          <div className="font-base font-semibold text-primary">  { state.item.title } </div>

          <p className="flex gap-4 items-center justify-between">
            {avaliationCount()} <span>{state.item.statusEventos.nome}</span>
          </p>
                
          <p className="flex gap-4 items-center">
            {state.item.localidade.nome}
            {state.item.isExterno && (
              <span className="font-bold font-inter"> {`- ${state.item.km}km`} </span>
            )}
          </p>
        </div>
      </div>
    )
  }, [])

  const renderContent = () => {
    return (

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
  }, [])
  

  return (
    <>
      { renderHeader }
      <div className="h-[85vh] flex flex-col">
        { renderContent() }
        { renderFooter()}
      </div>
    </>
  )
}
