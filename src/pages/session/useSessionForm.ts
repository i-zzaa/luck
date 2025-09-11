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

      // Normaliza possíveis filhos
      const kids: any[] = (() => {
        if (Array.isArray(node?.children) && node.children.length)
          return node.children;
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

      // Penúltimo nível: filhos existem e são folhas (sem children/subitems)
      const isPenultimate =
        kids.length > 0 &&
        kids.every(
          (k) => !Array.isArray(k?.children) && !Array.isArray(k?.subitems)
        );

      if (isPenultimate) {
        out.children = kids.map((sub: any) => ({
          key: String(sub?.key ?? sub?.id ?? ''),
          label: sub?.label ?? sub?.nome ?? '',
          estimuloDiscriminativo: sub?.estimuloDiscriminativo ?? '',
          estimuloReforcadorPositivo: sub?.estimuloReforcadorPositivo ?? '',
          resposta: sub?.resposta ?? '',
          children: Array.from({ length: slotCount }, () => null),
        }));
        return out;
      }

      // Nó interno: recursão
      if (kids.length > 0) {
        out.children = await Promise.all(
          kids.map((ch: any) => transformGenericNode(ch, type))
        );
        return out;
      }

      // Folha pura: gera slots
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
    }
  }, [formatarDado, state]);

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
      // fallback para garantir que algo é carregado
      await getActivity();
    }
  }, [formatarDado, getActivity, state]);

  const handleSubmitSumary = useCallback(async () => {
    try {
      const payload = {
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
        ...session,
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
    getSumaryContent();
  }, [getSumaryContent]);

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
