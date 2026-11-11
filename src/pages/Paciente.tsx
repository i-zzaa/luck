import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { dropDown } from '../server';
import { LoadingHeron } from '../components/loading';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { PacienteResumo, iniciais } from './paciente/util';

// O que dá pra fazer com o paciente. Cada tela recebe o paciente pelo
// state da navegação ({ pacienteId: { id, nome } }, o mesmo formato que o
// PEI e o Protocolo já aceitavam) e abre sem pedir o paciente de novo.
const ACOES = [
  {
    rota: CONSTANTES_ROUTERS.PROTOCOLO,
    icone: 'pi pi-verified',
    titulo: 'Protocolo',
    texto: 'Avaliar com Portage, VB-MAPP ou Manual',
  },
  {
    rota: CONSTANTES_ROUTERS.PEI,
    icone: 'pi pi-book',
    titulo: 'PEI',
    texto: 'Programas, metas e relatório de evolução',
  },
  {
    rota: CONSTANTES_ROUTERS.PRIMEIRARESPOSTA,
    icone: 'pi pi-check-square',
    titulo: '1ª resposta',
    texto: 'Acerto de primeira nas últimas sessões',
  },
  {
    rota: CONSTANTES_ROUTERS.RESUMOS,
    icone: 'pi pi-file-edit',
    titulo: 'Resumos',
    texto: 'Folha do mês com as assinaturas',
  },
];

export default function Paciente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { paciente?: PacienteResumo } | null };

  // Vindo da lista o paciente já chega no state; abrindo o link direto (ou
  // recarregando a página), busca pelo id.
  const doState = state?.paciente && String(state.paciente.id) === id ? state.paciente : null;
  const [paciente, setPaciente] = useState<PacienteResumo | null>(doState);
  const [naoAchou, setNaoAchou] = useState(false);

  useEffect(() => {
    if (paciente && String(paciente.id) === id) return;
    dropDown('paciente')
      .then((lista: PacienteResumo[]) => {
        const achado = (lista || []).find((p) => String(p.id) === id) || null;
        setPaciente(achado);
        setNaoAchou(!achado);
      })
      .catch(() => setNaoAchou(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (naoAchou) {
    return (
      <section className="mt-2 bg-white border border-gray-200 rounded-[14px] px-4 py-5 flex flex-col gap-3">
        <p className="m-0 text-[14px] text-gray-800">Paciente não encontrado.</p>
        <button
          type="button"
          onClick={() => navigate(`/${CONSTANTES_ROUTERS.PACIENTES}`)}
          className="self-start h-11 px-3 rounded-[10px] text-[14px] font-bold text-primary"
        >
          Ver pacientes
        </button>
      </section>
    );
  }

  if (!paciente) return <LoadingHeron />;

  return (
    <div className="mt-2 flex flex-col gap-4">
      <header className="flex items-center gap-3 bg-white border border-gray-200 rounded-[14px] py-3 pl-3.5 pr-2">
        <span className="w-12 h-12 shrink-0 rounded-full bg-[#f3e8f7] text-primary flex items-center justify-center text-[16px] font-bold">
          {iniciais(paciente.nome)}
        </span>
        <h1 className="flex-1 min-w-0 m-0 text-[17px] font-bold text-[#27272a] truncate">
          {paciente.nome}
        </h1>
        <button
          type="button"
          onClick={() => navigate(`/${CONSTANTES_ROUTERS.PACIENTES}`)}
          className="h-11 px-3 rounded-[10px] text-[14px] font-bold text-primary"
        >
          Trocar
        </button>
      </header>

      <ul className="m-0 p-0 list-none grid grid-cols-2 gap-3">
        {ACOES.map((acao) => (
          <li key={acao.rota}>
            <button
              type="button"
              onClick={() =>
                navigate(`/${acao.rota}`, {
                  state: { pacienteId: { id: paciente.id, nome: paciente.nome } },
                })
              }
              className="w-full h-full min-h-[128px] flex flex-col items-start gap-2 rounded-[14px] border border-gray-200 bg-white p-3.5 text-left active:bg-gray-50"
            >
              <span className="w-10 h-10 rounded-full bg-[#f3e8f7] text-primary flex items-center justify-center">
                <i aria-hidden className={acao.icone} style={{ fontSize: 18 }} />
              </span>
              <span className="text-[15px] font-bold text-[#27272a]">{acao.titulo}</span>
              <span className="text-[12.5px] leading-[1.35] text-gray-800">{acao.texto}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
