import { useCallback, useEffect, useState } from 'react';
import { api, dropDown, filter } from '../server';
import { useToast } from '../contexts/toast';
import { permissionAuth } from '../contexts/permission';
import { LoadingHeron } from '../components/loading';
import { useLocation, useNavigate } from 'react-router-dom';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { Input } from '../components';
import { BottomSheet } from '../components/bottomSheet';
import { TIPO_PROTOCOLO } from '../constants/protocolo';
import { useForm } from 'react-hook-form';
import { gerarRelatorioEvolucao } from '../constants/pdfRelatorioEvolucao';
import { RichTextEditor } from '../components/richTextEditor';
import { Segmentado } from '../foms/protocolo/avaliacao';
import { TabelaPortage } from './pei/TabelaPortage';
import { TabelaVBMapp } from './pei/TabelaVBMapp';
import { ProgramaPeiCard } from './pei/ProgramaPeiCard';
import {
  PendentesAvaliacao,
  ResultadoPortage,
  agruparPendentes,
} from './pei/ResultadoAvaliacao';

// Mesmas permissões dos campos do Filter de antes (PEIFields).
const PERMISSAO_PACIENTE = 'PEI_FILTRO_BOTAO_CADASTRAR';
const PERMISSAO_PROTOCOLO = 'PEI_FILTRO_SELECT_PROTOCOLO';
const PERMISSAO_CADASTRAR = 'PEI_FILTRO_BOTAO_CADASTRAR';

// Ordem fixa no seletor, pelo `codigo` estável de protocolo/dropdown.
const ORDEM_PROTOCOLO = ['portage', 'vbmapp', 'pei'];
const ROTULO_PROTOCOLO: Record<string, string> = {
  portage: 'Portage',
  vbmapp: 'VB-MAPP',
  pei: 'Manual',
};

const iniciais = (nome = '') => {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return `${partes[0][0]}${ultima}`.toUpperCase();
};

