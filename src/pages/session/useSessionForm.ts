// src/hooks/useSessionForm.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TIPO_PROTOCOLO } from "../../constants/protocolo";
import { CONSTANTES_ROUTERS } from "../../routes/OtherRoutes";
import { useToast } from "../../contexts/toast";
import { create, getList, update } from "../../server";

const ACTIVITY = 'activity';
const MAINTENANCE = 'maintenance';
const PORTAGE = 'portage';
const VBMAPP = 'vbmapp';

type TipoProtocolo = 'vbmapp' | 'portage' | 'maintenance' | 'activity';

export const useSessionForm = () => {
  const { renderToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const editor = useRef(null);

  const [repeatActivity] = useState(10);
  const [repeatMaintenance] = useState(1);
  const [content, setContent] = useState('');
  const [list, setList] = useState([]);
  const [listMaintenance, setListMaintenance] = useState([]);
  const [listPortage, setListPortage] = useState([]);
  const [listVBMapp, setListVBMapp] = useState<any[]>([]);
  const [dtt, setDTT] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [session, setSession] = useState({});
  const [portage, setPortage] = useState([]);
  const [vbmapp, setVBMapp] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);

const transformGenericNode = useCallback(
  async (node: any, type: string): Promise<any> => {
    const out: any = {
      key: node.key,
      label: node.label,
      estimuloDiscriminativo: node.estimuloDiscriminativo || '',
      estimuloReforcadorPositivo: node.estimuloReforcadorPositivo || '',
      resposta: node.resposta || '',
    };

    // 1) PENÚLTIMO NÍVEL: filhos existem, mas são folhas originais (não têm 'children')
    if (
      Array.isArray(node.children) &&
      node.children.length > 0 &&
      node.children[0].children === undefined
    ) {
      // quantos checkboxes queremos no final?
      const slotCount =
        type === ACTIVITY || type === PORTAGE || type === VBMAPP
          ? repeatActivity
          : repeatMaintenance;

      out.children = node.children.map((sub: any) => ({
        key: sub.key,
        label: sub.label,
        // copia quaisquer campos extras do sub-item, se precisar:
        estimuloDiscriminativo: sub.estimuloDiscriminativo || '',
        estimuloReforcadorPositivo: sub.estimuloReforcadorPositivo || '',
        resposta: sub.resposta || '',
        // ***
        // aqui é que “nasce” o array de 10 nulls para renderizar checkboxes
        children: Array.from({ length: slotCount }).map(() => null),
      }));
    }
    // 2) NÓ INTERNO NORMAL: recursão para descer na árvore
    else if (Array.isArray(node.children) && node.children.length > 0) {
      out.children = await Promise.all(
        node.children.map(ch => transformGenericNode(ch, type))
      );
    }
    // 3) FOLHA PURA (não tinha children original): também geramos slots
    else {
      const slotCount =
        type === ACTIVITY || type === PORTAGE || type === VBMAPP
          ? repeatActivity
          : repeatMaintenance;
      out.children = Array.from({ length: slotCount }).map(() => null);
    }

    return out;
  },
  [repeatActivity, repeatMaintenance]
);


// 2) PORTAGE: reaproveita o genérico (mas agora já com detecção de penúltimo nível)
const transformPortageNode = useCallback(
  (node: any) => transformGenericNode(node, PORTAGE),
  [transformGenericNode]
);

 const transformVBMappNode = useCallback(
  async (node: any): Promise<any> => {
    const out: any = {
      key: node.key,
      label: node.label,
      estimuloDiscriminativo: node.estimuloDiscriminativo || "",
      estimuloReforcadorPositivo: node.estimuloReforcadorPositivo || "",
      resposta: node.resposta || "",
    };

    // Se node.children existir e o primeiro filho NÃO trouxer children,
    // então esse node é um “pai” direto de subitens folhas.
    if (
      Array.isArray(node.children) &&
      node.children.length > 0 &&
      node.children[0].children === undefined
    ) {
      // cada filho original (Bola, Boneca…) vira um objeto completo
      out.children = node.children.map((sub: any) => ({
        key: sub.key,
        label: sub.label,
        // herdamos permitesSubitens se vier
        permiteSubitens: !!sub.permiteSubitens,
        // **aqui** criamos 10 slots de checkbox
        children: Array.from({ length: repeatActivity }).map(() => null),
      }));
    }
    // Se node.children existir e for um array de nós Já transformados,
    // caímos na recursão “normal”
    else if (Array.isArray(node.children) && node.children.length > 0) {
      out.children = await Promise.all(
        node.children.map((ch: any) => transformVBMappNode(ch))
      );
    }
    // Se não houver node.children (folha de verdade), apenas slots
    else {
      out.children = Array.from({ length: repeatActivity }).map(() => null);
    }

    return out;
  },
  [repeatActivity]
);

  const formatarDado = useCallback(
    async (data: any[], type = ACTIVITY, protocolo = TIPO_PROTOCOLO.portage) => {
      if (protocolo === TIPO_PROTOCOLO.vbMapp) {
        return Promise.all(data.map(node => transformVBMappNode(node)));
      }
      if (type === PORTAGE) {
        return Promise.all(data.map(node => transformPortageNode(node)));
      }
      // atividade/maintenance genérico
      return Promise.all(data.map(node => transformGenericNode(node, type)));
    },
    [transformGenericNode, transformPortageNode, transformVBMappNode]
  );


  const getActivity = useCallback(async () => {
    try {
      const result = await getList(`/pei/activity/session/${state.item.paciente.id}`);
      const [atividades, maintenance, portage, vbmappCurrent]: any = await Promise.all([
        formatarDado(result.atividades, ACTIVITY),
        formatarDado(result.maintenance, MAINTENANCE),
        formatarDado(result.portage, PORTAGE, TIPO_PROTOCOLO.portage),
        formatarDado(result.vbmapp, VBMAPP, TIPO_PROTOCOLO.vbMapp),
      ]);
      setList(atividades);
      setListMaintenance(maintenance);
      setListPortage(portage);
      setListVBMapp(vbmappCurrent);
      setVBMapp(vbmappCurrent);
      setDTT(result.sessao);
    } catch (e) {
      console.error('Erro ao buscar atividades', e);
    }
  }, [formatarDado, state]);

  const getSumaryContent = useCallback(async () => {
    try {
      const result = await getList(`/sessao/${state.item.id}`);
      if (result) {
        setContent(result.resumo);
        setSession(result);
        setIsEdit(true);
        const [atividades, maintenance]: any = await Promise.all([
          formatarDado(result.sessao, ACTIVITY),
          formatarDado(result.maintenance, MAINTENANCE)
        ]);
        setList(atividades);
        setListMaintenance(maintenance);
        setListPortage(result.portage);
        setListVBMapp(result.vbmapp);
        setDTT(result.sessao);
      } else {
        await getActivity();
      }
    } catch (e) {
      console.error('Erro ao buscar conteúdo da sessão', e);
    }
  }, [formatarDado, getActivity, state]);

  const handleSubmitSumary = useCallback(async () => {
    try {
      const payload = {
        calendarioId: state.item.id,
        pacienteId: state.item.paciente.id,
        sessao: dtt,
        maintenance: listMaintenance,
        selectedMaintenanceKeys: maintenance,
        resumo: content,
        date: state.item.date,
        portage,
        vbmapp,
        ...session,
      };
      if (isEdit) await update('/sessao', payload);
      else await create('/sessao', payload);
      renderToast({ type: 'success', message: 'Sessão atualizada!', open: true, title: '' });
      navigate(`/${CONSTANTES_ROUTERS.CALENDAR}`);
    } catch (error) {
      renderToast({ type: 'failure', message: 'Sessão não atualizada!', open: true, title: '401' });
    }
  }, [state, dtt, listMaintenance, maintenance, content, portage, vbmapp, session, isEdit, navigate, renderToast]);

  useEffect(() => {
    getSumaryContent();
  }, [getSumaryContent]);

  return {
    editor,
    content,
    setContent,
    list,
    listMaintenance,
    listPortage,
    listVBMapp,
    dtt,
    maintenance,
    session,
    portage,
    vbmapp,
    isEdit,
    loading,
    setPortage,
    setVBMapp,
    setDTT,
    setMaintenance,
    handleSubmitSumary,
    state
  };
};