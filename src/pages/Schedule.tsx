import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import moment from 'moment';
import { Sidebar } from 'primereact/sidebar';
import { formatdateeua, firtUpperCase } from '../util/util';
import { useAuth } from '../contexts/auth';
import { getList } from '../server';
import { ButtonHeron, Card } from '../components';
import { LoadingHeron } from '../components/loading';
import { NotFound } from '../components/notFound';
import { useToast } from '../contexts/toast';
import { useNavigate } from 'react-router-dom';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { ChoiceItemSchedule } from '../components/choiceItemSchedule';
import { isSlotLivre } from '../util/evento';

type ViewMode = 'dia' | 'semana' | 'mes' | 'periodo';

// Formato de /evento/filtro com ?agrupado=true — dias já ordenados e
// contagens prontas (item 9 de heron-list-nest/docs/pedido-frontend-fase2.md).
type AgendaAgrupada = {
  totalSessoes: number;
  dias: { data: string; totalSessoes: number; itens: any[] }[];
};

const AGENDA_VAZIA: AgendaAgrupada = { totalSessoes: 0, dias: [] };

// sem domingo — não é dia de trabalho, então não faz sentido oferecer
// como atalho de navegação na tira de dias
const DIAS_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

// segunda-feira da semana que contém `date` — só pra montar a tira de
// navegação (seg-sáb); o intervalo de busca quem resolve é o backend.
const getInicioSemana = (date: Date) =>
  moment(date).startOf('isoWeek').toDate();

