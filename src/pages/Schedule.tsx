import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import moment from 'moment';
import { Sidebar } from 'primereact/sidebar';
import {
  formatdateeua,
  firtUpperCase,
  getPrimeiroDoMes,
  getUltimoDoMes,
} from '../util/util';
import { useAuth } from '../contexts/auth';
import { getList } from '../server';
import { ButtonHeron, Card } from '../components';
import { LoadingHeron } from '../components/loading';
import { NotFound } from '../components/notFound';
import { useToast } from '../contexts/toast';
import { STATUS_EVENTS } from '../constants/schedule';
import { useNavigate } from 'react-router-dom';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { ChoiceItemSchedule } from '../components/choiceItemSchedule';

type ViewMode = 'dia' | 'semana' | 'mes' | 'periodo';

// sem domingo — não é dia de trabalho, então não faz sentido oferecer
// como atalho de navegação na tira de dias
const DIAS_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

// segunda-feira da semana que contém `date`
const getInicioSemana = (date: Date) =>
  moment(date).startOf('isoWeek').toDate();

export const Schedule = () => {
  const { renderToast } = useToast();
  const navigate = useNavigate();

  const [list, setList] = useState({}) as any;
  const [keys, setKeys] = useState([]) as any;
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

  const getDayTerapeuta = async (currentDateStart: string, currentDateEnd: string) => {
    setLoading(true);
    try {
      // evento/filtro/2025-09-10/2025-09-12?terapeutaId=25
      const response: any = await getList(
        `/evento/filtro/${currentDateStart}/${currentDateEnd}?terapeutaId=${user.id}`
      );
      let clavesOrdenadas = Object.keys(response).sort();

      setList(response);
      setKeys(clavesOrdenadas);
    } catch (error) {
      setList([]);
      setKeys([]);
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
  // Datas SEM +1 dia no fim: o endpoint trata o intervalo como inclusivo
  // nas duas pontas. O código antigo somava um dia no fim (herdado do
  // "Hoje" original) — confirmado por dois casos reais (clicar no dia 19
  // trouxe o 20; clicar no 20 trouxe o 21): pedir "19→20" inclusivo
  // também traz os eventos do 20 junto, e se o dia clicado não tiver
  // sessão própria, só o dia seguinte aparece — parecendo "filtrou o dia
  // errado". Pedindo dia=dia (sem somar) o intervalo já cobre o próprio
  // dia inteiro.
  const buscarPeriodo = (mode: ViewMode, date: Date) => {
    if (mode === 'periodo') {
      if (!customStart || !customEnd) return; // ainda não aplicou nada no sheet
      return getDayTerapeuta(customStart, customEnd);
    }
    if (mode === 'semana') {
      const inicio = getInicioSemana(date);
      const fim = moment(inicio).add(6, 'days').toDate();
      return getDayTerapeuta(formatdateeua(inicio), formatdateeua(fim));
    }
    if (mode === 'mes') {
      const ano = moment(date).year();
      const mes = moment(date).month() + 1;
      return getDayTerapeuta(getPrimeiroDoMes(ano, mes), getUltimoDoMes(ano, mes));
    }
    return getDayTerapeuta(formatdateeua(date), formatdateeua(date));
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
    const dateSession = item?.dataAtual || item?.date;
    const isPast = moment()
      .startOf('day')
      .isAfter(moment(dateSession).startOf('day'));

    const naoAtendido =
      isPast && item?.statusEventos?.nome !== STATUS_EVENTS.atendido;
    // statusEventos.atender === false: o evento não deve ser aberto pra
    // registrar sessão (diferente de "não atendido" — é sobre o tipo do
    // evento, não sobre a sessão já ter passado), então bloqueia o clique
    // sem reaproveitar o rótulo "Não Atendido".
    const notNavigate = naoAtendido || item?.statusEventos?.atender === false;

    return (
      <Card
        key={item.id}
        type={item.especialidade.nome}
        onClick={() =>
          !notNavigate &&
          navigate(`/${CONSTANTES_ROUTERS.SESSION}`, { state: { item } })
        }
      >
        <div className="flex">
          <ChoiceItemSchedule
            start={item?.data?.start}
            end={item?.data?.end}
            statusEventos={item?.statusEventos?.nome}
            title={item?.title}
            localidade={item?.localidade?.nome}
            isExterno={item?.isExterno}
            km={item?.km}
            modalidade={item?.modalidade?.nome}
            dataInicio={item?.dataInicio}
            dataFim={item?.dataFim}
            dataAtual={item?.dataAtual || item?.date}
          />
          {!isPast && item?.statusEventos?.nome !== STATUS_EVENTS.atendido && (
            <ButtonHeron
              text="Pesquisar"
              icon="pi pi-file-edit"
              type="primary"
              size="icon"
              loading={loading}
              onClick={(event: any) => handleButtonDTTClick(event, item)}
            />
          )}

          {item?.statusEventos?.nome === STATUS_EVENTS.atendido && (
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
        </div>
      </Card>
    );
  };

  const formatItem = (item: any) => {
    switch (item.id) {
      case 0:
        return cardFree(item);
      default:
        return cardChoice(item);
    }
  };

  // total de sessões reais (exclui os slots "livres", que usam id 0) —
  // usado no card de resumo e no cabeçalho de cada dia
  const countSessoes = (items: any[]) =>
    (items || []).filter((item: any) => item.id !== 0).length;

  const totalSessoesPeriodo = useMemo(
    () => keys.reduce((acc: number, key: string) => acc + countSessoes(list[key]), 0),
    [keys, list]
  );

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
      return keys.length ? (
        keys.map((key: string) => {
          const total = countSessoes(list[key]);
          const dataMoment = moment(key);
          return (
            <div key={key}>
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
              {list[key].map((item: any) => formatItem(item))}
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
