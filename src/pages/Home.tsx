import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import moment from 'moment';
import { useAuth } from '../contexts/auth';
import { useNavigate } from 'react-router-dom';
import { getList } from '../server';
import { formatdateeua } from '../util/util';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { isSlotLivre } from '../util/evento';
import { ButtonHeron } from '../components/button';
import {
  getPushPermissionState,
  isPushSupported,
  subscribeToPush,
} from '../util/pushNotifications';

type ViewMode = 'dia' | 'semana';

// Ainda necessário só pro /terapeuta/dashboard, que aceita apenas
// dataInicio/dataFim (sem `modo`). /evento/filtro já resolve o intervalo
// no servidor.
const getInicioSemana = (date: Date) => moment(date).startOf('isoWeek').toDate();

const saudacao = () => {
  const hora = moment().hour();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
};

const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);

// "agora", "em 25 min", "em 1h10" — distância até o início da sessão.
const faltaPara = (horario: string) => {
  const minutos = moment(horario, 'HH:mm').diff(moment(), 'minutes');
  if (minutos <= 0) return 'agora';
  if (minutos < 60) return `em ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `em ${horas}h${String(resto).padStart(2, '0')}` : `em ${horas}h`;
};

const SectionTitle = ({ children }: { children: string }) => (
  <h2 className="text-[13px] font-bold uppercase tracking-wide text-gray-800">
    {children}
  </h2>
);

export default function Home() {
  const [user, setUser] = useState() as any;
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const auth: any = sessionStorage.getItem('auth');
    setUser(JSON.parse(auth));
  }, []);

  // -------------------- Push notification --------------------
  // "default" = navegador nunca perguntou nada ainda (candidato a
  // mostrar o banner). "granted"/"denied" = usuário já decidiu — nesses
  // casos não tem o que oferecer de novo (negado só muda via config do
  // próprio navegador, não tem prompt programático pra isso).
  const [pushPermission, setPushPermission] = useState(getPushPermissionState());
  const [pushLoading, setPushLoading] = useState(false);
  const [pushDismissed, setPushDismissed] = useState(
    () => localStorage.getItem('pushBannerDismissed') === 'true'
  );

  const handleAtivarPush = async () => {
    if (!authUser?.id) return;
    setPushLoading(true);
    const result = await subscribeToPush(authUser.id);
    setPushLoading(false);
    setPushPermission(getPushPermissionState());
    if (result.ok) setPushDismissed(true);
  };

  const handleDispensarPush = () => {
    localStorage.setItem('pushBannerDismissed', 'true');
    setPushDismissed(true);
  };

  // -------------------- Agenda de hoje --------------------
  // Independente da aba Hoje/Semana do painel: a agenda do dia fica
  // sempre no topo, é o que a terapeuta mais consulta ao abrir o app.
  const [eventosHoje, setEventosHoje] = useState<any[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);

  useEffect(() => {
    if (!authUser?.id) return;

    const buscar = async () => {
      setAgendaLoading(true);
      // modo=dia + agrupado=true: intervalo e agrupamento resolvidos no
      // servidor (itens 9 e 10 de heron-list-nest/docs/pedido-frontend-fase2.md).
      try {
        const agenda: any = await getList(
          `/evento/filtro?modo=dia&data=${formatdateeua(new Date())}&terapeutaId=${authUser.id}&agrupado=true`
        );
        setEventosHoje((agenda?.dias ?? []).flatMap((dia: any) => dia.itens ?? []));
      } catch {
        setEventosHoje([]);
      }
      setAgendaLoading(false);
    };

    buscar();
  }, [authUser?.id]);

  const sessoesHoje = useMemo(
    () =>
      eventosHoje
        .filter((item: any) => !isSlotLivre(item) && item?.data?.start)
        .sort((a: any, b: any) =>
          (a?.data?.start || '').localeCompare(b?.data?.start || '')
        ),
    [eventosHoje]
  );

  // "Depois de agora" + ordenar por horário continua aqui: o backend não
  // entrega isso pronto (agrupado ordena só os dias, não os itens dentro
  // do dia).
  const proximasHoje = useMemo(() => {
    const agora = moment();
    return sessoesHoje.filter((item: any) =>
      moment(item.data.start, 'HH:mm').isAfter(agora)
    );
  }, [sessoesHoje]);

  const [proxima, ...seguintes] = proximasHoje;

  const abrirSessao = (item: any) =>
    // `data`: em série recorrente o id é o da série, então é a data que
    // diz qual dia está sendo atendido (mesma regra de Schedule.tsx).
    navigate(`/${CONSTANTES_ROUTERS.SESSION}/${item.id}?data=${item.date}`);

  // -------------------- Painel de produtividade --------------------
  const [viewMode, setViewMode] = useState<ViewMode>('dia');
  const [dashboardLoading, setDashboardLoading] = useState(false);
  // Números já agregados pelo backend (GET /terapeuta/dashboard). O front
  // só exibe.
  const [resumo, setResumo] = useState<any>(null);

  useEffect(() => {
    if (!authUser?.id) return;

    const hoje = new Date();
    const inicio = viewMode === 'semana' ? getInicioSemana(hoje) : hoje;
    const fim =
      viewMode === 'semana' ? moment(inicio).add(6, 'days').toDate() : hoje;

    const buscar = async () => {
      setDashboardLoading(true);
      try {
        const dashboard: any = await getList(
          `/terapeuta/dashboard?terapeutaId=${authUser.id}&dataInicio=${formatdateeua(inicio)}&dataFim=${formatdateeua(fim)}`
        );
        setResumo(dashboard || null);
      } catch {
        setResumo(null);
      }
      setDashboardLoading(false);
    };

    buscar();
  }, [viewMode, authUser?.id]);

  const taxaComparecimento = resumo?.taxaComparecimento ?? null;
  const resumosPendentes: any[] = resumo?.resumosPendentes ?? [];

  // -------------------- Render --------------------
  const primeiroNome = (user?.nome || '').trim().split(' ')[0];

  const renderSaudacao = (
    <header className="px-1 mb-4">
      <p className="text-[13px] font-semibold text-gray-800 first-letter:uppercase">
        {moment().format('dddd, D [de] MMMM')}
      </p>
      <h1 className="text-[24px] leading-tight font-bold text-[#27272a]">
        {saudacao()}
        {primeiroNome && `, ${primeiroNome}`}
      </h1>
    </header>
  );

  // O resumo da sessão passou a ser obrigatório — isso deixou de ser um
  // lembrete opcional e virou pendência real de compliance, por isso vem
  // ANTES de tudo (é a coisa mais acionável da tela) e com visual de
  // alerta, não só uma lista neutra.
  const renderResumosPendentes = resumosPendentes.length > 0 && (
    <section className="bg-[#fef2f2] border border-[#fecaca] rounded-[14px] p-3.5 mb-3">
      <div className="flex items-center gap-2">
        <i className="pi pi-exclamation-triangle text-[#b91c1c]" />
        <span className="flex-1 text-[15px] font-bold text-[#7f1d1d]">
          {resumosPendentes.length}{' '}
          {plural(resumosPendentes.length, 'resumo pendente', 'resumos pendentes')}
        </span>
      </div>
      <p className="text-[13px] text-[#7f1d1d] mt-1">
        O resumo da sessão agora é obrigatório. Finalize os pendentes abaixo.
      </p>
      <ul className="mt-2.5 divide-y divide-[#fecaca]">
        {resumosPendentes.map((item: any) => (
          <li key={item.id} className="flex items-center gap-2 py-2">
            <span className="flex-1 min-w-0 truncate text-[14px] font-semibold text-[#27272a]">
              {item.pacienteNome}
            </span>
            <span className="shrink-0 text-[12px] text-[#7f1d1d]">
              {item.data} · {item.horario}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );

  // Só mostra se: o navegador suporta push, o backend já expôs a chave
  // VAPID (isPushSupported não checa isso — subscribeToPush que devolve
  // reason: 'no-vapid-key' se faltar; aqui a gente já filtra isso ANTES
  // de mostrar o banner, checando a env var direto, senão ofereceria um
  // botão que sempre falha silenciosamente), o usuário não decidiu ainda
  // (permission === 'default') e não dispensou o banner antes.
  const podeOferecerPush =
    isPushSupported() &&
    Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY) &&
    pushPermission === 'default' &&
    !pushDismissed;

  const renderPushBanner = podeOferecerPush && (
    <section className="bg-white border border-gray-200 rounded-[14px] p-3.5 mb-3 flex items-start gap-3">
      <span className="shrink-0 w-9 h-9 rounded-full bg-[#f3e8f7] flex items-center justify-center">
        <i className="pi pi-bell text-primary" />
      </span>
      <div className="flex-1">
        <span className="text-[15px] font-bold text-[#27272a] block">
          Ativar notificações
        </span>
        <p className="text-[13px] text-gray-800 mt-0.5">
          Receba um aviso quando uma sessão for cancelada ou quando o
          paciente chegar na recepção.
        </p>
        <div className="flex gap-2 mt-3">
          <ButtonHeron
            text="Ativar"
            type="primary"
            size="sm"
            loading={pushLoading}
            onClick={handleAtivarPush}
          />
          <ButtonHeron
            text="Agora não"
            type="transparent"
            size="sm"
            onClick={handleDispensarPush}
          />
        </div>
      </div>
    </section>
  );

  const renderProxima = proxima && (
    <button
      type="button"
      onClick={() => abrirSessao(proxima)}
      className="w-full text-left bg-primary text-white rounded-[14px] p-4 flex items-center gap-3"
    >
      <span className="flex-1 min-w-0">
        <span className="block text-[12px] font-semibold uppercase tracking-wide opacity-80">
          Próxima sessão · {faltaPara(proxima.data.start)}
        </span>
        <span className="block text-[18px] font-bold mt-1 truncate">
          {proxima.title}
        </span>
        <span className="block text-[14px] opacity-90 mt-0.5">
          {proxima.data.start}
          {proxima.data.end && ` – ${proxima.data.end}`}
          {proxima.modalidade?.nome && ` · ${proxima.modalidade.nome}`}
        </span>
      </span>
      <i className="pi pi-chevron-right opacity-80" />
    </button>
  );

  const renderSeguintes = seguintes.length > 0 && (
    <ul className="bg-white border border-gray-200 rounded-[14px] mt-2 divide-y divide-gray-200">
      {seguintes.map((item: any) => (
        <li key={`${item.id}-${item.data.start}`}>
          <button
            type="button"
            onClick={() => abrirSessao(item)}
            className="w-full min-h-[52px] flex items-center gap-3 px-3.5 py-2.5 text-left"
          >
            <span className="w-11 shrink-0 text-[14px] font-bold text-primary">
              {item.data.start}
            </span>
            <span className="flex-1 min-w-0 truncate text-[14px] text-[#27272a]">
              {item.title}
            </span>
            <i className="pi pi-chevron-right text-gray-400 text-[12px]" />
          </button>
        </li>
      ))}
    </ul>
  );

  const renderAgendaVazia = (
    <div className="bg-white border border-gray-200 rounded-[14px] p-4 flex items-center gap-3">
      <i className="pi pi-check-circle text-primary text-[20px]" />
      <span className="text-[14px] text-gray-800">
        {sessoesHoje.length > 0
          ? 'Todas as sessões de hoje já passaram.'
          : 'Nenhuma sessão agendada para hoje.'}
      </span>
    </div>
  );

  const renderAgendaHoje = (
    <section className="mt-2">
      <div className="flex items-center justify-between px-1 mb-2">
        <SectionTitle>
          {`Agenda de hoje${sessoesHoje.length ? ` · ${sessoesHoje.length}` : ''}`}
        </SectionTitle>
        <button
          type="button"
          onClick={() => navigate(`/${CONSTANTES_ROUTERS.CALENDAR}`)}
          className="text-[13px] font-semibold text-primary min-h-[32px]"
        >
          Ver agenda
        </button>
      </div>
      {agendaLoading ? (
        <div className="h-[88px] rounded-[14px] bg-gray-200 animate-pulse" />
      ) : proxima ? (
        <>
          {renderProxima}
          {renderSeguintes}
        </>
      ) : (
        renderAgendaVazia
      )}
    </section>
  );

  const renderTabs = (
    <div className="bg-gray-200 rounded-full p-0.5 flex" role="tablist">
      {(['dia', 'semana'] as ViewMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-selected={viewMode === mode}
          onClick={() => setViewMode(mode)}
          className={clsx(
            'rounded-full px-3 min-h-[32px] text-[13px] font-semibold',
            viewMode === mode ? 'bg-white text-primary shadow-sm' : 'text-gray-800'
          )}
        >
          {mode === 'dia' ? 'Hoje' : 'Semana'}
        </button>
      ))}
    </div>
  );

  const renderStatTile = (label: string, value: string | number, icon: string) => (
    <div className="bg-white border border-gray-200 rounded-[14px] p-3.5 flex flex-col gap-2">
      <span className="w-8 h-8 rounded-full bg-[#f3e8f7] flex items-center justify-center">
        <i className={clsx(icon, 'text-primary text-[14px]')} />
      </span>
      {dashboardLoading ? (
        <span className="h-7 w-14 rounded bg-gray-200 animate-pulse" />
      ) : (
        <span className="text-[24px] leading-7 font-bold text-[#27272a]">{value}</span>
      )}
      <span className="text-[12px] text-gray-800">{label}</span>
    </div>
  );

  const renderPainel = (
    <section className="mt-6">
      <div className="flex items-center justify-between px-1 mb-2">
        <SectionTitle>Seus números</SectionTitle>
        {renderTabs}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {renderStatTile('sessões', resumo?.totalSessoes ?? '–', 'pi pi-calendar-check')}
        {renderStatTile(
          'comparecimento',
          taxaComparecimento === null ? '–' : `${taxaComparecimento}%`,
          'pi pi-check-circle'
        )}
        {renderStatTile('pacientes', resumo?.totalPacientes ?? '–', 'pi pi-users')}
        {renderStatTile('horas atendidas', resumo?.horasAtendidas ?? '–', 'pi pi-clock')}
      </div>
    </section>
  );

  return (
    <div className="font-inter">
      {renderSaudacao}
      {renderResumosPendentes}
      {renderPushBanner}
      {renderAgendaHoje}
      {renderPainel}
    </div>
  );
}
