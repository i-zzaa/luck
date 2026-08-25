import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import moment from 'moment';
import { Card, TextSubtext } from '../components/index';
import { useAuth } from '../contexts/auth';
import { useNavigate } from 'react-router-dom';
import { getList } from '../server';
import { formatdateeua } from '../util/util';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { getMockSessoesSemResumo } from './home/mockDashboard';
import { classificarStatus } from '../util/status';
import { isSlotLivre } from '../util/evento';
import { ButtonHeron } from '../components/button';
import {
  getPushPermissionState,
  isPushSupported,
  subscribeToPush,
} from '../util/pushNotifications';

type ViewMode = 'dia' | 'semana';

const getInicioSemana = (date: Date) => moment(date).startOf('isoWeek').toDate();

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

  // -------------------- Dashboard de produtividade --------------------
  const [viewMode, setViewMode] = useState<ViewMode>('dia');
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [list, setList] = useState<any>({});
  // FALLBACK TEMPORÁRIO: endpoint agregado ainda não existe no backend
  // (ver docs/pedido-backend-dashboard.md) — enquanto não vier, os números
  // continuam sendo calculados a partir de /evento/filtro, como hoje.
  const [resumoBackend, setResumoBackend] = useState<any>(null);

  useEffect(() => {
    if (!authUser?.id) return;

    const hoje = new Date();
    const inicio = viewMode === 'semana' ? getInicioSemana(hoje) : hoje;
    const fim =
      viewMode === 'semana' ? moment(inicio).add(6, 'days').toDate() : hoje;
    const dataInicio = formatdateeua(inicio);
    const dataFim = formatdateeua(fim);

    const buscar = async () => {
      setDashboardLoading(true);
      try {
        // mesmo endpoint que a Agenda já usa (evento/filtro), com
        // intervalo inclusivo nas duas pontas — ver Schedule.tsx
        const response: any = await getList(
          `/evento/filtro/${dataInicio}/${dataFim}?terapeutaId=${authUser.id}`
        );
        setList(response || {});
      } catch (error) {
        setList({});
      } finally {
        setDashboardLoading(false);
      }
    };

    const buscarResumo = async () => {
      try {
        const response = await getList(
          `/terapeuta/dashboard?terapeutaId=${authUser.id}&dataInicio=${dataInicio}&dataFim=${dataFim}`
        );
        setResumoBackend(response || null);
      } catch (error) {
        // endpoint ainda não existe no backend — cai no cálculo local
        setResumoBackend(null);
      }
    };

    buscar();
    buscarResumo();
  }, [viewMode, authUser?.id]);

  // achata a resposta (agrupada por dia) numa lista só de sessões reais,
  // excluindo os slots "livres" (mesmo padrão do formatItem da Agenda)
  const sessoes = useMemo(() => {
    return Object.values(list || {})
      .flat()
      .filter((item: any) => !isSlotLivre(item));
  }, [list]);

  const totalSessoesCalculado = sessoes.length;

  const totalPacientesCalculado = useMemo(() => {
    const chaves = new Set(
      sessoes.map((item: any) => item?.paciente?.id ?? item?.title)
    );
    return chaves.size;
  }, [sessoes]);

  const comparecimento = useMemo(() => {
    const contagem = { atendido: 0, falta: 0, atestado: 0, outro: 0 };
    sessoes.forEach((item: any) => {
      contagem[classificarStatus(item?.statusEventos)]++;
    });
    return contagem;
  }, [sessoes]);

  const taxaComparecimentoCalculada =
    totalSessoesCalculado > 0
      ? Math.round((comparecimento.atendido / totalSessoesCalculado) * 100)
      : null;

  // soma a duração (data.start -> data.end) de cada sessão do período —
  // dado real, dá pra calcular com o que o evento/filtro já devolve hoje
  const horasAtendidasCalculada = useMemo(() => {
    const minutos = sessoes.reduce((acc: number, item: any) => {
      const start = item?.data?.start;
      const end = item?.data?.end;
      if (!start || !end) return acc;
      const diff = moment(end, 'HH:mm').diff(moment(start, 'HH:mm'), 'minutes');
      return acc + (diff > 0 ? diff : 0);
    }, 0);

    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m > 0 ? `${h}h${m}` : `${h}h`;
  }, [sessoes]);

  // Prefere o agregado do backend quando ele existir; até lá, usa o
  // cálculo local a partir de /evento/filtro (ver useEffect acima).
  const totalSessoes = resumoBackend?.totalSessoes ?? totalSessoesCalculado;
  const totalPacientes = resumoBackend?.totalPacientes ?? totalPacientesCalculado;
  const taxaComparecimento =
    resumoBackend?.taxaComparecimento ?? taxaComparecimentoCalculada;
  const horasAtendidas = resumoBackend?.horasAtendidas ?? horasAtendidasCalculada;

  // próximas sessões de hoje: só faz sentido na aba "Hoje" — na aba
  // "Semana" a lista já mistura outros dias, então o "próximas" perderia
  // o sentido de "o que vem agora"
  const proximasHoje = useMemo(() => {
    if (viewMode !== 'dia') return [];
    const agora = moment();
    return sessoes
      .filter((item: any) => {
        const horario = item?.data?.start;
        if (!horario) return false;
        return moment(horario, 'HH:mm').isAfter(agora);
      })
      .sort((a: any, b: any) =>
        (a?.data?.start || '').localeCompare(b?.data?.start || '')
      )
      .slice(0, 3);
  }, [sessoes, viewMode]);

  const resumosPendentes = useMemo(
    () => resumoBackend?.resumosPendentes ?? getMockSessoesSemResumo(),
    [resumoBackend]
  );
  const resumosPendentesSaoMock = !resumoBackend?.resumosPendentes;

  const renderTabs = (
    <div className="bg-gray-200 rounded-full p-1 flex gap-1">
      {(['dia', 'semana'] as ViewMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setViewMode(mode)}
          className={clsx(
            'flex-1 text-center rounded-full py-2 text-sm font-inter font-semibold min-h-[40px]',
            viewMode === mode ? 'bg-primary text-primary-text' : 'text-gray-800'
          )}
        >
          {mode === 'dia' ? 'Hoje' : 'Semana'}
        </button>
      ))}
    </div>
  );

  const renderStatTile = (label: string, value: string | number, icon: string) => (
    <Card className="rounded-lg border border-gray-300">
      <div className="grid gap-1 text-center">
        <i className={clsx(icon, 'text-primary text-lg')} />
        <span className="text-xl font-inter font-bold text-gray-800">{value}</span>
        <span className="text-xs font-inter text-gray-400 leading-4">{label}</span>
      </div>
    </Card>
  );

  const renderStats = (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {renderStatTile('sessões', dashboardLoading ? '–' : totalSessoes, 'pi pi-calendar-check')}
      {renderStatTile(
        'comparecimento',
        dashboardLoading || taxaComparecimento === null ? '–' : `${taxaComparecimento}%`,
        'pi pi-check-circle'
      )}
      {renderStatTile('pacientes', dashboardLoading ? '–' : totalPacientes, 'pi pi-users')}
      {renderStatTile('horas atendidas', dashboardLoading ? '–' : horasAtendidas, 'pi pi-clock')}
    </div>
  );

  // O resumo da sessão passou a ser obrigatório — isso deixou de ser um
  // lembrete opcional e virou pendência real de compliance, por isso vem
  // ANTES dos números (é a coisa mais acionável da tela) e com visual de
  // alerta, não só uma lista neutra.
  const renderResumosPendentes = resumosPendentes.length > 0 && (
    <Card className="rounded-lg border border-red-400 mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="font-inter font-bold text-gray-800">
          Resumos pendentes
        </span>
        <span className="text-xs font-inter font-semibold text-white bg-red-400 rounded-full px-2 py-0.5 leading-4">
          {resumosPendentes.length}
        </span>
      </div>
      <p className="text-xs font-inter text-gray-800 mb-3">
        O resumo da sessão agora é obrigatório. Finalize os pendentes abaixo.
      </p>
      <div className="grid gap-3">
        {resumosPendentes.map((item: any) => (
          <div key={item.id} className="flex items-center gap-2">
            <i className="pi pi-exclamation-triangle text-red-400" />
            <span className="font-inter text-sm text-gray-800 flex-1">
              {item.pacienteNome}
            </span>
            <span className="font-inter text-xs text-gray-400">
              {item.data} · {item.horario}
            </span>
          </div>
        ))}
      </div>
      {resumosPendentesSaoMock && (
        <span className="text-[10px] font-inter text-gray-400 mt-2 block">
          Dado de exemplo — ainda depende de um ajuste no backend (ver
          docs/pedido-backend-dashboard.md).
        </span>
      )}
    </Card>
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
    <Card className="rounded-lg border border-violet-300 mb-4">
      <div className="flex items-start gap-2">
        <i className="pi pi-bell text-primary mt-0.5" />
        <div className="flex-1">
          <span className="font-inter font-bold text-gray-800 block">
            Ativar notificações
          </span>
          <p className="text-xs font-inter text-gray-600 mt-1">
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
      </div>
    </Card>
  );

  const renderProximasHoje = viewMode === 'dia' &&
    !dashboardLoading &&
    proximasHoje.length > 0 && (
      <div className="mt-6">
        <span className="font-inter font-bold text-gray-800">
          Próximas sessões de hoje
        </span>
        <Card className="rounded-lg border border-gray-300 mt-2">
          <div className="grid gap-3">
            {proximasHoje.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() =>
                  navigate(`/${CONSTANTES_ROUTERS.SESSION}`, { state: { item } })
                }
              >
                <span className="font-inter text-xs text-gray-400 w-10">
                  {item?.data?.start}
                </span>
                <span className="font-inter text-sm text-gray-800 flex-1">
                  {item?.title}
                </span>
                <i className="pi pi-chevron-right text-gray-400 text-xs" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );

  return (
    <>
      {renderResumosPendentes}
      {renderPushBanner}
      {renderTabs}
      {renderStats}
      {renderProximasHoje}

      <Card className="rounded-lg border border-gray-200 p-4 mt-6">
        <TextSubtext
          text={user?.nome}
          subtext={user?.login}
          color="violet"
          size="md"
          icon="pi pi-id-card"
          display="grid"
        />
      </Card>
    </>
  );
}
