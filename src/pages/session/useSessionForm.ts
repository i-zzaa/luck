// src/hooks/useSessionForm.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TIPO_PROTOCOLO } from '../../constants/protocolo';
import { CONSTANTES_ROUTERS } from '../../routes/OtherRoutes';
import { useToast } from '../../contexts/toast';
import { create, getList, update } from '../../server';
import moment from 'moment';
import { STATUS_EVENTS } from '../../constants/schedule';

const ACTIVITY = 'activity';
const MAINTENANCE = 'maintenance';
const PORTAGE = 'portage';
const VBMAPP = 'vbmapp';

type TipoProtocolo = 'vbmapp' | 'portage' | 'maintenance' | 'activity';

// helpers
const isObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
const isPrimitiveOrNull = (v: any) => v === null || !isObj(v);

// `content` é HTML vindo do RichTextEditor (Tiptap) — um editor "vazio"
// não é string vazia, é algo como "<p></p>". Precisa tirar as tags e os
// espaços/&nbsp; pra saber se o resumo tem texto de verdade.
const isResumoVazio = (html: string) =>
  (html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim().length === 0;

const padSlots = (arr: any[], count: number) => {
  const base = Array.isArray(arr) ? arr.slice(0, count) : [];
  if (base.length < count) {
    base.push(...Array.from({ length: count - base.length }, () => null));
  }
  return base;
};

export const useSessionForm = () => {
  const { renderToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location as any;
  const editor = useRef(null);

  const [repeatActivity] = useState(10);
  const [repeatMaintenance] = useState(1);
  const [content, setContent] = useState('');
  const [list, setList] = useState<any[]>([]);
  const [listMaintenance, setListMaintenance] = useState<any>({
    manual: [],
    vbmapp: [],
    portage: [],
  });
  const [listPortage, setListPortage] = useState<any[]>([]);
  const [listVBMapp, setListVBMapp] = useState<any[]>([]);
  const [dtt, setDTT] = useState<any[]>([]);
  // selectedMaintenanceKeys (por categoria)
  const [maintenance, setMaintenance] = useState<any>({
    manual: {},
    vbmapp: {},
    portage: {},
  });
  const [session, setSession] = useState<any>({});
  const [portage, setPortage] = useState<any[]>([]);
  const [vbmapp, setVBMapp] = useState<any[]>([]);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * GENÉRICO: entende children e subitems; cria slots no penúltimo nível ou em folhas puras.
   */
  const transformGenericNode = useCallback(
    async (node: any, type: string): Promise<any> => {
      const slotCount =
        type === ACTIVITY || type === PORTAGE || type === VBMAPP
          ? repeatActivity
          : repeatMaintenance;

      const out: any = {
        key: String(node?.key ?? node?.id ?? ''),
        label: node?.label ?? node?.nome ?? '',
        estimuloDiscriminativo: node?.estimuloDiscriminativo ?? '',
        estimuloReforcadorPositivo: node?.estimuloReforcadorPositivo ?? '',
        resposta: node?.resposta ?? '',
      };

      // Normaliza possíveis filhos (children/subitems)
      const kids: any[] = (() => {
        if (Array.isArray(node?.children) && node.children.length) {
          return node.children;
        }
        if (Array.isArray(node?.subitems) && node.subitems.length) {
          return node.subitems.map((si: any) => ({
            ...si,
            key: String(si?.key ?? si?.id ?? ''),
            label: si?.label ?? si?.nome ?? '',
            children: Array.isArray(si?.children) ? si.children : undefined,
            subitems: Array.isArray(si?.subitems) ? si.subitems : undefined,
          }));
        }
        return [];
      })();

      if (kids.length > 0) {
        // CASO 1: folha com array de slots (primitivos/null) -> usa direto e padroniza
        if (kids.every(isPrimitiveOrNull)) {
          out.children = padSlots(kids, slotCount);
          return out;
        }

        // CASO 2: array de objetos "folhas" (sem children/subitems -> penúltimo nível)
        const isLeafObject = (k: any) =>
          isObj(k) &&
          !Array.isArray(k?.children) &&
          !Array.isArray(k?.subitems);

        if (kids.every(isLeafObject)) {
          out.children = kids.map((sub: any) => ({
            key: String(sub?.key ?? sub?.id ?? ''),
            label: sub?.label ?? sub?.nome ?? '',
            estimuloDiscriminativo: sub?.estimuloDiscriminativo ?? '',
            estimuloReforcadorPositivo: sub?.estimuloReforcadorPositivo ?? '',
            resposta: sub?.resposta ?? '',
            // se o sub já trouxer um array de slots, preserva; senão cria
            children:
              Array.isArray(sub?.children) &&
              sub.children.every(isPrimitiveOrNull)
                ? padSlots(sub.children, slotCount)
                : Array.from({ length: slotCount }, () => null),
          }));
          return out;
        }

        // CASO 3: nó interno -> recursão
        out.children = await Promise.all(
          kids.map((ch: any) => transformGenericNode(ch, type))
        );
        return out;
      }

      // Sem filhos: folha pura -> cria slots vazios
      out.children = Array.from({ length: slotCount }, () => null);
      return out;
    },
    [repeatActivity, repeatMaintenance]
  );

  // "Manual": pode usar o genérico (já entende subitems/children)
  const transformManualNode = useCallback(
    async (node: any, type: string) => transformGenericNode(node, type),
    [transformGenericNode]
  );

  // Transforma uma árvore simples (array de nós) para slots
  const transformGenericTree = useCallback(
    async (nodes: any[] = [], type: string) => {
      return Promise.all(nodes.map((n) => transformGenericNode(n, type)));
    },
    [transformGenericNode]
  );

  // Transforma o OBJETO de manutenção { manual, vbmapp, portage }
  const transformMaintenanceObject = useCallback(
    async (maintenanceObj: any = {}) => {
      const manual = await transformGenericTree(
        maintenanceObj?.manual || [],
        MAINTENANCE
      );
      const vbmapp = await transformGenericTree(
        maintenanceObj?.vbmapp || [],
        MAINTENANCE
      );
      const portage = await transformGenericTree(
        maintenanceObj?.portage || [],
        MAINTENANCE
      );
      return { manual, vbmapp, portage };
    },
    [transformGenericTree]
  );

  // PORTAGE: usa o genérico
  const transformPortageNode = useCallback(
    (node: any) => transformGenericNode(node, PORTAGE),
    [transformGenericNode]
  );

  // VBMapp: conserva sua especialização (mas poderia usar o genérico também)
  const transformVBMappNode = useCallback(
    async (node: any): Promise<any> => {
      const out: any = {
        key: String(node?.key ?? node?.id ?? ''),
        label: node?.label ?? node?.nome ?? '',
        estimuloDiscriminativo: node?.estimuloDiscriminativo ?? '',
        estimuloReforcadorPositivo: node?.estimuloReforcadorPositivo ?? '',
        resposta: node?.resposta ?? '',
      };

      const isPlainObject = (v: any) =>
        v !== null && typeof v === 'object' && !Array.isArray(v);

      const isPrimitiveOrNull = (v: any) => v === null || !isPlainObject(v);

      const padToRepeat = (arr: any[]) => {
        const base = Array.isArray(arr) ? arr.slice(0, repeatActivity) : [];
        if (base.length < repeatActivity) {
          base.push(
            ...Array.from({ length: repeatActivity - base.length }, () => null)
          );
        }
        return base;
      };

      const ch = node?.children;

      if (Array.isArray(ch) && ch.length > 0) {
        // Caso 1: folha com array de valores (primitivos/null)
        if (ch.every(isPrimitiveOrNull)) {
          out.children = padToRepeat(ch);
          return out;
        }

        // Caso 2: array de objetos (pode ser subitens ou nós internos)
        const first = ch[0];

        // 2.a) Subitens: objetos sem "children" (ou "children" não-array)
        if (isPlainObject(first) && !Array.isArray(first.children)) {
          out.children = ch.map((sub: any) => {
            const subOut: any = {
              key: String(sub?.key ?? sub?.id ?? ''),
              label: sub?.label ?? sub?.nome ?? '',
              permiteSubitens: !!sub?.permiteSubitens,
            };

            // Se o subitem já vier com children de primitivos, normaliza; senão, preenche com null
            if (
              Array.isArray(sub?.children) &&
              sub.children.length > 0 &&
              sub.children.every(isPrimitiveOrNull)
            ) {
              subOut.children = padToRepeat(sub.children);
            } else {
              subOut.children = Array.from({ length: repeatActivity }).map(
                () => null
              );
            }

            return subOut;
          });
          return out;
        }

        // 2.b) Nós internos com filhos-objetos (recursão)
        out.children = await Promise.all(
          ch.map((child: any) => transformVBMappNode(child))
        );
        return out;
      }

      // Sem filhos: criar slots vazios
      out.children = Array.from({ length: repeatActivity }).map(() => null);
      return out;
    },
    [repeatActivity]
  );

  const formatarDado = useCallback(
    async (
      data: any,
      type = ACTIVITY,
      protocolo: any = TIPO_PROTOCOLO.portage
    ) => {
      // Maintenance agora é OBJETO
      if (
        type === MAINTENANCE &&
        data &&
        typeof data === 'object' &&
        !Array.isArray(data)
      ) {
        return transformMaintenanceObject(data);
      }

      if (protocolo === TIPO_PROTOCOLO.vbMapp) {
        return Promise.all(
          (data || []).map((node: any) => transformVBMappNode(node))
        );
      }
      if (type === PORTAGE) {
        return Promise.all(
          (data || []).map((node: any) => transformPortageNode(node))
        );
      }
      // atividade/maintenance genérico em ÁRVORE (array)
      return Promise.all(
        (data || []).map((node: any) => transformManualNode(node, type))
      );
    },
    [
      transformMaintenanceObject,
      transformManualNode,
      transformPortageNode,
      transformVBMappNode,
    ]
  );

  const getActivity = useCallback(async () => {
    try {
      const result = await getList(
        `/pei/activity/session/${state.item.paciente.id}`
      );

      const [atividades, maintenanceObj, portageTree, vbmappTree]: any =
        await Promise.all([
          formatarDado(result?.atividades || [], ACTIVITY),
          formatarDado(
            result?.maintenance || { manual: [], vbmapp: [], portage: [] },
            MAINTENANCE
          ),
          formatarDado(result?.portage || [], PORTAGE, TIPO_PROTOCOLO.portage),
          formatarDado(result?.vbmapp || [], VBMAPP, TIPO_PROTOCOLO.vbMapp),
        ]);

      setList(atividades);
      setListMaintenance(maintenanceObj); // objeto { manual, vbmapp, portage }
      setListPortage(portageTree);
      setListVBMapp(vbmappTree);
      setVBMapp(vbmappTree);
      setDTT(result?.sessao || []);
    } catch (e) {
      console.error('Erro ao buscar atividades', e);
      renderToast({
        type: 'failure',
        title: 'Erro',
        message: 'Não foi possível carregar as atividades.',
        open: true,
      });
    }
  }, [formatarDado, state, renderToast]);

  const getSumaryContent = useCallback(async () => {
    try {
      const dateSession = state?.item?.date; // ex.: 'YYYY-MM-DD' ou ISO
      const isAttended =
        state?.item?.statusEventos.nome === STATUS_EVENTS.atendido;

      // hoje > data da sessão (comparação por dia, ignorando horas)
      const isPast = moment()
        .startOf('day')
        .isAfter(moment(dateSession).startOf('day'));

      if (isAttended || isPast) {
        const result: any = await getList(`/sessao/${state.item.id}`);

        if (result) {
          setContent(result.resumo);
          setSession(result);
          setIsEdit(true);

          const [atividades, maintenanceObj, portageTree, vbmappTree]: any =
            await Promise.all([
              formatarDado(result?.sessao || [], ACTIVITY),
              formatarDado(
                result?.maintenance || { manual: [], vbmapp: [], portage: [] },
                MAINTENANCE
              ),
              formatarDado(
                result?.portage || [],
                PORTAGE,
                TIPO_PROTOCOLO.portage
              ),
              formatarDado(result?.vbmapp || [], VBMAPP, TIPO_PROTOCOLO.vbMapp),
            ]);

          setList(atividades);
          setListMaintenance(maintenanceObj); // objeto
          setListPortage(portageTree);
          setListVBMapp(vbmappTree);
          setVBMapp(vbmappTree);
          setDTT(result?.sessao || []);
          return; // encerra aqui se deu certo
        }
        // se não veio sessão válida, cai pro fluxo padrão
      }

      // Caso não esteja atendida e não seja passado, ou se não veio sessão válida:
      await getActivity();
    } catch (e) {
      console.error('Erro ao buscar conteúdo da sessão', e);
      renderToast({
        type: 'failure',
        title: 'Erro',
        message: 'Não foi possível carregar a sessão.',
        open: true,
      });
      // fallback para garantir que algo é carregado
      await getActivity();
    }
  }, [formatarDado, getActivity, state, renderToast]);

  const handleSubmitSumary = useCallback(async () => {
    if (isResumoVazio(content)) {
      renderToast({
        type: 'failure',
        title: 'Resumo obrigatório',
        message: 'Escreva o resumo da sessão antes de salvar.',
        open: true,
      });
      return;
    }

    try {
      const payload = {
        // ...session precisa vir PRIMEIRO: session guarda o registro cru
        // que veio do GET inicial (mesmas chaves: sessao, maintenance,
        // resumo, portage, vbmapp — confira em getSumaryContent). Com o
        // spread depois dos campos frescos, ele sobrescrevia toda edição
        // do usuário com os valores originais pré-edição na hora de
        // salvar. Hoje isEdit desabilita o botão Salvar, então esse
        // caminho não é alcançável pela UI — mas é uma bomba-relógio pra
        // quando a edição for reativada.
        ...session,
        calendarioId: state.item.id,
        pacienteId: state.item.paciente.id,
        sessao: dtt,
        // lista transformada (objeto com árvores com slots)
        maintenance: listMaintenance,
        // chaves selecionadas por categoria
        selectedMaintenanceKeys: maintenance,
        resumo: content,
        date: state.item.date,
        portage,
        vbmapp,
      };
      if (isEdit) await update('/sessao', payload);
      else await create('/sessao', payload);
      renderToast({
        type: 'success',
        message: 'Sessão atualizada!',
        open: true,
        title: '',
      });
      navigate(`/${CONSTANTES_ROUTERS.CALENDAR}`);
    } catch (error) {
      renderToast({
        type: 'failure',
        message: 'Sessão não atualizada!',
        open: true,
        title: '401',
      });
    }
  }, [
    state,
    dtt,
    listMaintenance,
    maintenance,
    content,
    portage,
    vbmapp,
    session,
    isEdit,
    navigate,
    renderToast,
  ]);

  useEffect(() => {
    // location.state some ao dar F5, abrir o link direto ou em aba nova
    // (react-router guarda state em memória, não na URL). Sem esse guard,
    // renderHeader (em Session.tsx) e getSumaryContent/getActivity tentam
    // ler state.item.* de um state null/undefined e derrubam a página
    // inteira — não existe Error Boundary no projeto, então a tela fica em
    // branco sem explicação nem forma de sair de lá.
    if (!state?.item) {
      renderToast({
        type: 'failure',
        title: 'Erro',
        message: 'Sessão não encontrada. Acesse pela agenda.',
        open: true,
      });
      navigate(`/${CONSTANTES_ROUTERS.CALENDAR}`);
      return;
    }

    getSumaryContent();
  }, [getSumaryContent, state, navigate, renderToast]);

  return {
    editor,
    content,
    setContent,
    list,
    listMaintenance, // objeto { manual, vbmapp, portage }
    listPortage,
    listVBMapp,
    dtt,
    maintenance, // selectedMaintenanceKeys { manual, vbmapp, portage }
    session,
    portage,
    vbmapp,
    isEdit,
    loading,
    setPortage,
    setVBMapp,
    setDTT,
    setMaintenance, // setter para selectedMaintenanceKeys
    handleSubmitSumary,
    state,
  };
};
