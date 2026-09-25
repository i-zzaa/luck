import { useCallback, useEffect, useRef, useState } from 'react';

import { useForm } from 'react-hook-form';
import { Input } from '../components/index';
import { dropDown } from '../server';
import { permissionAuth } from '../contexts/permission';
import PORTAGECADASTRO from './Portage';
import VBMapp from './VBMapp';
import { useLocation, useNavigate } from 'react-router-dom';
import PEICADASTRO from './pei';
import { Segmentado, SheetAlteracoes } from './protocolo/avaliacao';

const OBJ = { id: '', nome: '' };

const PERMISSAO = 'PEI_FILTRO_BOTAO_CADASTRAR';

// Ordem fixa no seletor, pelo `codigo` estável de protocolo/dropdown
// (item 26 de heron-list-nest/docs/pedido-frontend-fase2.md), não pelo
// id numérico da tabela.
const ORDEM_PROTOCOLO = ['portage', 'vbmapp', 'pei'];
const ROTULO_PROTOCOLO: Record<string, string> = {
  portage: 'Portage',
  vbmapp: 'VB-MAPP',
  pei: 'Manual',
};

const iniciais = (nome = '') => {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return `${partes[0][0]}${ultima}`.toUpperCase();
};

export default function Protocolo() {
  const { hasPermition } = permissionAuth();

  const [dropDownList, setDropDownList] = useState<any>([]);
  const [trocandoPaciente, setTrocandoPaciente] = useState(false);
  // Respostas não salvas no Portage/VB-MAPP aberto — trocar de paciente ou
  // de protocolo desmonta o formulário e perderia essas respostas.
  const [pendentes, setPendentes] = useState(0);
  const [troca, setTroca] = useState<{ destino: string; fazer: () => void } | null>(null);
  const [salvando, setSalvando] = useState(false);
  // Salvar do Portage/VB-MAPP aberto (registrado por eles) — usado pelo
  // "Salvar" do sheet antes da troca.
  const salvarRef = useRef<(() => Promise<boolean>) | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const edicao = Boolean(state?.edit);

  const { control, watch, setValue } = useForm<any>({
    defaultValues: {
      protocoloId: OBJ,
      pacienteId: OBJ,
    },
  });

  const protocoloObj = watch('protocoloId');
  const pacienteObj = watch('pacienteId');
  const temPaciente = Boolean(pacienteObj?.id);

  const renderDropdown = useCallback(async () => {
    const [paciente, protocolo]: any = await Promise.all([
      dropDown('paciente'),
      dropDown('protocolo'),
    ]);

    setDropDownList({
      paciente,
      protocolo,
    });

    if (state?.tipoProtocolo) {
      const currentProtocolo = protocolo.filter(
        (item: any) => item.id === state.tipoProtocolo
      )[0];
      setValue('protocoloId', currentProtocolo);
    }

    if (state?.pacienteId) {
      setValue('pacienteId', state.pacienteId);
    }

    if (state?.item) {
      const currentPaciente = paciente.filter(
        (item: any) => state.item.paciente.id === item.id
      )[0];
      setValue('pacienteId', currentPaciente);
    }
  }, [state]);

  // state vem de useLocation().state e muda quando o usuário navega pra
  // essa mesma rota com dados diferentes (ex: PEI.tsx chamando navigate
  // com outro item pra editar), sem desmontar o componente — por isso
  // precisa estar na dependência: com [] o formulário ficaria com os
  // valores da edição anterior ao trocar de item sem sair da tela.
  useEffect(() => {
    renderDropdown();
  }, [renderDropdown]);

  // Pergunta (salvar ou descartar) antes de uma troca que perderia
  // respostas não salvas.
  const confirmarTroca = (destino: string, trocar: () => void) => {
    if (pendentes > 0) setTroca({ destino, fazer: trocar });
    else trocar();
  };

  const concluirTroca = () => {
    troca?.fazer();
    setPendentes(0);
    setTroca(null);
  };

  const protocolos = ORDEM_PROTOCOLO.map((codigo) =>
    (dropDownList.protocolo || []).find((p: any) => p?.codigo === codigo)
  ).filter(Boolean);

  const codigo = protocoloObj?.codigo;

  // Sem a permissão não dá pra escolher paciente/protocolo (antes os dois
  // dropdowns simplesmente sumiam). A edição que chega da tela PEI
  // (state.edit) continua funcionando.
  if (!hasPermition(PERMISSAO) && !edicao) {
    return (
      <section className="mt-2 bg-white border border-gray-200 rounded-[14px] px-4 py-5">
        <p className="m-0 text-[14px] leading-[1.45] text-gray-800">
          Seu perfil não tem acesso ao cadastro de protocolos.
        </p>
      </section>
    );
  }

  const seletorPaciente = (
    <Input
      key="pacienteId"
      labelText="Paciente"
      id="pacienteId"
      type="select"
      customCol="col-span-6"
      control={control}
      options={dropDownList.paciente}
      onChange={(valor) => {
        if (valor?.id) setTrocandoPaciente(false);
      }}
    />
  );

  return (
    <form className="mt-2 flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
      {!edicao && (!temPaciente || trocandoPaciente) ? (
        <section className="bg-white border border-gray-200 rounded-[14px] px-4 pt-5 pb-4 flex flex-col gap-2">
          {!temPaciente && (
            <div className="flex flex-col gap-1.5">
              <h2 className="m-0 text-[18px] font-bold text-[#27272a]">
                Quem você vai avaliar?
              </h2>
              <p className="m-0 text-[14px] leading-[1.45] text-gray-800">
                Escolha o paciente e depois o protocolo: Portage, VB-MAPP ou
                Manual.
              </p>
            </div>
          )}
          {seletorPaciente}
          {temPaciente && (
            <button
              type="button"
              onClick={() => setTrocandoPaciente(false)}
              className="self-end h-11 px-3 rounded-[10px] text-[14px] font-bold text-primary"
            >
              Cancelar
            </button>
          )}
        </section>
      ) : temPaciente && (
        <section className="bg-white border border-gray-200 rounded-[14px] pt-3 pb-3.5 pl-3.5 pr-2 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 shrink-0 rounded-full bg-[#f3e8f7] text-primary flex items-center justify-center text-[15px] font-bold">
              {iniciais(pacienteObj?.nome)}
            </div>
            <span className="flex-1 min-w-0 text-[16px] font-bold text-[#27272a] truncate">
              {pacienteObj?.nome}
            </span>
            {!edicao && (
              <button
                type="button"
                onClick={() =>
                  confirmarTroca('trocar de paciente', () => setTrocandoPaciente(true))
                }
                className="h-11 px-3 rounded-[10px] text-[14px] font-bold text-primary"
              >
                Trocar
              </button>
            )}
          </div>

          {/* Um seletor só, no lugar do dropdown de Protocolo. Na edição
              o protocolo já vem definido (PEI.tsx/Portage/VBMapp). */}
          {!edicao && protocolos.length > 0 && (
            <div className="mr-1.5">
              <Segmentado
                rotulo="Protocolo"
                variante="forte"
                opcoes={protocolos.map((p: any) => ({
                  valor: p.codigo as string,
                  label: ROTULO_PROTOCOLO[p.codigo] || p.nome,
                }))}
                valor={codigo || ''}
                onChange={(novo) => {
                  if (novo === codigo) return;
                  confirmarTroca('trocar de protocolo', () => {
                    setPendentes(0);
                    setValue(
                      'protocoloId',
                      protocolos.find((p: any) => p.codigo === novo)
                    );
                  });
                }}
              />
            </div>
          )}
        </section>
      )}

      {!edicao && temPaciente && !trocandoPaciente && !codigo && (
        <p className="m-0 px-1 text-[14px] text-gray-800">
          Escolha o protocolo acima para começar.
        </p>
      )}

      {!edicao && temPaciente && !trocandoPaciente && codigo === 'portage' && (
        <PORTAGECADASTRO
          paciente={pacienteObj}
          onAlteracoesChange={setPendentes}
          salvarRef={salvarRef}
        />
      )}
      {!edicao && temPaciente && !trocandoPaciente && codigo === 'vbmapp' && (
        <VBMapp
          paciente={pacienteObj}
          onAlteracoesChange={setPendentes}
          salvarRef={salvarRef}
        />
      )}
      {!edicao && temPaciente && !trocandoPaciente && codigo === 'pei' && (
        <PEICADASTRO paciente={pacienteObj} />
      )}
      {edicao && <PEICADASTRO paciente={pacienteObj} param={state} />}

      <SheetAlteracoes
        open={troca !== null}
        alteracoes={pendentes}
        destino={troca?.destino || 'trocar'}
        salvando={salvando}
        onSalvar={async () => {
          setSalvando(true);
          const ok = (await salvarRef.current?.()) ?? false;
          setSalvando(false);
          if (!ok) return; // erro já avisado pelo toast; continua aqui
          concluirTroca();
          // Limpa o state de retorno da edição (metaEdit/subitensSalvos)
          // do protocolo que ficou pra trás.
          navigate(location.pathname, { replace: true, state: null });
        }}
        onDescartar={concluirTroca}
        onCancelar={() => setTroca(null)}
      />
    </form>
  );
}
