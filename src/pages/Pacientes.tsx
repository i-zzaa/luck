import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth';
import { useToast } from '../contexts/toast';
import { dropDown, getList } from '../server';
import { LoadingHeron } from '../components/loading';
import { buildErrorToast } from '../util/error';
import { formatdateeua } from '../util/util';
import { isSlotLivre } from '../util/evento';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { PacienteResumo, iniciais, normalizar } from './paciente/util';

// Aba "Pacientes": a porta de entrada de tudo que começa pelo paciente
// (Protocolo, PEI, 1ª resposta, Resumos). Escolhe aqui uma vez e a tela do
// paciente leva a cada uma já com ele escolhido. Os pacientes da agenda de
// hoje vêm primeiro — é quase sempre um deles.
export default function Pacientes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { renderToast } = useToast();

  const [pacientes, setPacientes] = useState<PacienteResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [idsHoje, setIdsHoje] = useState<string[]>([]);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    dropDown('paciente')
      .then((lista) => setPacientes(Array.isArray(lista) ? lista : []))
      .catch((error) =>
        renderToast(buildErrorToast(error, 'Não foi possível carregar os pacientes.'))
      )
      .finally(() => setCarregando(false));
  }, [renderToast]);

  // Agenda de hoje só para ordenar; se falhar, a lista sai em ordem alfabética.
  useEffect(() => {
    if (!user?.id) return;
    getList(
      `/evento/filtro?modo=dia&data=${formatdateeua(new Date())}&terapeutaId=${user.id}&agrupado=true`
    )
      .then((agenda: any) => {
        const ids = (agenda?.dias ?? [])
          .flatMap((dia: any) => dia.itens ?? [])
          .filter((item: any) => !isSlotLivre(item))
          .sort((a: any, b: any) => (a?.data?.start || '').localeCompare(b?.data?.start || ''))
          .map((item: any) => item?.paciente?.id)
          .filter((id: any) => id !== undefined && id !== null)
          .map(String);
        setIdsHoje(Array.from(new Set(ids)));
      })
      .catch(() => setIdsHoje([]));
  }, [user?.id]);

  const termo = normalizar(busca);
  const filtrados = useMemo(
    () =>
      pacientes
        .filter((p) => !termo || normalizar(p.nome).includes(termo))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [pacientes, termo]
  );

  // Com busca, uma lista só; sem busca, "Hoje" em cima (na ordem da agenda).
  const hoje = termo
    ? []
    : idsHoje
        .map((id) => pacientes.find((p) => String(p.id) === id))
        .filter(Boolean) as PacienteResumo[];
  const resto = termo ? filtrados : filtrados.filter((p) => !idsHoje.includes(String(p.id)));

  const abrir = (paciente: PacienteResumo) =>
    navigate(`/${CONSTANTES_ROUTERS.PACIENTE.replace(':id', String(paciente.id))}`, {
      state: { paciente },
    });

  const linha = (paciente: PacienteResumo) => (
    <li key={paciente.id}>
      <button
        type="button"
        onClick={() => abrir(paciente)}
        className="w-full min-h-[56px] flex items-center gap-3 px-3.5 py-2 text-left active:bg-gray-50"
      >
        <span className="w-10 h-10 shrink-0 rounded-full bg-[#f3e8f7] text-primary flex items-center justify-center text-[14px] font-bold">
          {iniciais(paciente.nome)}
        </span>
        <span className="flex-1 min-w-0 truncate text-[15px] font-semibold text-[#27272a]">
          {paciente.nome}
        </span>
        <i aria-hidden className="pi pi-chevron-right text-gray-400 text-[12px]" />
      </button>
    </li>
  );

  const grupo = (titulo: string, lista: PacienteResumo[]) =>
    lista.length > 0 && (
      <section className="flex flex-col gap-2">
        <h2 className="m-0 px-1 text-[13px] font-bold uppercase tracking-wide text-gray-800">
          {titulo}
        </h2>
        <ul className="m-0 p-0 list-none bg-white border border-gray-200 rounded-[14px] divide-y divide-gray-100 overflow-hidden">
          {lista.map(linha)}
        </ul>
      </section>
    );

  return (
    <div className="mt-2 flex flex-col gap-4">
      <label className="h-12 flex items-center gap-2.5 rounded-[14px] border border-gray-300 bg-white px-3.5 focus-within:border-primary">
        <i aria-hidden className="pi pi-search text-gray-800" style={{ fontSize: 15 }} />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar paciente"
          aria-label="Buscar paciente"
          className="flex-1 min-w-0 h-full bg-transparent text-[16px] text-[#27272a] outline-none placeholder:text-[#a1a1aa]"
        />
      </label>

      {carregando ? (
        <LoadingHeron />
      ) : (
        <>
          {grupo('Hoje na agenda', hoje)}
          {grupo(termo ? 'Resultado' : hoje.length ? 'Todos' : 'Pacientes', resto)}
          {!hoje.length && !resto.length && (
            <p className="m-0 px-1 text-[14px] text-gray-800">
              {termo ? `Nenhum paciente com "${busca.trim()}".` : 'Nenhum paciente encontrado.'}
            </p>
          )}
        </>
      )}
    </div>
  );
}
