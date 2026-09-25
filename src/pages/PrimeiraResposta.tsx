import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { dropDown, getList } from '../server';

import { useToast } from '../contexts/toast';
import { permissionAuth } from '../contexts/permission';
import { Input } from '../components';
import { NotFound } from '../components/notFound';
import { LoadingHeron } from '../components/loading';
import { buildErrorToast } from '../util/error';
import { Legenda, ProgramaCard } from './primeiraResposta/ProgramaCard';
import {
  ProgramaGroup,
  agruparPorMeta,
  periodo,
  tarefaAtingida,
} from './primeiraResposta/tipos';

// Quantas sessões mais recentes a tela mostra — é o backend que aplica a
// janela (e usa o mesmo N pro status "atingida"); aqui só escolhe o N.
// Mais que 3 e a grade não cabe na largura do celular.
const ULTIMAS_SESSOES = 3;

// Mesma permissão que o Filter usava pra exibir o campo Paciente.
const PERMISSAO_PACIENTE = 'PEI_FILTRO_BOTAO_CADASTRAR';

const iniciais = (nome = '') => {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return `${partes[0][0]}${ultima}`.toUpperCase();
};

export default function PrimeiraResposta() {
  const [loading, setLoading] = useState<boolean>(false);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [paciente, setPaciente] = useState<any>(null);
  const [trocando, setTrocando] = useState(false);
  const [list, setList] = useState<ProgramaGroup[] | null>(null);
  const [aberto, setAberto] = useState<number | null>(null);

  const { renderToast } = useToast();
  const { hasPermition } = permissionAuth();
  const { control, setValue } = useForm<any>({ defaultValues: { pacienteId: null } });

  // Descarta resposta de um paciente anterior quando a pessoa troca rápido.
  const requisicao = useRef(0);

  // Carrega assim que o paciente é escolhido — antes era preciso achar o
  // funil sem rótulo do Filter (e o amarelo ao lado era "limpar").
  const carregar = async (escolhido: any) => {
    if (!escolhido?.id) return;
    const atual = ++requisicao.current;

    setPaciente(escolhido);
    setTrocando(false);
    setAberto(null);
    setLoading(true);
    try {
      const result: ProgramaGroup[] = await getList(
        `sessao/atividade/${escolhido.id}?ultimasSessoes=${ULTIMAS_SESSOES}`
      );
      if (atual !== requisicao.current) return;
      setList(result);
    } catch (error) {
      if (atual !== requisicao.current) return;
      setList(null);
      renderToast(
        buildErrorToast(error, 'Não foi possível carregar as respostas deste paciente.')
      );
    }
    setLoading(false);
  };

  const renderPacientes = useCallback(async () => {
    const [lista]: any = await Promise.all([dropDown('paciente')]);
    setPacientes(lista || []);
  }, []);

  useEffect(() => {
    renderPacientes();
  }, [renderPacientes]);

  const seletor = (
    <Input
      labelText="Paciente"
      id="pacienteId"
      type="select"
      customCol="col-span-6"
      control={control}
      options={pacientes}
      onChange={(valor) => {
        if (valor?.id) carregar(valor);
      }}
    />
  );

  // ------------------ Escolha do paciente ------------------
  const renderEscolha = () => {
    if (!hasPermition(PERMISSAO_PACIENTE)) {
      return (
        <section className="bg-white border border-gray-200 rounded-[14px] px-4 py-5">
          <p className="m-0 text-[14px] leading-[1.45] text-gray-800">
            Seu perfil não tem acesso à lista de pacientes desta tela.
          </p>
        </section>
      );
    }

    return (
      <section className="bg-white border border-gray-200 rounded-[14px] px-4 pt-5 pb-4 flex flex-col gap-2">
        {!paciente && (
          <div className="flex flex-col gap-1.5">
            <h2 className="m-0 text-[18px] font-bold text-[#27272a]">
              De quem você quer ver as respostas?
            </h2>
            <p className="m-0 text-[14px] leading-[1.45] text-gray-800">
              Mostramos as últimas {ULTIMAS_SESSOES} sessões de cada item das
              metas: se a criança acertou de primeira e o percentual de acerto.
            </p>
          </div>
        )}
        {seletor}
        {paciente && (
          <button
            type="button"
            onClick={() => {
              setTrocando(false);
              setValue('pacienteId', paciente);
            }}
            className="self-end h-11 px-3 rounded-[10px] text-[14px] font-bold text-primary"
          >
            Cancelar
          </button>
        )}
      </section>
    );
  };

  // ------------------ Cabeçalho do paciente ------------------
  const renderPaciente = () => {
    const faixaDatas = list?.length ? periodo(list) : null;

    return (
      <section className="bg-white border border-gray-200 rounded-[14px] py-3 pl-3.5 pr-2 flex items-center gap-3">
        <div className="w-11 h-11 shrink-0 rounded-full bg-[#f3e8f7] text-primary flex items-center justify-center text-[15px] font-bold">
          {iniciais(paciente?.nome)}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-[16px] font-bold text-[#27272a] truncate">
            {paciente?.nome}
          </span>
          <span className="text-[13px] text-gray-800">
            Últimas {ULTIMAS_SESSOES} sessões
            {faixaDatas ? ` · ${faixaDatas}` : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setTrocando(true)}
          className="h-11 px-3 rounded-[10px] text-[14px] font-bold text-primary"
        >
          Trocar
        </button>
      </section>
    );
  };

  // ------------------ Resumo ------------------
  const renderResumo = (sections: ProgramaGroup[]) => {
    const metas = sections.reduce(
      (total, sec) => total + agruparPorMeta(sec.children).length,
      0
    );
    const atingidos = sections
      .flatMap((sec) => sec.children || [])
      .filter(tarefaAtingida).length;
    const itens = [
      { valor: sections.length, label: sections.length === 1 ? 'programa' : 'programas' },
      { valor: metas, label: metas === 1 ? 'meta' : 'metas' },
      {
        valor: atingidos,
        label: atingidos === 1 ? 'item atingido' : 'itens atingidos',
        destaque: true,
      },
    ];

    return (
      <div className="grid grid-cols-3 gap-2">
        {itens.map((item) => (
          <div
            key={item.label}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 flex flex-col gap-0.5"
          >
            <span
              className={
                item.destaque && item.valor > 0
                  ? 'text-[20px] font-bold text-[#15803d]'
                  : 'text-[20px] font-bold text-[#27272a]'
              }
            >
              {item.valor}
            </span>
            <span className="text-[12px] font-semibold text-gray-800">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // ------------------ Conteúdo ------------------
  const renderContent = () => {
    if (loading) return <LoadingHeron />;

    if (!list?.length) {
      return (
        <section className="bg-white border border-gray-200 rounded-[14px] py-4">
          <NotFound />
        </section>
      );
    }

    return (
      <>
        {renderResumo(list)}

        <div className="flex justify-between items-baseline px-1 pt-2">
          <h2 className="m-0 text-[13px] font-bold tracking-[0.08em] text-gray-800">
            PROGRAMAS
          </h2>
          <span className="text-[12px] text-gray-800">média de acerto</span>
        </div>
        <div className="px-1">
          <Legenda />
        </div>

        {list.map((sec, idx) => (
          <ProgramaCard
            key={`sec-${idx}-${sec.programa}`}
            sec={sec}
            open={aberto === idx}
            onToggle={() => setAberto(aberto === idx ? null : idx)}
          />
        ))}
      </>
    );
  };

  return (
    <div className="mt-2 flex flex-col gap-3">
      {!paciente || trocando ? renderEscolha() : renderPaciente()}
      {paciente && renderContent()}
    </div>
  );
}
