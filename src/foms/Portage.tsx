import { MutableRefObject, useEffect, useMemo, useState } from 'react';
import { create, dropDown, filter } from '../server';
import {
  TIPO_PORTAGE,
  TIPO_PROTOCOLO,
  VALOR_PORTAGE,
} from '../constants/protocolo';
import { useToast } from '../contexts/toast';
import gerarPdf from '../constants/pdfPortage';
import { useLocation, useNavigate } from 'react-router-dom';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { OBJ_ITEM, OBJ_META } from '../util/util';
import {
  BarraSalvar,
  BotaoEditar,
  FiltroPendentes,
  GrupoAvaliacao,
  ItemAvaliacao,
  ProgressoGeral,
  Segmentado,
  contarAlteracoes,
  contarRespostas,
  itemPendente,
  somarContagens,
} from './protocolo/avaliacao';

const AREAS = [TIPO_PORTAGE.socializacao, TIPO_PORTAGE.cognicao];

// "0 a 1" → "0 a 1 ano"; "1 a 2" → "1 a 2 anos". Só completa quando a
// faixa vem no formato numérico de sempre.
const rotuloFaixa = (faixa: string) => {
  const m = /^\s*(\d+)\s*a\s*(\d+)\s*$/.exec(faixa);
  if (!m) return faixa;
  return `${m[1]} a ${m[2]} ${m[2] === '1' ? 'ano' : 'anos'}`;
};

// list[área][faixa] → { "área|faixa": itens } pra comparar com o salvo.
const porFaixa = (lista: any) => {
  const r: Record<string, any[]> = {};
  Object.keys(lista || {}).forEach((area) =>
    Object.keys(lista[area] || {}).forEach((faixa) => {
      r[`${area}|${faixa}`] = lista[area][faixa] || [];
    })
  );
  return r;
};

