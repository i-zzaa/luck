import clsx from 'clsx';
import { Card } from '../../components/card';
import { RichTextEditor } from '../../components/richTextEditor';
import { ButtonHeron } from '../../components/button';
import { ChoiceItemSchedule } from '../../components/choiceItemSchedule';
import { useSessionForm } from './useSessionForm';
import { SessionActivity } from './SessionActivity';
import { SessionPortage } from './SessionPortage';
import { SessionVBMapp } from './SessionVBMapp';
import { SessionMaintenance } from './SessionMaintenance';
import { useMemo } from 'react';

export const Session = () => {
  const {
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
    state,
  } = useSessionForm();

  const renderHeader = () => (
    <ChoiceItemSchedule
      start={state?.item?.data?.start}
      end={state?.item?.data?.end}
      statusEventos={state?.item?.statusEventos}
      title={state?.item?.title}
      localidade={state?.item?.localidade?.nome}
      localExternoDescricao={state?.item?.localExternoDescricao}
      localExibicao={state?.item?.localExibicao}
      isExterno={state?.item?.isExterno}
      km={state?.item?.km}
      modalidade={state?.item?.modalidade?.nome}
      dataInicio={state?.item?.dataInicio}
      dataFim={state?.item?.dataFim}
      dataAtual={state?.item?.dataAtual}
    />
  );

  const renderSumary = () => (
    <>
      <div className="flex items-center justify-between mx-2 mt-6">
        <span className="text-gray-800 font-inter font-bold leading-4">
          Resumo
          {!isEdit && <span className="text-red-400"> *</span>}
        </span>
        {isEdit && (
          <span className="text-gray-800 font-inter leading-4 bg-gray-300 rounded-full px-2 py-0.5">
            Somente leitura
          </span>
        )}
      </div>
      <Card
        className={clsx(
          'rounded-lg w-full border border-gray-300',
          isEdit && 'cursor-not-allowed bg-gray-200'
        )}
      >
        <RichTextEditor
          value={content}
          readOnly={isEdit}
          placeholder="Descreva como foi a sessão, a evolução do paciente e observações relevantes."
          onBlur={(newContent) => setContent(newContent)}
        />
      </Card>
    </>
  );

  const renderFooter = () =>
    !isEdit && (
      <div className="fixed inset-x-0 bottom-0 z-10 px-4 pt-3 bg-background border-t border-gray-300 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
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
    );

  const renderHeaderSession = useMemo(() => {
    if (
      !list.length &&
      !listPortage.length &&
      !listVBMapp.length &&
      !listMaintenance.manual.length &&
      !listMaintenance.portage.length &&
      !listMaintenance.vbmapp.length
    )
      return;

    return (
      <div className="text-red-400 font-inter grid justify-start mx-2 leading-4 mt-8">
        <span className="text-md">
          Interrompa o treino da atividade ao atingir 4 tentativas corretas
          consecutivas.
        </span>
      </div>
    );
  }, [list, listPortage, listVBMapp, listMaintenance]);

  return (
    <div className="grid overflow-x-hidden bg-background">
      {renderHeader()}
      <div className={clsx(!isEdit && 'pb-24')}>
        {renderHeaderSession}
        <SessionActivity
          list={list}
          dtt={dtt}
          isEdit={isEdit}
          setDTT={setDTT}
        />
        <SessionPortage
          listPortage={listPortage}
          portage={portage}
          isEdit={isEdit}
          setPortage={setPortage}
        />
        <SessionVBMapp
          listVBMapp={listVBMapp}
          vbmapp={vbmapp}
          isEdit={isEdit}
          setVBMapp={setVBMapp}
        />
        <SessionMaintenance
          listMaintenance={listMaintenance}
          isEdit={isEdit}
          setMaintenance={setMaintenance}
        />
        {renderSumary()}
      </div>
      {renderFooter()}
    </div>
  );
};
