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
import { useMemo, useState } from 'react';
import { extractTrainedSelectionKeys, MIN_RESUMO_LENGTH } from '../../util/sessionTree';
import { MetasBottomSheet } from '../../components/metasBottomSheet';
import { classificarStatus } from '../../util/status';

// Espaço reservado pro toast fixo de aviso (ver renderHeaderSession) —
// ele não empurra ninguém sozinho (é fixed), então o resto da tela
// (cabeçalho + conteúdo) precisa desse respiro pra não ficar por baixo
// dele.
const ATIVIDADE_ALERTA_SPACER = 'h-16';

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
    refreshMetas,
    state,
  } = useSessionForm();

  const [metasSheetOpen, setMetasSheetOpen] = useState(false);

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
          {!isEdit && (
            <span className="text-gray-400 font-normal text-xs">
              {' '}
              (mínimo {MIN_RESUMO_LENGTH} caracteres)
            </span>
          )}
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
          minLength={MIN_RESUMO_LENGTH}
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

  // Sessão já atendida: fim do treino de verdade — nem o aviso "interrompa
  // ao atingir 4 tentativas" nem o atalho de complementar metas fazem
  // sentido mais (a sessão já está registrada e é só leitura).
  const isAtendido = classificarStatus(state?.item?.statusEventos) === 'atendido';

  const hasAtividadeAlerta =
    !isAtendido &&
    (!!list.length ||
      !!listPortage.length ||
      !!listVBMapp.length ||
      !!listMaintenance.manual.length ||
      !!listMaintenance.portage.length ||
      !!listMaintenance.vbmapp.length);

  // Toast fixo (não rola com a página — fica sempre visível enquanto tem
  // atividade/protocolo carregado) em vez de um bloco de texto solto no
  // meio do conteúdo, que sumia de vista ao rolar a tela.
  const renderHeaderSession = hasAtividadeAlerta && (
    <div className="fixed top-12 inset-x-0 z-10 flex items-start gap-2 border-l-4 border-red-300 bg-white px-4 py-2.5 shadow-md animate-toast-slide-in">
      <span className="flex shrink-0 items-center justify-center w-5 h-5 rounded-full bg-red-50">
        <i className="pi pi-exclamation-triangle text-red-400 text-[10px]" />
      </span>
      <span className="font-inter text-xs leading-snug text-red-400">
        Interrompa o treino da atividade ao atingir 4 tentativas corretas
        consecutivas.
      </span>
    </div>
  );

  // Fallback pro bottom sheet de "Adicionar metas": deriva quais metas já
  // foram treinadas a partir da própria árvore da sessão — mesma fonte
  // que SessionActivity/SessionPortage/SessionVBMapp usam pra exibir
  // (estado editável se já tiver algo, senão a árvore carregada). Só
  // entra em uso quando o backend não tem mais o "planejamento prévio"
  // (ver useMetasSelection). Memoizado pelas mesmas árvores — não muda a
  // cada render, senão o bottom sheet buscaria de novo à toa.
  const metasFallbackSelection = useMemo(
    () => ({
      manual: extractTrainedSelectionKeys(dtt.length ? dtt : list),
      portage: extractTrainedSelectionKeys(portage.length ? portage : listPortage),
      vbmapp: extractTrainedSelectionKeys(vbmapp.length ? vbmapp : listVBMapp),
    }),
    [dtt, list, portage, listPortage, vbmapp, listVBMapp]
  );

  return (
    <div className="grid overflow-x-hidden bg-background">
      {renderHeaderSession}
      {/* Espaçador do tamanho exato do toast fixo — ele não empurra
          ninguém sozinho (é fixed), então sem isso o cabeçalho (nome do
          paciente) ficava por baixo dele, colado no Nav. */}
      {hasAtividadeAlerta && <div className={ATIVIDADE_ALERTA_SPACER} />}
      {renderHeader()}
      <div className={clsx(!isEdit && 'pb-24')}>
        {/* Opção discreta — não é a ação principal da tela, só um atalho
            pra quem precisa complementar as metas sem sair da Sessão.
            Some quando a sessão já está atendida (fim do treino). */}
        {!isAtendido && (
          <div className="flex justify-end mx-2 mt-2">
            <button
              type="button"
              onClick={() => setMetasSheetOpen(true)}
              className="flex items-center gap-1 text-xs font-inter text-primary"
            >
              <i className="pi pi-plus text-[10px]" />
              Adicionar metas
            </button>
          </div>
        )}
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
      <MetasBottomSheet
        open={metasSheetOpen}
        onClose={() => setMetasSheetOpen(false)}
        paciente={state?.item?.paciente}
        calendarioId={state?.item?.id}
        onSaved={refreshMetas}
        fallbackSelection={metasFallbackSelection}
      />
    </div>
  );
};
