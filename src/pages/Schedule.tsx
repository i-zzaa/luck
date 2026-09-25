import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import moment from 'moment';
import { formatdateeua, firtUpperCase } from '../util/util';
import { useAuth } from '../contexts/auth';
import { getList } from '../server';
import { ButtonHeron } from '../components';
import { LoadingHeron } from '../components/loading';
import { useToast } from '../contexts/toast';
import { useNavigate } from 'react-router-dom';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { isSlotLivre } from '../util/evento';
import { BottomSheet } from '../components/bottomSheet';
import { Segmentado } from '../foms/protocolo/avaliacao';
import { HorarioLivre, SessaoCard } from './agenda/SessaoCard';

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

  const abrirSessao = (item: any) =>
    // sem `state`: a tela de Sessão carrega tudo (evento incluso) por
    // GET /sessao/calendario/:id a partir do id na rota. A data vai na
    // query (sobrevive a F5) porque em série recorrente o id é o da série
    // inteira — é ela que diz qual dia foi atendido.
    navigate(`/${CONSTANTES_ROUTERS.SESSION}/${item.id}?data=${item.date}`);

  const formatItem = (item: any) =>
    isSlotLivre(item) ? (
      <HorarioLivre key={item.id} item={item} />
    ) : (
      <SessaoCard
        key={item.id}
        item={item}
        onAbrir={() => abrirSessao(item)}
        onMetas={() => navigate(`/${CONSTANTES_ROUTERS.METAS}`, { state: item })}
      />
    );

  // total do período já contado pelo backend (item 9)
  const totalSessoesPeriodo = agenda.totalSessoes ?? 0;
  const dias = agenda.dias ?? [];
  const atendidas = dias.reduce(
    (n, dia) => n + (dia.itens || []).filter((it: any) => it?.isAttended === true).length,
    0
  );
  // Sessões por dia, pras bolinhas da tira (só dos dias que vieram na
  // resposta — no modo "Hoje" é só o dia escolhido).
  const sessoesPorDia = useMemo(() => {
    const mapa: Record<string, number> = {};
    dias.forEach((dia) => {
      mapa[moment(dia.data).format('YYYY-MM-DD')] = dia.totalSessoes;
    });
    return mapa;
  }, [dias]);

  const rotuloPeriodo =
    viewMode === 'dia'
      ? moment(selectedDate).isSame(new Date(), 'day')
        ? 'hoje'
        : 'neste dia'
      : viewMode === 'semana'
      ? 'nesta semana'
      : viewMode === 'mes'
      ? 'neste mês'
      : 'no período selecionado';

  const renderContent = () => {
    if (loading) return <LoadingHeron />;
    if (!dias.length) {
      return (
        <div className="py-7 px-4 border border-dashed border-gray-300 rounded-[14px] text-center text-[14px] text-gray-800">
          Nenhuma sessão {rotuloPeriodo}.
        </div>
      );
    }

    return dias.map((dia) => {
      const total = dia.totalSessoes;
      const dataMoment = moment(dia.data);
      const ehHoje = dataMoment.isSame(new Date(), 'day');
      return (
        <section key={dia.data} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1 pt-2.5">
            <h2 className="m-0 text-[15px] font-bold text-[#27272a]">
              {firtUpperCase(dataMoment.format('dddd').replace('-feira', ''))},{' '}
              {dataMoment.format('DD/MM')}
            </h2>
            {ehHoje && (
              <span className="rounded-full px-2 py-px bg-primary text-white text-[11px] font-bold">
                Hoje
              </span>
            )}
            {total > 0 && (
              <span className="ml-auto text-[12px] font-semibold text-gray-800">
                {total} {total === 1 ? 'sessão' : 'sessões'}
              </span>
            )}
          </div>
          {dia.itens.map((item: any) => formatItem(item))}
        </section>
      );
    });
  };

  // "Período" não troca de aba na hora — abre o bottom sheet pra
  // escolher data inicial/final, e só vira a aba ativa quando o usuário
  // aplicar um intervalo. Tocar de novo com "período" ativo reabre o sheet.
  const renderTabs = (
    <Segmentado
      rotulo="Período da agenda"
      variante="forte"
      opcoes={[
        { valor: 'dia' as ViewMode, label: 'Hoje' },
        { valor: 'semana' as ViewMode, label: 'Semana' },
        { valor: 'mes' as ViewMode, label: 'Mês' },
        { valor: 'periodo' as ViewMode, label: 'Período' },
      ]}
      valor={viewMode}
      onChange={(mode) => {
        if (mode === 'periodo') {
          setSheetOpen(true);
          return;
        }
        setViewMode(mode);
        if (mode === 'dia') setSelectedDate(new Date());
      }}
    />
  );

  // segunda a sábado (sem domingo) da semana que contém selectedDate, pra
  // dar um atalho rápido de navegação sem precisar trocar de aba
  const diasDaSemana = useMemo(() => {
    const inicio = getInicioSemana(selectedDate);
    return Array.from({ length: 6 }, (_, i) => moment(inicio).add(i, 'days').toDate());
  }, [selectedDate]);

  const renderDiaStrip = (
    // grid de 6 colunas em vez de flex+overflow-x-auto: como são sempre
    // exatamente 6 dias (seg-sáb), distribuir igualmente a largura evita
    // cortar os últimos dias fora da viewport e dá alvos de toque maiores.
    <div className="grid grid-cols-6 gap-1.5">
      {diasDaSemana.map((dia, i) => {
        const isSelected = viewMode === 'dia' && moment(dia).isSame(selectedDate, 'day');
        const isToday = moment(dia).isSame(new Date(), 'day');
        const qtd = sessoesPorDia[moment(dia).format('YYYY-MM-DD')] || 0;
        return (
          <button
            key={dia.toISOString()}
            type="button"
            onClick={() => {
              setSelectedDate(dia);
              setViewMode('dia');
            }}
            aria-pressed={isSelected}
            aria-label={`${DIAS_SEMANA[i]} ${moment(dia).format('D')}${
              qtd ? `, ${qtd} ${qtd === 1 ? 'sessão' : 'sessões'}` : ''
            }`}
            className={clsx(
              'h-[60px] flex flex-col items-center justify-center gap-[3px] rounded-xl duration-200',
              isSelected
                ? 'bg-primary text-white'
                : clsx(
                    'bg-white text-[#27272a]',
                    isToday ? 'border-[1.5px] border-primary' : 'border border-gray-200'
                  )
            )}
          >
            <span className="text-[10px] font-bold tracking-[0.04em] opacity-80">
              {DIAS_SEMANA[i]}
            </span>
            <span className="text-[16px] font-bold leading-none">{moment(dia).format('D')}</span>
            {/* bolinhas = quantas sessões (até 3) */}
            <span className="h-[5px] flex gap-0.5">
              {Array.from({ length: Math.min(qtd, 3) }, (_, n) => (
                <span
                  key={n}
                  className={clsx('w-1 h-1 rounded-full', isSelected ? 'bg-white' : 'bg-primary')}
                />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );

  // Resumo numa linha só (antes era um card grande pra uma frase).
  const renderResumo = !loading && (
    <div className="flex items-baseline justify-between px-1 pt-0.5">
      <span className="text-[14px] text-[#27272a]">
        <span className="font-bold">{totalSessoesPeriodo}</span>{' '}
        {totalSessoesPeriodo === 1 ? 'sessão' : 'sessões'} {rotuloPeriodo}
      </span>
      {atendidas > 0 && (
        <span className="text-[13px] text-gray-800">
          {atendidas} {atendidas === 1 ? 'atendida' : 'atendidas'}
        </span>
      )}
    </div>
  );

  const renderPeriodoSheet = (
    <BottomSheet
      open={sheetOpen}
      onClose={() => setSheetOpen(false)}
      titulo="Filtrar por período"
    >
      <div>
        <div className="grid grid-cols-2 gap-3">
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
    </BottomSheet>
  );

  return (
    <div className="mt-2 flex flex-col gap-3">
      {renderTabs}
      {viewMode !== 'periodo' && renderDiaStrip}
      {renderResumo}
      {renderPeriodoSheet}
      {renderContent()}
    </div>
  );
};
