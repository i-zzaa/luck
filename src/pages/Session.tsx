import {  useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from 'react-router-dom';
import { diffWeek } from "../util/util";
import JoditEditor from 'jodit-react';
import { Card } from "../components/card";
import { ButtonHeron } from "../components/button";
import { create, getList, update } from "../server";
import { useToast } from "../contexts/toast";
import { CONSTANTES_ROUTERS } from "../routes/OtherRoutes";
import { ChoiceItemSchedule } from "../components/choiceItemSchedule";

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

  const renderHeaderSumary = useMemo(() => {
    return  (
      <div className="text-gray-400 font-inter grid justify-start mx-2  mt-8 leading-4"> 
        <span className="font-bold"> Resumo </span>
      </div>
    )
  }, [])

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
        {renderHeaderSumary}
        { renderContent() }
        { renderFooter()}
      </div>
    </>
  )
}
