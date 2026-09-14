import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import moment from 'moment';
import { Card, TextSubtext } from '../components/index';
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
  // eventos de hoje (só a aba "Hoje" usa — ver proximasHoje)
  const [eventosHoje, setEventosHoje] = useState<any[]>([]);
  // Números já agregados pelo backend (GET /terapeuta/dashboard). O front
  // só exibe.
  const [resumo, setResumo] = useState<any>(null);

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
      // /evento/filtro só alimenta "Próximas sessões de hoje"; os números
      // do painel vêm prontos de /terapeuta/dashboard. allSettled: uma
      // chamada falhando não derruba a outra seção.
      // Na aba "Semana" a lista não é exibida, então nem busca.
      // modo=dia + agrupado=true: intervalo e agrupamento resolvidos no
      // servidor (itens 9 e 10 de heron-list-nest/docs/pedido-frontend-fase2.md).
      const [eventos, dashboard] = await Promise.allSettled([
        viewMode === 'dia'
          ? getList(
              `/evento/filtro?modo=dia&data=${dataInicio}&terapeutaId=${authUser.id}&agrupado=true`
            )
          : Promise.resolve(null),
        getList(
          `/terapeuta/dashboard?terapeutaId=${authUser.id}&dataInicio=${dataInicio}&dataFim=${dataFim}`
        ),
      ]);
      const agenda: any = eventos.status === 'fulfilled' ? eventos.value : null;
      setEventosHoje((agenda?.dias ?? []).flatMap((dia: any) => dia.itens ?? []));
      setResumo(dashboard.status === 'fulfilled' ? dashboard.value || null : null);
      setDashboardLoading(false);
    };

    buscar();
  }, [viewMode, authUser?.id]);

  const totalSessoes = resumo?.totalSessoes ?? '–';
  const totalPacientes = resumo?.totalPacientes ?? '–';
  const taxaComparecimento = resumo?.taxaComparecimento ?? null;
  const horasAtendidas = resumo?.horasAtendidas ?? '–';
  const resumosPendentes: any[] = resumo?.resumosPendentes ?? [];

  // próximas sessões de hoje: só faz sentido na aba "Hoje" — na aba
  // "Semana" a lista já mistura outros dias, então o "próximas" perderia
  // o sentido de "o que vem agora".
  // "Depois de agora" + ordenar por horário + 3 primeiras continua aqui:
  // o backend não entrega isso pronto (agrupado ordena só os dias, não os
  // itens dentro do dia).
  const proximasHoje = useMemo(() => {
    if (viewMode !== 'dia') return [];
    const agora = moment();
    return eventosHoje
      .filter((item: any) => {
        if (isSlotLivre(item)) return false;
        const horario = item?.data?.start;
        if (!horario) return false;
        return moment(horario, 'HH:mm').isAfter(agora);
      })
      .sort((a: any, b: any) =>
        (a?.data?.start || '').localeCompare(b?.data?.start || '')
      )
      .slice(0, 3);
  }, [eventosHoje, viewMode]);

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
                  navigate(`/${CONSTANTES_ROUTERS.SESSION}/${item.id}`)
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
