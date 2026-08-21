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

type ViewMode = 'dia' | 'semana';

const getInicioSemana = (date: Date) => moment(date).startOf('isoWeek').toDate();

// mesma lógica de cor/leitura de status já usada em ScheduleInfo — aqui só
// classifica pra contagem, não precisa do className
const classificarStatus = (nome?: string) => {
  const normalized = (nome || '').toLowerCase();
  if (normalized.includes('falta')) return 'falta';
  if (normalized.includes('atestado')) return 'atestado';
  if (normalized.includes('atendido')) return 'atendido';
  return 'outro';
};

export default function Home() {
  const [user, setUser] = useState() as any;
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const auth: any = sessionStorage.getItem('auth');
    setUser(JSON.parse(auth));
  }, []);

  // -------------------- Dashboard de produtividade --------------------
  const [viewMode, setViewMode] = useState<ViewMode>('dia');
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [list, setList] = useState<any>({});

  useEffect(() => {
    if (!authUser?.id) return;

    const buscar = async () => {
      setDashboardLoading(true);
      try {
        const hoje = new Date();
        const inicio = viewMode === 'semana' ? getInicioSemana(hoje) : hoje;
        const fim =
          viewMode === 'semana' ? moment(inicio).add(6, 'days').toDate() : hoje;

        // mesmo endpoint que a Agenda já usa (evento/filtro), com
        // intervalo inclusivo nas duas pontas — ver Schedule.tsx
        const response: any = await getList(
          `/evento/filtro/${formatdateeua(inicio)}/${formatdateeua(fim)}?terapeutaId=${authUser.id}`
        );
        setList(response || {});
      } catch (error) {
        setList({});
      } finally {
        setDashboardLoading(false);
      }
    };

    buscar();
  }, [viewMode, authUser?.id]);

  // achata a resposta (agrupada por dia) numa lista só de sessões reais,
  // excluindo os slots "livres" (id === 0, mesmo padrão do formatItem da
  // Agenda)
  const sessoes = useMemo(() => {
    return Object.values(list || {})
      .flat()
      .filter((item: any) => item?.id !== 0);
  }, [list]);

  const totalSessoes = sessoes.length;

  const totalPacientes = useMemo(() => {
    const chaves = new Set(
      sessoes.map((item: any) => item?.paciente?.id ?? item?.title)
    );
    return chaves.size;
  }, [sessoes]);

  const comparecimento = useMemo(() => {
    const contagem = { atendido: 0, falta: 0, atestado: 0, outro: 0 };
    sessoes.forEach((item: any) => {
      contagem[classificarStatus(item?.statusEventos?.nome)]++;
    });
    return contagem;
  }, [sessoes]);

  const taxaComparecimento =
    totalSessoes > 0
      ? Math.round((comparecimento.atendido / totalSessoes) * 100)
      : null;

  // soma a duração (data.start -> data.end) de cada sessão do período —
  // dado real, dá pra calcular com o que o evento/filtro já devolve hoje
  const horasAtendidas = useMemo(() => {
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

  const resumosPendentes = useMemo(() => getMockSessoesSemResumo(), []);

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
        {resumosPendentes.map((item) => (
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
      <span className="text-[10px] font-inter text-gray-400 mt-2 block">
        Dado de exemplo — ainda depende de um ajuste no backend (ver
        docs/pedido-backend-dashboard.md).
      </span>
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
