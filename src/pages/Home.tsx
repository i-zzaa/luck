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
import { iniciais } from './paciente/util';

// Só pro /terapeuta/dashboard, que aceita apenas dataInicio/dataFim (sem
// `modo`). /evento/filtro já resolve o intervalo no servidor.
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


  // -------------------- Agenda (esta semana e a próxima) --------------------
  // Duas semanas numa chamada cada (modo=semana, agrupado no servidor):
  // dá a agenda de hoje, a próxima sessão quando hoje não tem mais nada
  // (mesmo que seja na semana seguinte) e os pacientes da semana.
  const [eventos, setEventos] = useState<any[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);

  useEffect(() => {
    if (!authUser?.id) return;

    const semana = (data: Date) =>
      getList(
        `/evento/filtro?modo=semana&data=${formatdateeua(data)}&terapeutaId=${authUser.id}&agrupado=true`
      ).then((agenda: any) => (agenda?.dias ?? []).flatMap((dia: any) => dia.itens ?? []));

    const buscar = async () => {
      setAgendaLoading(true);
      const hoje = new Date();
      const [estaSemana, proximaSemana] = await Promise.all([
        semana(hoje).catch(() => []),
        semana(moment(hoje).add(7, 'days').toDate()).catch(() => []),
      ]);
      setEventos([...estaSemana, ...proximaSemana]);
      setAgendaLoading(false);
    };

    buscar();
  }, [authUser?.id]);

  const hojeIso = moment().format('YYYY-MM-DD');

  const sessoes = useMemo(
    () =>
      eventos
        .filter((item: any) => !isSlotLivre(item) && item?.data?.start && item?.date)
        .sort((a: any, b: any) =>
          `${a.date} ${a.data.start}`.localeCompare(`${b.date} ${b.data.start}`)
        ),
    [eventos]
  );

  const sessoesHoje = sessoes.filter((item: any) => item.date === hojeIso);

  // "Depois de agora" continua aqui: o backend não sabe que horas são no
  // celular de quem abre a tela.
  const agora = moment();
  const restantesHoje = sessoesHoje.filter((item: any) =>
    moment(item.data.start, 'HH:mm').isAfter(agora)
  );
  const proximoDia = sessoes.find((item: any) => item.date > hojeIso);
  const proxima = restantesHoje[0] ?? proximoDia ?? null;
  const proximaEhHoje = Boolean(proxima && proxima.date === hojeIso);

  // Pacientes da semana atual (até hoje primeiro, depois os que vêm),
  // sem repetir — atalho para a tela do paciente.
  const fimDaSemana = moment().endOf('isoWeek').format('YYYY-MM-DD');
  const pacientesDaSemana = useMemo(() => {
    const vistos = new Map<string, { id: any; nome: string }>();
    const daSemana = sessoes.filter((item: any) => item.date <= fimDaSemana);
    const ordem = [
      ...daSemana.filter((item: any) => item.date <= hojeIso).reverse(),
      ...daSemana.filter((item: any) => item.date > hojeIso),
    ];
    ordem.forEach((item: any) => {
      const id = item?.paciente?.id;
      if (id === undefined || id === null || vistos.has(String(id))) return;
      vistos.set(String(id), { id, nome: item.paciente.nome || item.title || '' });
    });
    return Array.from(vistos.values());
  }, [sessoes, fimDaSemana, hojeIso]);

  const abrirSessao = (item: any) =>
    // `data`: em série recorrente o id é o da série, então é a data que
    // diz qual dia está sendo atendido (mesma regra de Schedule.tsx).
    navigate(`/${CONSTANTES_ROUTERS.SESSION}/${item.id}?data=${item.date}`);

  const abrirPaciente = (paciente: { id: any; nome: string }) =>
    navigate(`/${CONSTANTES_ROUTERS.PACIENTE.replace(':id', String(paciente.id))}`, {
      state: { paciente },
    });

  // -------------------- Números da semana --------------------
  const [resumo, setResumo] = useState<any>(null);

  useEffect(() => {
    if (!authUser?.id) return;

    const inicio = getInicioSemana(new Date());
    const fim = moment(inicio).add(6, 'days').toDate();

    // Números já agregados pelo backend (GET /terapeuta/dashboard). O front
    // só exibe.
    getList(
      `/terapeuta/dashboard?terapeutaId=${authUser.id}&dataInicio=${formatdateeua(inicio)}&dataFim=${formatdateeua(fim)}`
    )
      .then((dashboard: any) => setResumo(dashboard || null))
      .catch(() => setResumo(null));
  }, [authUser?.id]);

  const resumosPendentes: any[] = resumo?.resumosPendentes ?? [];

  // O backend manda a data como DD/MM (sem ano). É da semana atual, então
  // o ano é o de hoje — salvo na virada do ano, quando a data "no futuro"
  // é do ano anterior.
  const isoDePendente = (ddmm: string) => {
    const data = moment(ddmm, 'DD/MM');
    if (data.isAfter(moment(), 'day')) data.subtract(1, 'year');
    return data.format('YYYY-MM-DD');
  };

  // -------------------- Render --------------------
  const primeiroNome = (user?.nome || '').trim().split(' ')[0];

  const renderSaudacao = (
    <header className="px-1 mb-4">
      <h1 className="m-0 text-[24px] leading-tight font-bold text-[#27272a]">
        {saudacao()}
        {primeiroNome && `, ${primeiroNome}`}
      </h1>
      <p className="m-0 mt-0.5 text-[14px] text-gray-800 first-letter:uppercase">
        {moment().format('dddd, D [de] MMMM')}
      </p>
    </header>
  );

  // O resumo da sessão é obrigatório e só vale assinado — o que falta é
  // pendência de verdade, por isso vem antes de tudo e cada linha já abre a
  // sessão para finalizar.
  const renderPendencias = resumosPendentes.length > 0 && (
    <section className="mb-4">
      <div className="px-1 mb-2">
        <SectionTitle>Pendências</SectionTitle>
      </div>
      <div className="bg-[#fef2f2] border border-[#fecaca] rounded-[14px] overflow-hidden">
        <div className="flex items-center gap-2 px-3.5 pt-3">
          <i aria-hidden className="pi pi-exclamation-triangle text-[#b91c1c]" />
          <span className="flex-1 text-[15px] font-bold text-[#7f1d1d]">
            {resumosPendentes.length}{' '}
            {plural(
              resumosPendentes.length,
              'sessão sem resumo assinado',
              'sessões sem resumo assinado'
            )}
          </span>
        </div>
        <ul className="m-0 mt-1 p-0 list-none divide-y divide-[#fecaca]">
          {resumosPendentes.map((item: any) => (
            <li key={`${item.id}-${item.data}`}>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/${CONSTANTES_ROUTERS.SESSION}/${item.id}?data=${isoDePendente(item.data)}`
                  )
                }
                className="w-full min-h-[48px] flex items-center gap-2 px-3.5 py-2 text-left active:bg-[#fee2e2]"
              >
                <span className="flex-1 min-w-0 truncate text-[14px] font-semibold text-[#27272a]">
                  {item.pacienteNome}
                </span>
                <span className="shrink-0 text-[12px] text-[#7f1d1d]">
                  {item.data} · {item.horario}
                </span>
                <i aria-hidden className="pi pi-chevron-right text-[#b91c1c] text-[12px]" />
              </button>
            </li>
          ))}
        </ul>
      </div>
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
    <section className="bg-white border border-gray-200 rounded-[14px] p-3.5 mb-4 flex items-start gap-3">
      <span className="shrink-0 w-9 h-9 rounded-full bg-[#f3e8f7] flex items-center justify-center">
        <i aria-hidden className="pi pi-bell text-primary" />
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

  const quando = (item: any) =>
    item.date === hojeIso
      ? `Hoje · ${faltaPara(item.data.start)}`
      : moment(item.date).calendar(null, {
          nextDay: '[Amanhã]',
          nextWeek: 'dddd',
          sameElse: 'ddd, D [de] MMM',
        });

  const pacienteDe = (item: any) =>
    item?.paciente?.id !== undefined && item?.paciente?.id !== null
      ? { id: item.paciente.id, nome: item.paciente.nome || item.title || '' }
      : null;

  // Próxima sessão em destaque, com os dois atalhos mais usados. Se hoje
  // não tem mais nada, mostra a próxima de outro dia (sem "Iniciar").
  const renderProxima = () => {
    if (!proxima) {
      return (
        <div className="bg-white border border-gray-200 rounded-[14px] p-4 flex items-center gap-3">
          <i aria-hidden className="pi pi-check-circle text-primary text-[20px]" />
          <span className="text-[14px] text-gray-800">
            {sessoesHoje.length > 0
              ? 'Todas as sessões de hoje já passaram.'
              : 'Nenhuma sessão nos próximos dias.'}
          </span>
        </div>
      );
    }

    const paciente = pacienteDe(proxima);
    return (
      <section className="bg-primary text-white rounded-[14px] p-4 flex flex-col gap-3">
        {!proximaEhHoje && (
          <span className="text-[13px] opacity-90">
            {sessoesHoje.length > 0
              ? 'As sessões de hoje já passaram.'
              : 'Nenhuma sessão hoje.'}
          </span>
        )}
        <div className="min-w-0">
          <span className="block text-[12px] font-semibold uppercase tracking-wide opacity-80 first-letter:uppercase">
            Próxima sessão · {quando(proxima)}
          </span>
          <span className="block text-[19px] font-bold mt-1 truncate">{proxima.title}</span>
          <span className="block text-[14px] opacity-90 mt-0.5">
            {proxima.data.start}
            {proxima.data.end && ` – ${proxima.data.end}`}
            {proxima.modalidade?.nome && ` · ${proxima.modalidade.nome}`}
          </span>
        </div>
        <div className="flex gap-2">
          {proximaEhHoje && (
            <button
              type="button"
              onClick={() => abrirSessao(proxima)}
              className="flex-1 h-11 rounded-[12px] bg-white text-primary text-[15px] font-bold"
            >
              Iniciar sessão
            </button>
          )}
          {paciente && (
            <button
              type="button"
              onClick={() => abrirPaciente(paciente)}
              className="flex-1 h-11 rounded-[12px] border border-white/60 text-white text-[15px] font-bold"
            >
              Ver paciente
            </button>
          )}
        </div>
      </section>
    );
  };

  // O resto de hoje (passadas e futuras, menos a que está em destaque).
  const outrasHoje = sessoesHoje.filter((item: any) => item !== proxima);

  const renderHoje = outrasHoje.length > 0 && (
    <ul className="m-0 p-0 list-none bg-white border border-gray-200 rounded-[14px] mt-2 divide-y divide-gray-200 overflow-hidden">
      {outrasHoje.map((item: any) => {
        const passou = !moment(item.data.start, 'HH:mm').isAfter(agora);
        return (
          <li key={`${item.id}-${item.date}-${item.data.start}`}>
            <button
              type="button"
              onClick={() => abrirSessao(item)}
              className="w-full min-h-[52px] flex items-center gap-3 px-3.5 py-2.5 text-left"
            >
              <span
                className={clsx(
                  'w-11 shrink-0 text-[14px] font-bold',
                  passou ? 'text-gray-800' : 'text-primary'
                )}
              >
                {item.data.start}
              </span>
              <span className="flex-1 min-w-0 truncate text-[14px] text-[#27272a]">
                {item.title}
              </span>
              {item?.statusEventos?.nome && (
                <span className="shrink-0 text-[12px] text-gray-800">
                  {item.statusEventos.nome}
                </span>
              )}
              <i aria-hidden className="pi pi-chevron-right text-gray-400 text-[12px]" />
            </button>
          </li>
        );
      })}
    </ul>
  );

  const renderAgenda = (
    <section>
      <div className="flex items-center justify-between px-1 mb-2">
        <SectionTitle>
          {`Hoje${sessoesHoje.length ? ` · ${sessoesHoje.length} ${plural(sessoesHoje.length, 'sessão', 'sessões')}` : ''}`}
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
        <div className="h-[148px] rounded-[14px] bg-gray-200 animate-pulse" />
      ) : (
        <>
          {renderProxima()}
          {renderHoje}
        </>
      )}
    </section>
  );

  const renderPacientes = pacientesDaSemana.length > 0 && (
    <section className="mt-6">
      <div className="flex items-center justify-between px-1 mb-2">
        <SectionTitle>Pacientes da semana</SectionTitle>
        <button
          type="button"
          onClick={() => navigate(`/${CONSTANTES_ROUTERS.PACIENTES}`)}
          className="text-[13px] font-semibold text-primary min-h-[32px]"
        >
          Ver todos
        </button>
      </div>
      <ul className="m-0 p-0 list-none flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {pacientesDaSemana.map((paciente) => (
          <li key={paciente.id} className="shrink-0">
            <button
              type="button"
              onClick={() => abrirPaciente(paciente)}
              className="w-[76px] flex flex-col items-center gap-1.5 py-1"
            >
              <span className="w-12 h-12 rounded-full bg-[#f3e8f7] text-primary flex items-center justify-center text-[15px] font-bold">
                {iniciais(paciente.nome)}
              </span>
              <span className="w-full text-center text-[12px] leading-tight text-[#27272a] truncate">
                {paciente.nome.trim().split(/\s+/)[0]}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );

  // Uma linha discreta no fim; some quando a semana ainda não tem sessão
  // (antes eram 4 cards grandes com zeros).
  const renderNumeros = Number(resumo?.totalSessoes) > 0 && (
    <p className="mt-6 px-1 text-[13px] text-gray-800">
      <span className="font-bold text-[#27272a]">Esta semana:</span>{' '}
      {resumo.totalSessoes} {plural(Number(resumo.totalSessoes), 'sessão', 'sessões')}
      {resumo.taxaComparecimento !== null &&
        resumo.taxaComparecimento !== undefined &&
        ` · ${resumo.taxaComparecimento}% de presença`}
      {resumo.horasAtendidas && ` · ${resumo.horasAtendidas}`}
    </p>
  );

  return (
    <div className="font-inter">
      {renderSaudacao}
      {renderPendencias}
      {renderPushBanner}
      {renderAgenda}
      {renderPacientes}
      {renderNumeros}
    </div>
  );
}
