import { useCallback, useEffect, useState } from 'react';
import { Filter } from '../templates/filter';
import { PEIFields } from '../constants/formFields';
import { deleteItem, dropDown, filter } from '../server';
import { useToast } from '../contexts/toast';
import { Card } from '../components/card';
import { NotFound } from '../components/notFound';
import { LoadingHeron } from '../components/loading';
import { useLocation, useNavigate } from 'react-router-dom';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Fieldset } from 'primereact/fieldset';
import { ButtonHeron } from '../components/button';
import { Confirm } from '../components/confirm';
import {
  STATUS_META_COLOR_CLASS,
  STATUS_META_LABEL,
  TIPO_PROTOCOLO,
  VALOR_PORTAGE,
} from '../constants/protocolo';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';
import { gerarRelatorioEvolucao } from '../constants/pdfRelatorioEvolucao';
import { RichTextEditor } from '../components/richTextEditor';

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

  const [tipoProtocolo, setTipoProtocolo] = useState();
  const [pacienteCurrent, setPacienteCurrent] = useState();
  // Programa (grupo) aguardando confirmação de exclusão — null = nenhum
  // diálogo aberto. Excluir aqui apaga TODOS os registros Pei mesclados
  // naquele programa (item.peiIds), não só um; por isso passa por
  // confirmação, diferente da edição.
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<any>(null);
  // Paciente escolhido no filtro, atualizado a cada troca do campo (ver
  // Filter.onPacienteChange) — distinto de `pacienteCurrent`, que só
  // muda depois de "Pesquisar"/"Cadastrar". O botão de Relatório de
  // Evolução precisa aparecer assim que o paciente é selecionado, sem
  // depender do Protocolo também estar escolhido.
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  // Texto livre da terapeuta, digitado na hora — não é um dado do
  // backend (não tem campo pra isso no PEI ainda), só entra no PDF
  // como a última seção do Relatório de Evolução (ver
  // pdfRelatorioEvolucao.ts/desenharCondutaSugerida).
  const [condutaSugerida, setCondutaSugerida] = useState('');

  const handleGerarRelatorioEvolucao = async () => {
    if (!pacienteSelecionado?.id) return;
    setGerandoRelatorio(true);
    try {
      await gerarRelatorioEvolucao(
        pacienteSelecionado,
        condutaSugerida,
        renderToast
      );
    } catch (error) {
      renderToast({
        type: 'failure',
        title: 'Erro!',
        message: 'Não foi possível gerar o relatório de evolução.',
        open: true,
      });
    }
    setGerandoRelatorio(false);
  };

  const handleEditPrograma = (item: any) => {
    navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
      state: {
        edit: true,
        item,
        programa: item.programa,
        tipoProtocolo: TIPO_PROTOCOLO.pei,
      },
    });
  };

  // Edição em nível de protocolo já cobre "salvar" (consolida tudo no
  // registro canônico via peiIds — ver usePeiForm.ts), mas faltava a
  // exclusão do grupo inteiro: apaga cada registro original mesclado
  // naquele programa (item.peiIds — cai pra [item.id] se o backend não
  // mandar essa lista, por segurança).
  const handleRemovePrograma = async (item: any) => {
    setLoading(true);
    try {
      const ids: any[] = item?.peiIds?.length ? item.peiIds : [item.id];
      await Promise.all(ids.map((id: any) => deleteItem(`pei/${id}`)));

      onSubmitFilter({
        pacienteId: state?.pacienteId || pacienteCurrent,
        protocoloId: { id: tipoProtocolo },
      });
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
    setLoading(false);
  };

  const renderFiledSet = (title: string, text: string) => (
    <Fieldset className="text-[8px]">
      <div className="font-bold text-wrap"> {title} </div>
      <div className="font-normal text-wrap"> {text}</div>
    </Fieldset>
  );

  const renderHeader = (item: any) => {
    return (
      <>
        {
          <div className="font-bold my-2">
            {' '}
            {item.procedimentoEnsino?.nome || ''}
          </div>
        }

        <div className=" grid grid-cols-3 gap-1">
          {item.estimuloDiscriminativo &&
            renderFiledSet(
              'SD (estímulo discriminativo)',
              item.estimuloDiscriminativo
            )}
          {item.resposta && renderFiledSet('Resposta', item.resposta)}
          {item.estimuloReforcadorPositivo &&
            renderFiledSet(
              'SR+ (estímulo reforçador positivo)',
              item.estimuloReforcadorPositivo
            )}
        </div>
      </>
    );
  };

  // status/observação: campos novos, ainda pendentes de confirmação do
  // backend (ver docs/pedido-backend-formatacao.md) — meta.status só
  // aparece aqui quando o backend já estiver mandando de volta o que foi
  // salvo em onSubmit (usePeiForm.ts). Sem isso, o app simplesmente não
  // mostra rótulo nenhum, igual a maioria das metas no relatório de
  // referência que ainda não tem status marcado.
  const renderMetaItem = (meta: any, indexMeta: number) => (
    <div key={meta?.id ?? indexMeta}>
      <span className="flex align-items-center gap-2 w-full font-inter">
        Meta {indexMeta + 1}: {meta.value}
        {meta.status && (
          <span
            className={clsx(
              'font-semibold',
              STATUS_META_COLOR_CLASS[meta.status]
            )}
          >
            {STATUS_META_LABEL[meta.status]}
          </span>
        )}
      </span>
      {meta.observacao && (
        <p className="text-xs text-gray-400 italic mt-0.5">
          {meta.observacao}
        </p>
      )}
      <ul className="list-disc ml-8 font-inter">
        {meta.subitems &&
          meta.subitems.map((subitem: any, index: number) => (
            <li key={subitem?.id ?? index}> {subitem.value} </li>
          ))}
      </ul>
    </div>
  );

  // Manual (pei): procedimento/estímulos vivem no nível do PROGRAMA
  // (item), não por meta — o backend mescla vários registros Pei num
  // programa só (ver PeiService.agruparPeiPorPrograma/mesclarMetas no
  // heron-list-nest), mas só o primeiro registro mesclado empresta
  // esses campos pro grupo inteiro; nenhuma meta individual carrega
  // procedimentoEnsino/SD/Resposta/SR+ de verdade. Um card só por
  // programa, com o cabeçalho uma vez e todas as metas dele dentro.
  const renderMetasManual = (item: any) => (
    <div className="my-2">
      <div className="rounded-lg border border-gray-200 p-3">
        {renderHeader(item)}
        {(item.metas || []).map((meta: any, indexMeta: number) =>
          renderMetaItem(meta, indexMeta)
        )}
      </div>
    </div>
  );

  const renderMetasOutroProtocolo = (metas: any[]) => (
    <div className="my-2">
      {(metas || []).map((meta: any, indexMeta: number) => (
        <div
          key={meta?.id ?? indexMeta}
          className={meta?.procedimentoEnsino && 'mb-8'}
        >
          {tipoProtocolo === TIPO_PROTOCOLO.portage && renderHeader(meta)}
          {renderMetaItem(meta, indexMeta)}
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (!loading) {
      return list.length ? (
        <Card>
          <Accordion>
            {list.map((item: any, key: number) => {
              const isManual = tipoProtocolo === TIPO_PROTOCOLO.pei;

              return (
                <AccordionTab
                  key={item?.id ?? key}
                  header={
                    <div className="flex items-center w-full gap-1">
                      <span>{item.programa.nome}</span>

                      {/* Protocolo Manual: um item da lista já é o programa
                          inteiro (backend mescla todas as metas dos
                          registros daquele programa — ver
                          PeiService.agruparPeiPorPrograma). Editar abre o
                          formulário com o grupo completo; salvar consolida
                          tudo no registro canônico (peiIds). Excluir apaga
                          todos os registros mesclados nesse programa de
                          uma vez (peiIds), por isso pede confirmação. */}
                      {isManual && (
                        <div className="ml-auto flex items-center">
                          <ButtonHeron
                            text="editar"
                            type="transparent"
                            size="icon"
                            icon="pi pi-pencil"
                            color="violet"
                            onClick={() => handleEditPrograma(item)}
                            loading={loading}
                          />
                          <ButtonHeron
                            text="remove"
                            type="transparent"
                            size="icon"
                            icon="pi pi-trash"
                            color="red"
                            onClick={() => setConfirmDeleteItem(item)}
                            loading={loading}
                          />
                        </div>
                      )}
                    </div>
                  }
                  tabIndex={key}
                >
                  <div className="w-full overflow-y-auto">
                    {tipoProtocolo === TIPO_PROTOCOLO.vbMapp &&
                      renderHeader(item)}
                    {isManual
                      ? renderMetasManual(item)
                      : renderMetasOutroProtocolo(item.metas)}
                  </div>
                </AccordionTab>
              );
            })}
          </Accordion>
        </Card>
      ) : (
        <Card>
          {' '}
          <NotFound />{' '}
        </Card>
      );
    } else {
      return <LoadingHeron />;
    }
  };

  const onSubmitFilter = async ({ pacienteId, protocoloId }: any) => {
    if (!protocoloId) return;

    setLoading(true);

    protocoloId && setTipoProtocolo(protocoloId.id);
    pacienteId && setPacienteCurrent(pacienteId);

    try {
      const { data }: any = await filter('pei', {
        paciente: pacienteId,
        protocoloId: protocoloId,
        notSelected: [VALOR_PORTAGE.sim],
      });

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
    setLoading(false);
  };

  const renderFilter = () => {
    return (
      <Filter
        id="form-filter-pei"
        legend="Filtro"
        nameButton="Cadastrar"
        fields={fieldsConst}
        dropdown={dropDownList}
        onSubmit={(value) => onSubmitFilter(value)}
        onReset={() => setList([])}
        screen="PEI"
        loading={loading}
        onInclude={() => {
          navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
            state: {
              edit: false,
              pacienteId: state?.pacienteId || pacienteCurrent,
              tipoProtocolo,
            },
          });
        }}
        onPacienteChange={setPacienteSelecionado}
        defaultValues={state}
      />
    );
  };

  // Aparece assim que um paciente é escolhido no filtro (não depende do
  // Protocolo, já que o relatório unifica Portage + VB-MAPP + Manual —
  // os 3 protocolos ao mesmo tempo, não só o que estiver selecionado no
  // dropdown). Antes o botão "Gerar Relatório" e o campo "Conduta
  // Sugerida" apareciam soltos, um embaixo do outro, sem nenhum
  // agrupamento visual — ficava fácil confundir com parte do próprio
  // filtro acima (mesma cor do botão "Cadastrar") e o editor de texto
  // grande (220px) dominava a tela antes de qualquer conteúdo do PEI
  // aparecer. Agora é um bloco só, com cabeçalho próprio (título +
  // explicação do que o relatório reúne) e nessa ordem: primeiro o
  // campo opcional, o botão por último — como uma ação que "finaliza"
  // o que foi escrito acima, não como o primeiro clique da tela.
  const renderRelatorioEvolucao = () =>
    pacienteSelecionado?.id && (
      <Card className="mx-2 my-3 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <i className="pi pi-file-pdf text-violet-800" />
          <span className="text-gray-800 font-inter font-bold leading-4">
            Relatório de Evolução
          </span>
        </div>
        <p className="font-inter text-xs text-gray-400 mt-1 mb-3">
          Reúne Portage, VB-MAPP e Manual num PDF só.
        </p>

        <div className="text-gray-800 font-inter text-sm font-semibold mb-1">
          Conduta Sugerida{' '}
          <span className="text-gray-400 font-normal text-xs">
            (opcional)
          </span>
        </div>
        <div className="rounded-lg w-full border border-gray-300 mb-3">
          <RichTextEditor
            value={condutaSugerida}
            placeholder="Descreva a conduta sugerida para o paciente."
            onBlur={(newContent) => setCondutaSugerida(newContent)}
            compact
          />
        </div>

        {/* Mesmo estilo do botão "Gerar Relatório" do Protocolo de
            Avaliação (Portage.tsx/VBMapp.tsx: renderExport) — primary,
            full width, ícone pi-file-pdf — pra ficar consistente entre
            as telas que exportam PDF de protocolo. */}
        <ButtonHeron
          text="Gerar Relatório"
          type="primary"
          size="full"
          icon="pi pi-file-pdf"
          typeButton="button"
          onClick={handleGerarRelatorioEvolucao}
          loading={gerandoRelatorio}
        />
      </Card>
    );

  const renderPrograma = useCallback(async () => {
    const [paciente, protocolo]: any = await Promise.all([
      dropDown('paciente'),
      dropDown('protocolo'),
    ]);

    setDropDownList({
      paciente,
      protocolo,
    });

    if (state) {
      onSubmitFilter(state);
    }
  }, []);

  useEffect(() => {
    renderPrograma();
  }, []);

  return (
    <div>
      {renderFilter()}
      {renderRelatorioEvolucao()}
      {renderContent()}
      <Confirm
        open={!!confirmDeleteItem}
        title="Excluir programa"
        message={`Excluir todos os registros de "${confirmDeleteItem?.programa?.nome}"? Essa ação não pode ser desfeita.`}
        icon="pi pi-trash"
        acceptLabel="Excluir"
        rejectLabel="Cancelar"
        onAccept={() => {
          const item = confirmDeleteItem;
          setConfirmDeleteItem(null);
          handleRemovePrograma(item);
        }}
        onReject={() => setConfirmDeleteItem(null)}
        onClose={() => setConfirmDeleteItem(null)}
      />
    </div>
  );
};

export default PEI;
