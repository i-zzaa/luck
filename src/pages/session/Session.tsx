import JoditEditor from 'jodit-react';
import { Card } from '../../components/card';
import { ButtonHeron } from '../../components/button';
import { ChoiceItemSchedule } from '../../components/choiceItemSchedule';
import { useSessionForm} from "./useSessionForm"
import { SessionActivity } from './SessionActivity';
import { SessionPortage } from './SessionPortage';
import { SessionVBMapp } from './SessionVBMapp';
import { SessionMaintenance } from './SessionMaintenance';

export const Session = () => {
  const {
    editor,
    content,
    setContent,
    list,
    listMaintenance,
    listPortage,
    listVBMapp,
    dtt,
    maintenance,
    portage,
    vbmapp,
    isEdit,
    loading,
    setPortage,
    setVBMapp,
    setDTT,
    setMaintenance,
    handleSubmitSumary,
    state
  } = useSessionForm();

  const renderHeader = () => (
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
  );

  const renderSumary = () => (
    <>
      <div className="text-gray-400 font-inter grid justify-start mx-2  mt-8 leading-4">
        <span className="font-bold">Resumo</span>
      </div>
      <Card className="rounded-lg cursor-not-allowed max-w-[100%]">
        <JoditEditor
          ref={editor}
          value={content}
          config={{
            readonly: isEdit,
            language: 'pt_br',
            buttons: "bold,italic,underline,strikethrough,font,fontsize,paragraph,copyformat,table,fullsize,preview",
            saveModeInStorage: true,
          }}
          onBlur={(newContent) => setContent(newContent)}
          onChange={() => {}}
        />
      </Card>
    </>
  );

  const renderFooter = () => (
    !isEdit && (
      <div className="mt-auto">
        <ButtonHeron
          text="Salvar"
          icon="pi pi-check"
          type="primary"
          size="full"
          loading={loading}
          onClick={handleSubmitSumary}
          disabled={isEdit}
        />
      </div>
    )
  );

  return (
    <div className="grid overflox-y-auto">
      {renderHeader()}
      <div className="">
        <SessionActivity list={list} dtt={dtt} isEdit={isEdit} setDTT={setDTT} />
        <SessionPortage listPortage={listPortage}  portage={portage} isEdit={isEdit} setPortage={setPortage}/>
        <SessionVBMapp listVBMapp={listVBMapp} vbmapp={vbmapp} isEdit={isEdit} setVBMapp={setVBMapp} />
        <SessionMaintenance   listMaintenance={listMaintenance}  isEdit={isEdit} setMaintenance={setMaintenance}/>        
        { renderSumary()}
      </div>
      {renderFooter()}
    </div>
  );
};
