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
  const [listVBMapp, setLisVBMapp] = useState([]);
  const [dtt, setDTT] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [session, setSession] = useState({});
  const [portage, setPortage] = useState([]);
  const [vbmapp, setVBMapp] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);

  const transformNode = useCallback(async (node: any, type: string, tipoProtocolo = TIPO_PROTOCOLO.portage): Promise<any> => {
    const transformed: any = { key: node.key, label: node.label };
     transformed.estimuloDiscriminativo = node.estimuloDiscriminativo || '';
     transformed.estimuloReforcadorPositivo = node.estimuloReforcadorPositivo || '';
     transformed.resposta = node.resposta || '';
    
     if (node.permiteSubitens && node.children && node.children.length > 0) {
      transformed.children= await Promise.all(
        node.children.map(async (child: any) => ({
          key: child.key,
          label: child.label,
          children: Array.from({ length: 10 }, () => null),
        }))
      );
    } else if (tipoProtocolo === TIPO_PROTOCOLO.vbMapp && node.permiteSubitens) {
      transformed.children = Array.from({ length: 10 }).map(() => null);
      transformed.permiteSubitens = node.permiteSubitens;
    } else if (node.children?.length > 0) {
      transformed.children = await Promise.all(
        node.children.map(async (child: any) => transformNode(child, type, tipoProtocolo))
      );
    } else {
      transformed.children = Array.from({
        length: type === ACTIVITY || type === PORTAGE || type === VBMAPP ? repeatActivity : repeatMaintenance,
      }).map(() => null);
    }
    return transformed;
  }, [repeatActivity, repeatMaintenance]);

  const formatarDado = useCallback(async (data: any[], type = ACTIVITY, tipoProtocolo = TIPO_PROTOCOLO.portage) => {
    return await Promise.all(data.map(async (programa: any) => transformNode(programa, type, tipoProtocolo)));
  }, [transformNode]);

  const getActivity = useCallback(async () => {
    try {
      const result = await getList(`/pei/activity/session/${state.item.paciente.id}`);
      const [atividades, maintenance, portage, vbmappCurrent]: any = await Promise.all([
        formatarDado(result.atividades, ACTIVITY),
        formatarDado(result.maintenance, MAINTENANCE),
        formatarDado(result.portage, PORTAGE),
        formatarDado(result.vbmapp, VBMAPP, TIPO_PROTOCOLO.vbMapp),
      ]);
      setList(atividades);
      setListMaintenance(maintenance);
      setListPortage(portage);
      setLisVBMapp(vbmappCurrent);
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
        setLisVBMapp(result.vbmapp);
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