const PEI = () => {
  const { renderToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;

  const { hasPermition } = permissionAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>([]);
  const [list, setList] = useState({}) as any;
  // Já buscou com o protocolo atual — distingue "ainda não escolheu" de
  // "não tem nada".
  const [buscou, setBuscou] = useState(false);
  const [aberto, setAberto] = useState<number | null>(null);
  const [trocandoPaciente, setTrocandoPaciente] = useState(false);
  const [relatorioAberto, setRelatorioAberto] = useState(false);

  // Paciente e protocolo no topo da tela (antes, o Filter com dropdowns
  // e botões só de ícone). Vem pré-preenchido quando o cadastro/edição
  // navega de volta pra cá com { pacienteId, protocoloId }.
  const { control, watch, setValue } = useForm<any>({
    defaultValues: {
      pacienteId: state?.pacienteId ?? null,
      protocoloId: state?.protocoloId ?? null,
    },
  });
  const pacienteForm = watch('pacienteId');
  const protocoloForm = watch('protocoloId');

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
  // `tabelaComparativa` de POST /pei/filtro (item 13 do
  // heron-list-nest/docs/pedido-frontend-fase2.md) — vem na mesma
  // resposta dos itens, já no formato pronto de Portage (item 17) ou
  // VB-MAPP (item 19), e null pro Manual. Alimenta a tabela comparativa
  // (TabelaPortage/TabelaVBMapp) logo acima da árvore de itens.
  const [tabelaProtocolo, setTabelaProtocolo] = useState<any>(null);

  const handleGerarRelatorioEvolucao = async () => {
    if (!pacienteSelecionado?.id) return;
    setGerandoRelatorio(true);
    try {
      // PUT /paciente/:id/relatorio-evolucao sobrescreve a conduta salva —
      // editor vazio manda `undefined` (não persiste nada) em vez de apagar
      // a conduta que já estava no banco.
      const condutaPreenchida = condutaSugerida.replace(/<[^>]*>/g, '').trim();
      await gerarRelatorioEvolucao(
        pacienteSelecionado,
        condutaPreenchida ? condutaSugerida : undefined,
        renderToast
      );
      setRelatorioAberto(false);
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
  // registro canônico via peiIds — ver usePeiForm.ts); aqui é a exclusão
  // do grupo inteiro. DELETE /pei em lote (item 11 do
  // pedido-frontend-fase2.md): uma requisição só com todos os peiIds
  // mesclados no programa (sempre presentes — item 15), e com pacienteId
  // o backend já devolve a lista do Manual atualizada, sem refazer a
  // busca. `deleteItem` de server/index.ts não manda body, por isso o
  // `api.delete` direto.
  const handleRemovePrograma = async (item: any) => {
    setLoading(true);
    try {
      const paciente: any = state?.pacienteId || pacienteCurrent;
      const { data }: any = await api.delete('pei', {
        data: { peiIds: item.peiIds, pacienteId: paciente?.id },
      });

      setList(data || []);
      setAberto(null);
      renderToast({
        type: 'success',
        title: 'Sucesso!',
        message: 'Programa excluído.',
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

  // Tabela comparativa por sessão, igual à do Relatório de Evolução em
  // PDF (ver constants/pdfRelatorioEvolucao.ts/desenharPortage e
  // desenharVBMapp).
  const renderTabelaProtocolo = () => {
    if (!tabelaProtocolo) return null;
    if (tipoProtocolo === TIPO_PROTOCOLO.portage) {
      return <TabelaPortage data={tabelaProtocolo} />;
    }
    if (tipoProtocolo === TIPO_PROTOCOLO.vbMapp) {
      return <TabelaVBMapp dados={tabelaProtocolo} />;
    }
    return null;
  };

  const onSubmitFilter = async ({ pacienteId, protocoloId }: any) => {
    if (!protocoloId) return;

    setLoading(true);
    setAberto(null);

    protocoloId && setTipoProtocolo(protocoloId.id);
    pacienteId && setPacienteCurrent(pacienteId);

    // Uma chamada só (item 13 do pedido-frontend-fase2.md): com
    // `comTabelaComparativa`, /pei/filtro devolve { itens,
    // tabelaComparativa } — a tabela do Portage/VB-MAPP vem junto e o
    // Manual vem com null, então a tela não escolhe mais rota por id de
    // protocolo. `pendentes` (item 14) é o jeito semântico de pedir só
    // os itens ainda não atingidos, sem o front conhecer a escala
    // '1'/'0.5'/'0'. Em erro, limpa as duas coisas — senão a tabela de
    // uma busca anterior ficaria presa na tela.
    try {
      const { data }: any = await filter('pei', {
        paciente: pacienteId,
        protocoloId: protocoloId,
        pendentes: true,
        comTabelaComparativa: true,
      });

      setList(data?.itens || []);
      setTabelaProtocolo(data?.tabelaComparativa || null);
    } catch (error) {
      setList([]);
      setTabelaProtocolo(null);
      renderToast({
        type: 'failure',
        title: '401',
        message: 'PEI não encontrado!',
        open: true,
      });
    }

    setBuscou(true);
    setLoading(false);
  };

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

  // O Relatório de Evolução depende só do paciente (junta os 3
  // protocolos), não do protocolo escolhido.
  useEffect(() => {
    setPacienteSelecionado(pacienteForm?.id ? pacienteForm : null);
  }, [pacienteForm]);

  // Escolher já busca — sem o "Pesquisar" (funil sem rótulo) de antes.
  const buscar = (paciente: any, protocolo: any) => {
    if (protocolo?.id) onSubmitFilter({ pacienteId: paciente, protocoloId: protocolo });
  };

  const podePaciente = hasPermition(PERMISSAO_PACIENTE);
  const podeProtocolo = hasPermition(PERMISSAO_PROTOCOLO);
  const temPaciente = Boolean(pacienteForm?.id);
  const protocolos = ORDEM_PROTOCOLO.map((codigo) =>
    (dropDownList.protocolo || []).find((p: any) => p?.codigo === codigo)
  ).filter(Boolean);
  const isManual = tipoProtocolo === TIPO_PROTOCOLO.pei;
  // Sem protocolo escolhido, abre no Manual (o PEI em si) — como no
  // protótipo; Portage/VB-MAPP ficam a um toque no seletor.
  const protocoloPadrao = protocolos.find((p: any) => p.codigo === 'pei');
  const protocoloEfetivo = (p: any) => (p?.id ? p : protocoloPadrao);

  // Sem permissão de escolher paciente não há troca de paciente pra
  // disparar a busca — abre direto no Manual quando os protocolos chegam.
  useEffect(() => {
    if (!protocoloPadrao || protocoloForm?.id || podePaciente || state?.protocoloId) return;
    setValue('protocoloId', protocoloPadrao);
    buscar(pacienteForm, protocoloPadrao);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocoloPadrao?.id]);
  const nomeProtocolo =
    ROTULO_PROTOCOLO[protocoloForm?.codigo] || protocoloForm?.nome || '';

  const seletorPaciente = (
    <Input
      labelText="Paciente"
      id="pacienteId"
      type="select"
      customCol="col-span-6"
      control={control}
      options={dropDownList.paciente}
      onChange={(valor) => {
        if (!valor?.id) return;
        setTrocandoPaciente(false);
        const protocolo = protocoloEfetivo(protocoloForm);
        if (protocolo && !protocoloForm?.id) setValue('protocoloId', protocolo);
        buscar(valor, protocolo);
      }}
    />
  );

  const seletorProtocolo = podeProtocolo && protocolos.length > 0 && (
    <Segmentado
      rotulo="Protocolo"
      variante="forte"
      opcoes={protocolos.map((p: any) => ({
        valor: p.codigo as string,
        label: ROTULO_PROTOCOLO[p.codigo] || p.nome,
      }))}
      valor={protocoloForm?.codigo || ''}
      onChange={(codigo) => {
        const protocolo = protocolos.find((p: any) => p.codigo === codigo);
        setValue('protocoloId', protocolo);
        buscar(pacienteForm, protocolo);
      }}
    />
  );

  const renderTopo = () => {
    if (podePaciente && (!temPaciente || trocandoPaciente)) {
      return (
        <section className="bg-white border border-gray-200 rounded-[14px] px-4 pt-5 pb-4 flex flex-col gap-2">
          {!temPaciente && (
            <div className="flex flex-col gap-1.5">
              <h2 className="m-0 text-[18px] font-bold text-[#27272a]">De quem é o PEI?</h2>
              <p className="m-0 text-[14px] leading-[1.45] text-gray-800">
                Escolha o paciente para ver os programas, as metas e gerar o
                Relatório de Evolução.
              </p>
            </div>
          )}
          {seletorPaciente}
          {temPaciente && (
            <button
              type="button"
              onClick={() => setTrocandoPaciente(false)}
              className="self-end h-11 px-3 rounded-[10px] text-[14px] font-bold text-primary"
            >
              Cancelar
            </button>
          )}
        </section>
      );
    }

    return (
      <section className="bg-white border border-gray-200 rounded-[14px] pt-3 pb-3.5 pl-3.5 pr-2 flex flex-col gap-3">
        {temPaciente && (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 shrink-0 rounded-full bg-[#f3e8f7] text-primary flex items-center justify-center text-[15px] font-bold">
              {iniciais(pacienteForm?.nome)}
            </div>
            <span className="flex-1 min-w-0 text-[16px] font-bold text-[#27272a] truncate">
              {pacienteForm?.nome}
            </span>
            {podePaciente && (
              <button
                type="button"
                onClick={() => setTrocandoPaciente(true)}
                className="h-11 px-3 rounded-[10px] text-[14px] font-bold text-primary"
              >
                Trocar
              </button>
            )}
          </div>
        )}
        {seletorProtocolo && <div className="mr-1.5">{seletorProtocolo}</div>}
      </section>
    );
  };

  // Uma linha que abre o sheet com a conduta + "Gerar PDF" — antes era um
  // bloco com editor de texto grande que dominava a tela antes de
  // qualquer programa aparecer.
  const renderLinhaRelatorio = () =>
    pacienteSelecionado?.id && !trocandoPaciente && (
      <button
        type="button"
        onClick={() => setRelatorioAberto(true)}
        className="min-h-[64px] flex items-center gap-3 px-3.5 py-3 rounded-[14px] border border-gray-200 bg-white text-left"
      >
        <span className="w-10 h-10 shrink-0 rounded-xl bg-[#f3e8f7] text-primary flex items-center justify-center">
          <i className="pi pi-file-pdf" />
        </span>
        <span className="flex-1 flex flex-col gap-0.5">
          <span className="text-[15px] font-bold text-[#27272a]">Relatório de Evolução</span>
          <span className="text-[13px] text-gray-800">Portage, VB-MAPP e Manual num PDF só</span>
        </span>
        <i className="pi pi-chevron-right text-primary text-[13px]" />
      </button>
    );

  const novoPrograma = () =>
    navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
      state: {
        edit: false,
        pacienteId: state?.pacienteId || pacienteCurrent || pacienteForm,
        tipoProtocolo,
      },
    });

  // Atalho do "Em aquisição" pro Protocolo de Avaliação, já no paciente e
  // no protocolo (Protocolo.tsx lê pacienteId/tipoProtocolo do state).
  const avaliar = () =>
    navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
      state: { pacienteId: pacienteForm, tipoProtocolo },
    });

  const renderLista = () => {
    if (trocandoPaciente) return null;
    if (!protocoloForm?.id) {
      return (
        (temPaciente || !podePaciente) && (
          <p className="m-0 px-1 text-[14px] text-gray-800">
            Escolha o protocolo acima para ver os programas.
          </p>
        )
      );
    }
    if (loading) return <LoadingHeron />;
    if (!buscou) return null;

    const itens: any[] = Array.isArray(list) ? list : [];
    const tabela = renderTabelaProtocolo();
    const pendentes = isManual ? [] : agruparPendentes(itens);

    return (
      <>
        {/* A tabela não depende de `list` ter itens — /pei/filtro com
            `pendentes` só traz itens ainda não atingidos, então um
            protocolo inteiramente concluído pode ter lista vazia e a
            tabela com dado normal. */}
        {tabela && (
          <section className="bg-white border border-gray-200 rounded-[14px] p-3.5 flex flex-col gap-3">
            <h2 className="m-0 text-[15px] font-bold text-[#27272a]">
              Resultado do {nomeProtocolo}
            </h2>
            {tipoProtocolo === TIPO_PROTOCOLO.portage ? (
              <ResultadoPortage dados={tabelaProtocolo} />
            ) : (
              <div className="-mx-2">{tabela}</div>
            )}
          </section>
        )}

        <div className="flex justify-between items-center gap-2 px-1 pt-1.5">
          <h2 className="m-0 text-[13px] font-bold tracking-[0.08em] text-gray-800">
            {isManual ? 'PROGRAMAS' : 'EM AQUISIÇÃO'} ·{' '}
            {isManual ? itens.length : pendentes.reduce((n, g) => n + g.metas.length, 0)}
          </h2>
          {!isManual && itens.length > 0 && (
            <button
              type="button"
              onClick={avaliar}
              className="h-9 px-2 text-[13px] font-bold text-primary"
            >
              Avaliar
            </button>
          )}
          {isManual && hasPermition(PERMISSAO_CADASTRAR) && (
            <button
              type="button"
              onClick={novoPrograma}
              className="h-9 flex items-center gap-1.5 px-3 rounded-[10px] bg-primary text-white text-[13px] font-bold"
            >
              <i className="pi pi-plus text-[11px]" />
              Novo programa
            </button>
          )}
        </div>

        {!itens.length && (
          <p className="m-0 px-1 text-[14px] text-gray-800">
            {isManual
              ? 'Nenhum programa cadastrado para este paciente.'
              : 'Nenhum item em aquisição.'}
          </p>
        )}

        {!isManual && <PendentesAvaliacao grupos={pendentes} />}

        {isManual && itens.map((item: any, key: number) => (
          <ProgramaPeiCard
            key={item?.id ?? key}
            item={item}
            open={aberto === key}
            onToggle={() => setAberto(aberto === key ? null : key)}
            colunasPorMeta={tipoProtocolo === TIPO_PROTOCOLO.portage}
            // Manual: um item já é o programa inteiro (backend mescla os
            // registros daquele programa — PeiService.agruparPeiPorPrograma);
            // editar abre o grupo completo, excluir apaga todos (peiIds).
            onEditar={isManual ? () => handleEditPrograma(item) : undefined}
            onExcluir={isManual ? () => setConfirmDeleteItem(item) : undefined}
          />
        ))}
      </>
    );
  };

  return (
    // Espaço pra tab bar do rodapé já é reservado no LayoutDefault.
    <div className="mt-2 flex flex-col gap-3">
      {renderTopo()}
      {renderLinhaRelatorio()}
      {renderLista()}

      <BottomSheet
        open={relatorioAberto}
        onClose={() => setRelatorioAberto(false)}
        titulo="Relatório de Evolução"
        descricao={`Reúne Portage, VB-MAPP e Manual de ${pacienteSelecionado?.nome ?? 'paciente'} num PDF só.`}
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-[#3f3f46]">
            Conduta sugerida{' '}
            <span className="font-medium text-[#71717a]">
              (opcional, entra como última seção do PDF)
            </span>
          </span>
          <div className="rounded-lg w-full border border-gray-300">
            <RichTextEditor
              value={condutaSugerida}
              placeholder="Descreva a conduta sugerida para o paciente."
              onBlur={(newContent) => setCondutaSugerida(newContent)}
              compact
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleGerarRelatorioEvolucao}
          disabled={gerandoRelatorio}
          className="h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-[15px] font-bold disabled:opacity-60"
        >
          <i className="pi pi-file-pdf" />
          {gerandoRelatorio ? 'Gerando…' : 'Gerar PDF'}
        </button>
      </BottomSheet>

      <BottomSheet
        open={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        titulo={`Excluir “${confirmDeleteItem?.programa?.nome ?? ''}”?`}
        descricao="Apaga o programa e todas as metas dele. Essa ação não pode ser desfeita."
      >
        <button
          type="button"
          onClick={() => {
            const item = confirmDeleteItem;
            setConfirmDeleteItem(null);
            handleRemovePrograma(item);
          }}
          className="h-12 rounded-xl bg-[#b91c1c] text-white text-[15px] font-bold"
        >
          Excluir programa
        </button>
        <button
          type="button"
          onClick={() => setConfirmDeleteItem(null)}
          className="h-12 rounded-xl border border-gray-300 bg-white text-[15px] font-bold text-[#27272a]"
        >
          Cancelar
        </button>
      </BottomSheet>
    </div>
  );
};

export default PEI;