export default function PortageCadastro({
  paciente,
  onAlteracoesChange,
  salvarRef,
}: {
  paciente: { id: number; nome: string };
  // Protocolo.tsx pergunta (salvar ou descartar) antes de trocar de
  // paciente/protocolo com resposta não salva — e usa salvarRef pra
  // salvar daqui antes da troca.
  onAlteracoesChange?: (quantidade: number) => void;
  salvarRef?: MutableRefObject<(() => Promise<boolean>) | null>;
}) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<any>({});
  // Última versão salva (ou vinda do servidor) — base do "N respostas não
  // salvas". Tirada ANTES de aplicar rascunhos (prePEIList/draftSubitems),
  // que são justamente o que ainda não foi salvo.
  const [salvo, setSalvo] = useState<any>({});
  const [area, setArea] = useState<string>(TIPO_PORTAGE.socializacao);
  const [faixaAberta, setFaixaAberta] = useState<string | null>(null);
  const [soPendentes, setSoPendentes] = useState(false);
  const { renderToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const [existePortage, setExistePortage] = useState(false);

  const alteracoes = useMemo(
    () => contarAlteracoes(porFaixa(list), porFaixa(salvo)),
    [list, salvo]
  );
  useEffect(() => {
    onAlteracoesChange?.(alteracoes);
  }, [alteracoes, onAlteracoesChange]);

  const exportPDF = async () => {
    const { data }: any = await filter('protocolo', {
      pacienteId: paciente.id,
      protocoloId: TIPO_PROTOCOLO.portage,
      type: 'pdf',
    });
    if (data) await gerarPdf(data);
    else {
      setLoading(false);
      renderToast({
        type: 'failure',
        title: 'Erro!',
        message: 'Não existe Portage cadastrado no momento!',
        open: true,
      });
    }
  };

  // Antes isso reencontrava o item por `.id` (e, pra subitem, tentava
  // re-derivar o id do pai fazendo parse de "0-meta-N-sub-item-M" na
  // marra). Isso quebra silenciosamente sempre que o id real não segue
  // esse formato composto (aí cai no ramo de item de topo) ou quando dois
  // itens em pontos diferentes da árvore compartilham o mesmo `.id` (bem
  // comum quando meta e subitem vêm de tabelas/sequências diferentes no
  // backend) — o clique acaba resolvendo pro primeiro item com aquele id,
  // não pro que foi realmente clicado. Índice de verdade (metaIndex/
  // subItemIndex), vindo direto de onde o item está sendo renderizado,
  // não depende de nenhuma suposição sobre o formato do id.
  const onCheckboxChange = (
    portageType: string,
    faixaEtaria: string,
    metaIndex: number,
    subItemIndex: number | undefined,
    value: VALOR_PORTAGE | null
  ) => {
    setList((prevList: any) => {
      const updatedSelection = JSON.parse(JSON.stringify(prevList));
      const activities = updatedSelection?.[portageType]?.[faixaEtaria];
      const meta = activities?.[metaIndex];
      if (!meta) return prevList;

      if (subItemIndex !== undefined && subItemIndex !== null) {
        const sub = meta.subitems?.[subItemIndex];
        if (!sub) return prevList;
        sub.selected = value;
      } else {
        meta.selected = value;
      }

      return updatedSelection;
    });
  };

  // navegar=false quando quem salva é o Protocolo.tsx antes de trocar de
  // paciente/protocolo: ele mesmo cuida da navegação depois.
  const onSubmit = async (navegar = true): Promise<boolean> => {
    setLoading(true);
    const payload = { pacienteId: paciente, portage: list };
    try {
      await create('protocolo/portage', payload);
      sessionStorage.removeItem('draftSubitems');
      sessionStorage.removeItem('prePEIList');
      setExistePortage(true);
      setSalvo(JSON.parse(JSON.stringify(list)));
      renderToast({
        type: 'success',
        title: 'Sucesso!',
        message: 'Portage salvo.',
        open: true,
      });
      // Continua no Portage depois de salvar (antes o protocolo era
      // limpo e a pessoa voltava pro seletor). O replace só tira o
      // `metaEdit` do state, pra ele não ser reaplicado.
      if (navegar) {
        navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
          replace: true,
          state: { pacienteId: paciente, tipoProtocolo: TIPO_PROTOCOLO.portage },
        });
      }
      return true;
    } catch (error) {
      console.error('Error saving form data', error);
      renderToast({
        type: 'failure',
        title: 'Erro!',
        message: 'Falha na conexão',
        open: true,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (salvarRef) salvarRef.current = () => onSubmit(false);
  });

  const onClickAddSubItem = (item: any) => {
    const id = item.id.toString().startsWith('0-meta-')
      ? item.id
      : `0-meta-${item.id}`;
    const selectedMeta = item?.selected ? { selected: item.selected } : {};
    const programa = item?.programaId || item?.programa;

    const meta = {
      ...OBJ_META,
      id,
      value: item.nome,
      faixaEtaria: item.faixaEtaria,
      estimuloDiscriminativo: item?.estimuloDiscriminativo,
      estimuloReforcadorPositivo: item?.estimuloReforcadorPositivo,
      procedimentoEnsino: item?.procedimentoEnsinoId,
      programa,
      resposta: item?.resposta,
      ...selectedMeta,
      subitems:
        item?.subitems?.map((sub: any) => ({
          ...OBJ_ITEM,
          id: sub.id,
          value: sub.nome,
          ...(sub.selected && { selected: sub.selected }),
        })) || [],
    };
    const existingDrafts = JSON.parse(
      sessionStorage.getItem('draftSubitems') || '[]'
    );
    const metaId = parseInt(meta.id.replace(/^0-meta-/, ''), 10);
    const updatedDrafts = existingDrafts.filter(
      (m: any) => parseInt(m.id.replace(/^0-meta-/, '')) !== metaId
    );
    updatedDrafts.push(meta);
    sessionStorage.setItem('draftSubitems', JSON.stringify(updatedDrafts));
    sessionStorage.setItem('prePEIList', JSON.stringify(list));
    navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
      state: {
        edit: true,
        item: { metas: [meta], paciente, programa },
        tipoProtocolo: TIPO_PROTOCOLO.portage,
      },
    });
  };

  useEffect(() => {
    if (
      state?.metaEdit &&
      state.protocoloId === TIPO_PROTOCOLO.portage &&
      state.pacienteId.id == paciente.id
    ) {
      const drafts = JSON.parse(
        sessionStorage.getItem('draftSubitems') || '[]'
      );
      const id = state.metaEdit.id;
      const index = drafts.findIndex((m: any) => m.id === id);
      if (index !== -1) drafts[index] = { ...state.metaEdit };
      else drafts.push(state.metaEdit);
      sessionStorage.setItem('draftSubitems', JSON.stringify(drafts));
    }

    const init = async () => {
      let listAtual;
      const { data }: any = await filter('protocolo', {
        pacienteId: paciente.id,
        protocoloId: TIPO_PROTOCOLO.portage,
        type: 'local',
      });

      if (data?.portage) {
        setExistePortage(true);
        listAtual = JSON.parse(JSON.stringify(data.portage));
      } else {
        setExistePortage(false);
        const atividade = await dropDown('protocolo/portage');
        listAtual = JSON.parse(JSON.stringify(atividade));
      }
      setSalvo(JSON.parse(JSON.stringify(listAtual)));

      const prePEIList = JSON.parse(
        sessionStorage.getItem('prePEIList') || '{}'
      );

      const mergeSelected = (newItems: any[], oldItems: any[]) => {
        return newItems.map((newItem: any) => {
          const oldItem = oldItems.find((o: any) => o.id === newItem.id);
          const merged = { ...newItem };
          if (oldItem) {
            if (oldItem.selected !== undefined)
              merged.selected = oldItem.selected;
            if (newItem.subitems?.length && oldItem.subitems?.length) {
              merged.subitems = mergeSelected(
                newItem.subitems,
                oldItem.subitems
              );
            }
          }
          return merged;
        });
      };

      for (const programa in listAtual) {
        for (const faixa in listAtual[programa]) {
          const newItems = listAtual[programa][faixa];
          const oldItems = prePEIList?.[programa]?.[faixa] || [];
          listAtual[programa][faixa] = mergeSelected(newItems, oldItems);
        }
      }

      if (
        state?.metaEdit &&
        state.protocoloId === TIPO_PROTOCOLO.portage &&
        state.pacienteId.id == paciente.id
      ) {
        const idMetaEdit = parseInt(
          state.metaEdit.id.replace(/^0-meta-/, ''),
          10
        );
        const programa = state.metaEdit.programa;
        const faixaEtaria = state.metaEdit.faixaEtaria;

        if (!listAtual[programa]) listAtual[programa] = {};
        if (!listAtual[programa][faixaEtaria])
          listAtual[programa][faixaEtaria] = [];

        const metaIndex = listAtual[programa][faixaEtaria].findIndex(
          (m: any) =>
            parseInt(m.id.toString().replace(/^0-meta-/, ''), 10) === idMetaEdit
        );

        const preMeta = prePEIList?.[programa]?.[faixaEtaria]?.find(
          (m: any) =>
            parseInt(m.id.toString().replace(/^0-meta-/, ''), 10) === idMetaEdit
        );

        const mergeSubitems = (newSubs: any[], preSubs: any[]) => {
          return newSubs.map((sub: any) => {
            const preSub = preSubs.find((s: any) => s.id === sub.id);
            return {
              ...sub,
              selected: preSub?.selected ?? sub.selected ?? null,
            };
          });
        };

        const updatedMeta = {
          ...state.metaEdit,
          selected: preMeta?.selected ?? state.metaEdit.selected ?? null,
          subitems: mergeSubitems(
            state.metaEdit.subitems ?? [],
            preMeta?.subitems ?? []
          ),
        };

        if (metaIndex !== -1)
          listAtual[programa][faixaEtaria][metaIndex] = updatedMeta;
        else listAtual[programa][faixaEtaria].push(updatedMeta);
      }

      const drafts = JSON.parse(
        sessionStorage.getItem('draftSubitems') || '[]'
      );
      if (drafts.length > 0) {
        for (const meta of drafts) {
          const programa = meta.programa;
          const faixaEtaria = meta.faixaEtaria;
          const metaId = parseInt(meta.id.replace(/^0-meta-/, ''), 10);
          if (!listAtual[programa]) listAtual[programa] = {};
          if (!listAtual[programa][faixaEtaria])
            listAtual[programa][faixaEtaria] = [];
          const metas = listAtual[programa][faixaEtaria];
          const index = metas.findIndex(
            (m: any) => m.id === metaId || m.id === meta.id
          );
          if (index !== -1) {
            const oldSubitems = metas[index].subitems || [];
            const newSubitems = meta.subitems || [];
            const updatedSubitems = newSubitems.map((draftSub: any) => {
              const selected =
                draftSub.selected !== undefined
                  ? draftSub.selected
                  : oldSubitems.find((s: any) => s.id === draftSub.id)
                      ?.selected;
              return { ...draftSub, selected };
            });
            metas[index] = {
              ...metas[index],
              ...meta,
              subitems: updatedSubitems,
            };
          } else {
            metas.push(meta);
          }
        }
      }

      setList(listAtual);
    };

    init();
    // Depender do objeto `paciente` inteiro (em vez do id) refazia o POST
    // /protocolo/filtro sempre que o componente pai (Protocolo.tsx, que usa
    // watch() no topo do form) entregava uma nova referência de `paciente`
    // — mesmo sendo o mesmo paciente.id. Mesma causa do fix em VBMapp.tsx.
  }, [paciente?.id]);

  const contagemGeral = somarContagens(
    Object.values(porFaixa(list)).map((itens) => contarRespostas(itens))
  );
  const faixas = Object.keys(list?.[area] || {});

  return (
    <div className="mt-3 flex flex-col gap-3 pb-40">
      <ProgressoGeral
        contagem={contagemGeral}
        protocolo="Portage"
        onRelatorio={existePortage ? exportPDF : undefined}
      />
      <Segmentado
        rotulo="Área"
        opcoes={AREAS.map((a) => ({ valor: a, label: a }))}
        valor={area}
        onChange={(novaArea) => {
          setArea(novaArea);
          setFaixaAberta(null);
        }}
      />
      <FiltroPendentes ativo={soPendentes} onChange={setSoPendentes} />

      {faixas.map((faixa) => {
        const itens: any[] = list[area][faixa] || [];
        const visiveis = itens
          .map((item, metaIndex) => ({ item, metaIndex }))
          .filter(({ item }) => !soPendentes || itemPendente(item));
        const chave = `${area}|${faixa}`;

        return (
          <GrupoAvaliacao
            key={chave}
            titulo={rotuloFaixa(faixa)}
            contagem={contarRespostas(itens)}
            open={faixaAberta === chave}
            onToggle={() => setFaixaAberta(faixaAberta === chave ? null : chave)}
            vazio={soPendentes && visiveis.length === 0}
          >
            {visiveis.map(({ item, metaIndex }) => (
              <ItemAvaliacao
                key={item.id ?? metaIndex}
                item={item}
                onResponder={(valor) =>
                  onCheckboxChange(area, faixa, metaIndex, undefined, valor)
                }
                onResponderSub={(subIndex, valor) =>
                  onCheckboxChange(area, faixa, metaIndex, subIndex, valor)
                }
                acao={
                  item?.permiteSubitens ? (
                    <BotaoEditar texto="Subitens" onClick={() => onClickAddSubItem(item)} />
                  ) : undefined
                }
              />
            ))}
          </GrupoAvaliacao>
        );
      })}

      <BarraSalvar alteracoes={alteracoes} loading={loading} onSalvar={() => onSubmit()} />
    </div>
  );
}
