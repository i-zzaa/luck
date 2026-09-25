import { MutableRefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { create, filter } from '../server';
import { TIPO_PROTOCOLO, VALOR_PORTAGE, VBMAPP } from '../constants/protocolo';
import { useToast } from '../contexts/toast';
import gerarPdf from '../constants/pdfVBMAPP';
import { NotFound } from '../components/notFound';
import { OBJ_ITEM, OBJ_META } from '../util/util';
import { useLocation, useNavigate } from 'react-router-dom';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { buildErrorToast } from '../util/error';
import {
  BarraSalvar,
  BotaoEditar,
  FiltroPendentes,
  GrupoAvaliacao,
  ItemAvaliacao,
  ProgressoGeral,
  Segmentado,
  SheetAlteracoes,
  contarAlteracoes,
  contarRespostas,
  itemPendente,
  somarContagens,
} from './protocolo/avaliacao';

const RASCUNHO_VBMAPP = 'rascunhoRespostasVBMapp';

const NIVEIS = [
  { valor: VBMAPP.um, label: 'Nível 1' },
  { valor: VBMAPP.dois, label: 'Nível 2' },
  { valor: VBMAPP.tres, label: 'Nível 3' },
];

export default function VBMapp({
  paciente,
  onAlteracoesChange,
  salvarRef,
}: {
  paciente: any;
  // Protocolo.tsx pergunta (salvar ou descartar) antes de trocar de
  // paciente/protocolo com resposta não salva — e usa salvarRef pra
  // salvar daqui antes da troca.
  onAlteracoesChange?: (quantidade: number) => void;
  salvarRef?: MutableRefObject<(() => Promise<boolean>) | null>;
}) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState({} as any);
  // Como veio do servidor (antes do rascunho) ou como foi salvo por
  // último — base do "N respostas não salvas".
  const [salvo, setSalvo] = useState({} as any);
  const [programaAberto, setProgramaAberto] = useState<string | null>(null);
  const [soPendentes, setSoPendentes] = useState(false);
  // Trocar de nível recarrega do servidor e perderia o que não foi salvo.
  const [nivelPendente, setNivelPendente] = useState<number | null>(null);
  const { renderToast } = useToast();

  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();

  // Voltando da edição de subitens (usePeiForm.ts), reabre no nível em
  // que o lápis foi clicado — antes sempre caía no Nível 1, mesmo
  // editando um programa do Nível 2/3.
  const voltandoDaEdicao =
    Array.isArray(state?.subitensSalvos) &&
    state?.pacienteId?.id === paciente.id &&
    state?.protocoloId === TIPO_PROTOCOLO.vbMapp;
  const nivelInicial = (voltandoDaEdicao && state?.nivel) || VBMAPP.um;

  const [nivel, setNivel] = useState(nivelInicial);
  const [existe, setExiste] = useState(false);

  const alteracoes = useMemo(() => contarAlteracoes(list, salvo), [list, salvo]);
  useEffect(() => {
    onAlteracoesChange?.(alteracoes);
  }, [alteracoes, onAlteracoesChange]);

  const exportPDF = useCallback(async () => {
    try {
      const { data } = await filter('protocolo', {
        pacienteId: paciente.id,
        protocoloId: TIPO_PROTOCOLO.vbMapp,
        type: 'pdf',
      });

      if (data) {
        await gerarPdf(data);
      } else {
        setLoading(false);
        renderToast({
          type: 'failure',
          title: 'Erro!',
          message: 'Não existe Portage cadastrado no momento!',
          open: true,
        });
      }
    } catch (error) {
      console.error('Erro ao gerar PDF', error);
    }
  }, [paciente.id, renderToast]);

  const getVBMapp = useCallback(
    async (nivelCurrent = nivel) => {
      const { data } = await filter('protocolo', {
        pacienteId: paciente.id,
        protocoloId: TIPO_PROTOCOLO.vbMapp,
        nivel: nivelCurrent,
      });

      setSalvo(JSON.parse(JSON.stringify(data.data || {})));
      setList(aplicarRascunho(data.data, nivelCurrent));
      setExiste(data.existeResposta);
    },
    [nivel, paciente.id]
  );

  // As atividades editadas no formulário do PEI já foram gravadas no
  // backend (PUT protocolo/vbmapp/meta/:id/subitens — item 16 do
  // heron-list-nest/docs/pedido-frontend-fase2.md), então a lista que
  // acabou de vir do servidor já está certa pra elas — sem mais costura
  // de state.metaEdit, ids compostos por regex nem filtro de "editável
  // removido". O único rascunho que sobra é o das respostas marcadas nas
  // OUTRAS atividades e ainda não salvas antes de clicar no lápis: essas
  // só existem no cliente, e sem isso seriam perdidas ao navegar pro
  // formulário. Aplicado uma vez só, por id, e só no mesmo paciente/nível.
  const aplicarRascunho = (listaServidor: any, nivelCurrent: number) => {
    const bruto = sessionStorage.getItem(RASCUNHO_VBMAPP);
    if (!voltandoDaEdicao || !bruto) return listaServidor;
    sessionStorage.removeItem(RASCUNHO_VBMAPP);

    const rascunho = JSON.parse(bruto);
    if (rascunho.pacienteId !== paciente.id || rascunho.nivel !== nivelCurrent) {
      return listaServidor;
    }

    const salvos = new Set(state.subitensSalvos.map(String));
    const lista = JSON.parse(JSON.stringify(listaServidor || {}));

    Object.keys(lista).forEach((programa) => {
      lista[programa] = lista[programa].map((item: any) => {
        const itemRascunho = (rascunho.list?.[programa] || []).find(
          (r: any) => r.id === item.id
        );
        if (!itemRascunho || salvos.has(String(item.id))) return item;

        return {
          ...item,
          selected: itemRascunho.selected,
          subitems: (item.subitems || []).map((sub: any) => ({
            ...sub,
            selected:
              (itemRascunho.subitems || []).find((s: any) => s.id === sub.id)
                ?.selected ?? sub.selected,
          })),
        };
      });
    });

    return lista;
  };

  // navegar=false quando o salvar vem antes de uma troca (nível aqui, ou
  // paciente/protocolo no Protocolo.tsx), que cuida do resto.
  const onSubmit = useCallback(async (navegar = true): Promise<boolean> => {
    setLoading(true);
    const payload = { pacienteId: paciente.id, vbmapp: list };

    try {
      await create('protocolo/vbmapp', payload);
      setExiste(true);
      setSalvo(JSON.parse(JSON.stringify(list)));
      sessionStorage.removeItem(RASCUNHO_VBMAPP);
      renderToast({
        type: 'success',
        title: 'Sucesso!',
        message: 'VB-MAPP salvo.',
        open: true,
      });

      // Continua no VB-MAPP, no mesmo nível (antes o protocolo era limpo
      // e a pessoa voltava pro seletor). O replace também tira
      // subitensSalvos/nivel do retorno da edição.
      if (navegar) {
        navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
          replace: true,
          state: { pacienteId: paciente, tipoProtocolo: TIPO_PROTOCOLO.vbMapp },
        });
      }
      return true;
    } catch (error) {
      console.error('Error saving form data', error);
      // Mensagem/código do backend em vez de "Falha na conexão" pra
      // qualquer erro: sem isso, um 4xx/5xx com motivo real (item
      // inválido, atividade inexistente) chegava na tela como se fosse
      // queda de rede — ver util/error.ts.
      renderToast(buildErrorToast(error, 'Falha na conexão'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [list, paciente, renderToast]);

  useEffect(() => {
    if (salvarRef) salvarRef.current = () => onSubmit(false);
  });

  const irParaNivel = (novo: number) => {
    setNivel(novo);
    setProgramaAberto(null);
    getVBMapp(novo);
  };

  const trocarNivel = (novo: number) => {
    if (novo === nivel) return;
    if (alteracoes > 0) setNivelPendente(novo);
    else irParaNivel(novo);
  };

  // Antes isso achava o item por `.id`, procurando em TODO item de topo e,
  // se não batesse, em TODOS os subitems dele também. Se um subitem
  // compartilhar `.id` com algum item de topo (comum quando vêm de
  // tabelas/sequências diferentes no backend), o clique podia acabar
  // resolvendo pro item errado — mesma causa do bug em Portage.tsx.
  // metaIndex/subItemIndex vêm direto de onde o item está sendo
  // renderizado (posição real na árvore), não dependem do `.id`.
  const onCheckboxChange = (
    programa: string,
    metaIndex: number,
    subItemIndex: number | undefined,
    newValue: VALOR_PORTAGE | null
  ) => {
    setList((prevList: any) => {
      const updatedList = { ...prevList };
      const items = [...(updatedList[programa] || [])];
      const item = items[metaIndex];
      if (!item) return prevList;

      if (subItemIndex !== undefined && subItemIndex !== null) {
        const subitems = [...(item.subitems || [])];
        if (!subitems[subItemIndex]) return prevList;
        subitems[subItemIndex] = {
          ...subitems[subItemIndex],
          selected: newValue,
        };
        items[metaIndex] = { ...item, subitems };
      } else {
        items[metaIndex] = { ...item, selected: newValue };
      }

      updatedList[programa] = items;
      return updatedList;
    });
  };

  const validItensPermiteSubitens = (programaList: any) => {
    const itensPermiteSubitens = programaList.filter(
      (item: any) => item.permiteSubitens
    );
    return !!itensPermiteSubitens.length;
  };

  const onClickAddSubItem = async (
    programaList: any,
    index: number,
    programa: string
  ) => {
    const itensPermiteSubitens = programaList.filter((item: any) => {
      return (item.subitems && item.subitems.length) || item.permiteSubitens;
    });

    const {
      estimuloDiscriminativo,
      estimuloReforcadorPositivo,
      procedimentoEnsinoId,
      resposta,
    } = itensPermiteSubitens[0];

    const meta = itensPermiteSubitens.map((item: any) => {
      // "N-meta-X" é só a chave de campo que o formulário do PEI
      // (usePeiForm.ts) espera; o id real da atividade vai em `vbmappId`,
      // que é o que o PUT de subitens usa — nada é extraído de volta do
      // id composto por regex.
      const id = `${index}-meta-${item.id}`;

      const objeto: any = {
        ...OBJ_META,
        value: item.nome,
        ...item,
        respostaSessao: item?.respostaSessao,
        id,
        vbmappId: item.id,
      };

      if (item?.subitems) {
        const subitems = item?.subitems.map((subitem: any) => {
          const selected = subitem?.selected
            ? { selected: subitem.selected }
            : {};
          return {
            ...OBJ_ITEM,
            id: subitem.id,
            value: subitem.nome,
            ...selected,
          };
        });

        objeto.subitems = subitems;
      }

      return objeto;
    });

    // Rascunho das respostas ainda não salvas do nível (ver
    // aplicarRascunho) — com paciente e nível, pra não vazar pra outro.
    sessionStorage.setItem(
      RASCUNHO_VBMAPP,
      JSON.stringify({ pacienteId: paciente.id, nivel, list })
    );

    navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
      state: {
        edit: true,
        nivel,
        item: {
          metas: meta,
          paciente,
          estimuloDiscriminativo,
          estimuloReforcadorPositivo,
          procedimentoEnsinoId,
          programa,
          resposta,
        },
        programa,
        tipoProtocolo: TIPO_PROTOCOLO.vbMapp,
      },
    });
  };

  // getVBMapp já é memoizado a partir de [nivel, paciente.id] — depender
  // também do objeto `paciente` aqui era redundante e perigoso: o
  // componente pai (Protocolo.tsx) usa watch() no topo do form e
  // re-renderiza a cada campo alterado, o que pode entregar uma referência
  // nova de `paciente` mesmo sendo o mesmo paciente.id, refazendo o
  // POST /protocolo/filtro à toa a cada re-render.
  useEffect(() => {
    getVBMapp();
  }, [getVBMapp]);

  const programas = Object.keys(list || {});
  const contagemGeral = somarContagens(
    programas.map((programa) => contarRespostas(list[programa]))
  );

  return (
    <div className="mt-3 flex flex-col gap-3 pb-40">
      <ProgressoGeral
        contagem={contagemGeral}
        protocolo={`Nível ${nivel}`}
        onRelatorio={existe ? exportPDF : undefined}
      />
      <Segmentado rotulo="Nível" opcoes={NIVEIS} valor={nivel} onChange={trocarNivel} />
      <FiltroPendentes ativo={soPendentes} onChange={setSoPendentes} />

      {programas.length === 0 && <NotFound />}

      {programas.map((programa, keys) => {
        const itens: any[] = list[programa] || [];
        const visiveis = itens
          .map((item, metaIndex) => ({ item, metaIndex }))
          .filter(({ item }) => !soPendentes || itemPendente(item));

        return (
          <GrupoAvaliacao
            key={programa}
            titulo={programa}
            contagem={contarRespostas(itens)}
            open={programaAberto === programa}
            onToggle={() =>
              setProgramaAberto(programaAberto === programa ? null : programa)
            }
            vazio={soPendentes && visiveis.length === 0}
            acao={
              validItensPermiteSubitens(itens) ? (
                <div className="pt-2.5">
                  <BotaoEditar
                    texto="Editar atividades do programa"
                    onClick={() => onClickAddSubItem(itens, keys, programa)}
                  />
                </div>
              ) : undefined
            }
          >
            {visiveis.map(({ item, metaIndex }) => (
              <ItemAvaliacao
                key={item.id ?? metaIndex}
                item={item}
                onResponder={(valor) =>
                  onCheckboxChange(programa, metaIndex, undefined, valor)
                }
                onResponderSub={(subIndex, valor) =>
                  onCheckboxChange(programa, metaIndex, subIndex, valor)
                }
              />
            ))}
          </GrupoAvaliacao>
        );
      })}

      <BarraSalvar alteracoes={alteracoes} loading={loading} onSalvar={() => onSubmit()} />

      <SheetAlteracoes
        open={nivelPendente !== null}
        alteracoes={alteracoes}
        destino="trocar de nível"
        salvando={loading}
        onSalvar={async () => {
          const destino = nivelPendente;
          if ((await onSubmit(false)) && destino !== null) {
            setNivelPendente(null);
            irParaNivel(destino);
          }
        }}
        onDescartar={() => {
          if (nivelPendente !== null) irParaNivel(nivelPendente);
          setNivelPendente(null);
        }}
        onCancelar={() => setNivelPendente(null)}
      />
    </div>
  );
}