export const Schedule = () => {
  const { renderToast } = useToast();
  const navigate = useNavigate();

  const [agenda, setAgenda] = useState<AgendaAgrupada>(AGENDA_VAZIA);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('dia');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // filtro de período customizado (aba "Período" -> bottom sheet)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { user } = useAuth();

  // async function handleSubmitCheckEvent(item: any) {
  //   try {
  //     await update('/evento/check', {id: item.id});

  //     renderToast({
  //       type: 'success',
  //       title: '',
  //       message: 'Evento atualizado!',
  //       open: true,
  //     });

  //     setTimeout(() => {
  //       getDayTerapeuta()
  //     }, 1000);

  //   } catch (error) {
  //     renderToast({
  //       type: 'failure',
  //       title: '401',
  //       message: 'Evento não atualizado!',
  //       open: true,
  //     });
  //   }
  // }

  const handleButtonDTTClick = (e: any, item: any) => {
    e.stopPropagation();
    navigate(`/${CONSTANTES_ROUTERS.METAS}`, { state: item });
  };

  const getDayTerapeuta = async (url: string) => {
    setLoading(true);
    try {
      const response: any = await getList(url);
      setAgenda(response || AGENDA_VAZIA);
    } catch (error) {
      setAgenda(AGENDA_VAZIA);
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Período não encontrado!',
        open: true,
      });
    }
    setLoading(false);
  };

  // Intervalo de busca conforme a aba ativa (dia/semana/mês/período),
  // sempre ancorado em `selectedDate` — assim trocar de aba mantém o
  // contexto do dia que a terapeuta estava olhando. "período" é a exceção:
  // usa o intervalo customizado escolhido no bottom sheet.
  //
  // dia/semana/mês: o front manda só `modo` + a data de referência e o
  // backend resolve o intervalo (semana ISO, início/fim do mês) — item 10
  // de heron-list-nest/docs/pedido-frontend-fase2.md. Antes o cálculo
  // morava aqui e já tinha gerado bug de "último dia sumindo" por
  // depender de o filtro ser inclusivo nas duas pontas.
  // `agrupado=true` (item 9): a resposta já vem em dias ordenados com as
  // contagens prontas.
  const buscarPeriodo = (mode: ViewMode, date: Date) => {
    if (mode === 'periodo') {
      if (!customStart || !customEnd) return; // ainda não aplicou nada no sheet
      return getDayTerapeuta(
        `/evento/filtro/${customStart}/${customEnd}?terapeutaId=${user.id}&agrupado=true`
      );
    }
    return getDayTerapeuta(
      `/evento/filtro?modo=${mode}&data=${formatdateeua(date)}&terapeutaId=${user.id}&agrupado=true`
    );
  };

  // "período" fica de fora daqui de propósito: ele só busca quando o
  // usuário clica em "Aplicar" (handleAplicarPeriodo), nunca reativamente.
  // Se customStart/customEnd entrassem nessas deps, cada letra digitada
  // nos campos de data já disparava uma busca sozinha, antes mesmo do
  // clique em Aplicar.
  useEffect(() => {
    if (viewMode === 'periodo') return;
    buscarPeriodo(viewMode, selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedDate]);

  const handleAplicarPeriodo = () => {
    if (!customStart || !customEnd) return;
    setViewMode('periodo');
    setSheetOpen(false);
    buscarPeriodo('periodo', selectedDate);
  };

  const cardFree = (item: any) => {
    return (
      <Card key={item.id} type="free">
        <div className="flex gap-2 w-full item-center">
          <div className="grid text-center font-inter text-sm text-gray-400">
            <span> {item.start}</span> -<span>{item.end}</span>
          </div>
          <div className="text-gray-800 text-center flex items-center justify-center text-md">
            {' '}
            {item.title}
          </div>
        </div>
      </Card>
    );
  };

  const cardChoice = (item: any) => {
    // Decisões do card vêm prontas do backend (item 7 de
    // heron-list-nest/docs/pedido-frontend-fase2.md):
    // - podeAbrirSessao: já embute a exceção "sessão atendida sempre abre
    //   em leitura" sobre sessaoBloqueada;
    // - podeEditarMetas: sessão ainda não atendida e cujo status permite
    //   atendimento.
    const podeAcessar = item?.podeAbrirSessao === true;
    const mostrarBotaoMetas = item?.podeEditarMetas === true;

    // Rótulos: `isAttended` vem do backend. "Não Atendido" (dia já passou
    // e não foi atendida) ainda é derivado aqui — o backend não manda um
    // campo de situação pra isso; é só rótulo, não decide acesso.
    const isRealizada = item?.isAttended === true;
    const isPast = moment()
      .startOf('day')
      .isAfter(moment(item?.date).startOf('day'));
    const naoAtendido = isPast && !isRealizada;

    return (
      <Card
        key={item.id}
        // Prefere o código estável que o backend manda (ex.: "TO",
        // "FONO"); sem ele, useBorderColorClass cai no matching por
        // substring do nome livre.
        type={item?.especialidade?.codigo || item.especialidade.nome}
        onClick={() =>
          podeAcessar &&
          // sem `state`: a tela de Sessão carrega tudo (evento incluso)
          // por GET /sessao/calendario/:id a partir do id na rota
          navigate(`/${CONSTANTES_ROUTERS.SESSION}/${item.id}`)
        }
      >
        <div className="flex items-center">
          <ChoiceItemSchedule
            start={item?.data?.start}
            end={item?.data?.end}
            statusEventos={item?.statusEventos}
            title={item?.title}
            localExibicao={item?.localExibicao}
            modalidade={item?.modalidadeExibicao}
          />
          {mostrarBotaoMetas && (
            <ButtonHeron
              text="Pesquisar"
              icon="pi pi-file-edit"
              type="primary"
              size="icon"
              loading={loading}
              onClick={(event: any) => handleButtonDTTClick(event, item)}
            />
          )}

          {isRealizada && (
            <ButtonHeron
              text="Atendido"
              type="transparent"
              icon="pi pi-check"
              size="icon"
              color="violet"
            />
          )}

          {naoAtendido && (
            <>
              <label htmlFor="" className="font-inter text-sm text-gray-400">
                {' '}
                Não Atendido{' '}
              </label>
              <ButtonHeron
                text="Não Atendido"
                type="transparent"
                icon="pi pi-times"
                size="icon"
                color="red"
              />
            </>
          )}

          {/* Indica que o item é clicável — some quando o card está
              bloqueado (sessão futura fora do dia, tipo que não registra
              sessão, etc.), já que aí o onClick não faz nada mesmo. */}
          {podeAcessar && (
            <i className="pi pi-chevron-right text-gray-400 text-xs ml-1" />
          )}
        </div>
      </Card>
    );
  };

  const formatItem = (item: any) =>
    isSlotLivre(item) ? cardFree(item) : cardChoice(item);

  // total do período já contado pelo backend (item 9)
  const totalSessoesPeriodo = agenda.totalSessoes ?? 0;
  const dias = agenda.dias ?? [];

  const rotuloPeriodo =
    viewMode === 'dia'
      ? 'hoje'
      : viewMode === 'semana'
      ? 'nesta semana'
      : viewMode === 'mes'
      ? 'neste mês'
      : 'no período selecionado';

  const renderContent = () => {
    if (!loading) {
      return dias.length ? (
        dias.map((dia) => {
          const total = dia.totalSessoes;
          const dataMoment = moment(dia.data);
          return (
            <div key={dia.data}>
              <div className="flex items-center justify-between mx-2 mt-6 mb-2">
                <span className="font-inter font-bold text-gray-800">
                  {firtUpperCase(dataMoment.format('dddd'))}, {dataMoment.format('DD/MM')}
                </span>
                {total > 0 && (
                  <span className="text-xs font-inter font-semibold text-white bg-violet-800 rounded-full px-2 py-0.5 leading-4">
                    {total} {total === 1 ? 'sessão' : 'sessões'}
                  </span>
                )}
              </div>
              {dia.itens.map((item: any) => formatItem(item))}
            </div>
          );
        })
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

  const renderTabs = (
    <div className="mx-2 bg-gray-200 rounded-full p-1 flex gap-1">
      {(['dia', 'semana', 'mes'] as ViewMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => {
            setViewMode(mode);
            if (mode === 'dia') setSelectedDate(new Date());
          }}
          className={clsx(
            'flex-1 text-center rounded-full py-2 text-sm font-inter font-semibold min-h-[40px]',
            viewMode === mode
              ? 'bg-primary text-primary-text'
              : 'text-gray-800'
          )}
        >
          {mode === 'dia' ? 'Hoje' : mode === 'semana' ? 'Semana' : 'Mês'}
        </button>
      ))}
      {/* "Período": não troca de aba na hora — abre o bottom sheet pra
          escolher data inicial/final, e só vira a aba ativa quando o
          usuário aplicar um intervalo. Clicar de novo com "período" já
          ativo reabre o sheet pra ajustar o intervalo. */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className={clsx(
          'flex-1 flex items-center justify-center gap-1 text-center rounded-full py-2 text-sm font-inter font-semibold min-h-[40px]',
          viewMode === 'periodo'
            ? 'bg-primary text-primary-text'
            : 'text-gray-800'
        )}
      >
        <i className="pi pi-sliders-h text-xs" />
        Período
      </button>
    </div>
  );

  // segunda a sábado (sem domingo) da semana que contém selectedDate, pra
  // dar um atalho rápido de navegação sem precisar trocar de aba
  const diasDaSemana = useMemo(() => {
    const inicio = getInicioSemana(selectedDate);
    return Array.from({ length: 6 }, (_, i) => moment(inicio).add(i, 'days').toDate());
  }, [selectedDate]);

  const renderDiaStrip = (
    // grid de 6 colunas em vez de flex+overflow-x-auto: como são sempre
    // exatamente 6 dias (seg-sáb), distribuir igualmente a largura da tela evita
    // cortar os últimos dias fora da viewport e dá alvos de toque maiores
    // e mais uniformes do que uma fileira rolável apertada.
    <div className="grid grid-cols-6 gap-1.5 mx-2 mt-4">
      {diasDaSemana.map((dia, i) => {
        const isSelected = moment(dia).isSame(selectedDate, 'day');
        const isToday = moment(dia).isSame(new Date(), 'day');
        return (
          <button
            key={dia.toISOString()}
            type="button"
            onClick={() => {
              setSelectedDate(dia);
              setViewMode('dia');
            }}
            className={clsx(
              'flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 font-inter min-h-[56px] duration-200',
              isSelected
                ? 'bg-primary text-primary-text shadow-sm'
                : clsx(
                    'bg-white text-gray-800 border',
                    isToday ? 'border-violet-800' : 'border-gray-300'
                  )
            )}
          >
            <span
              className={clsx(
                'text-[10px] font-semibold tracking-wide',
                !isSelected && 'text-gray-400'
              )}
            >
              {DIAS_SEMANA[i]}
            </span>
            <span className="text-base font-bold leading-none">
              {moment(dia).format('D')}
            </span>
            {isToday && !isSelected && (
              <span className="w-1 h-1 rounded-full bg-violet-800" />
            )}
          </button>
        );
      })}
    </div>
  );

  const renderResumo = !loading && (
    <div className="mx-2 mt-4">
      <Card className="rounded-lg border border-gray-300">
        <div className="flex items-center gap-3">
          <i className="pi pi-users text-primary" />
          <span className="font-inter text-gray-800">
            <span className="font-bold">{totalSessoesPeriodo}</span>{' '}
            {totalSessoesPeriodo === 1 ? 'sessão' : 'sessões'} {rotuloPeriodo}
          </span>
        </div>
      </Card>
    </div>
  );

  const renderPeriodoSheet = (
    <Sidebar
      visible={sheetOpen}
      onHide={() => setSheetOpen(false)}
      position="bottom"
      className="rounded-t-2xl"
      style={{ height: 'auto' }}
    >
      <div className="pb-2">
        <span className="font-inter font-bold text-gray-800 text-lg">
          Filtrar por período
        </span>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="grid gap-1">
            <label className="text-xs font-inter text-gray-400">
              Data inicial
            </label>
            <input
              type="date"
              value={customStart}
              max={customEnd || undefined}
              onChange={(e) => setCustomStart(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 font-inter text-sm text-gray-800"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-inter text-gray-400">
              Data final
            </label>
            <input
              type="date"
              value={customEnd}
              min={customStart || undefined}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 font-inter text-sm text-gray-800"
            />
          </div>
        </div>

        <div className="mt-6">
          <ButtonHeron
            text="Aplicar"
            type="primary"
            size="full"
            disabled={!customStart || !customEnd}
            loading={loading}
            typeButton="button"
            onClick={handleAplicarPeriodo}
          />
        </div>
      </div>
    </Sidebar>
  );

  return (
    <>
      {renderTabs}
      {viewMode !== 'periodo' && renderDiaStrip}
      {renderResumo}
      {renderPeriodoSheet}
      {renderContent()}
    </>
  );
};
