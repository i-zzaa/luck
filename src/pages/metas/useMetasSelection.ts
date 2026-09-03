import { useCallback, useEffect, useState } from 'react';
import { create, filter, getList, update } from '../../server';
import { useToast } from '../../contexts/toast';
import { TIPO_PROTOCOLO, VALOR_PORTAGE } from '../../constants/protocolo';
import {
  MaintenanceObject,
  buildFilteredTreeNodes,
  extractCheckedKeys,
  normalizeMaintenanceObject,
} from '../../util/tree';
import { SelectionKeys } from '../../util/sessionTree';

// Extraído de pages/Metas.tsx (a tela original) pra ser reaproveitado
// também num bottom sheet dentro da tela de Sessão — mesma lógica de
// busca/seleção/salvamento, só que sem depender de useLocation/navigate,
// já que o bottom sheet não é uma rota própria. `onSaved` é quem decide
// o que acontece depois de salvar (a tela cadastro navega pra Agenda; o
// bottom sheet fecha e recarrega as metas da sessão sem sair da tela).
interface UseMetasSelectionParams {
  paciente: { id: number; nome: string } | undefined;
  // id do agendamento/sessão (calendarioId) — undefined enquanto o
  // paciente ainda não carregou.
  calendarioId: number | string | undefined;
  onSaved?: () => void;
  // Seleção derivada da própria sessão já registrada (ver
  // util/sessionTree.ts: extractTrainedSelectionKeys) — usada só como
  // FALLBACK quando pei/activity-session/:id (o "planejamento prévio",
  // fonte normal) não devolve nada salvo. Confirmado que isso acontece
  // de verdade pra sessão já atendida: o registro de planejamento fica
  // vazio depois que a sessão é registrada, mas a própria sessão ainda
  // tem os slots preenchidos — sem esse fallback, o bottom sheet abria
  // sempre em branco pra sessão já atendida, mesmo tendo metas.
  fallbackSelection?: {
    manual?: SelectionKeys;
    portage?: SelectionKeys;
    vbmapp?: SelectionKeys;
  };
}

export function useMetasSelection({
  paciente,
  calendarioId,
  onSaved,
  fallbackSelection,
}: UseMetasSelectionParams) {
  const { renderToast } = useToast();

  const [loading, setLoading] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState(false);

  // Manual (PEI)
  const [nodesBaseManual, setNodesBaseManual] = useState<any[]>([]);
  const [nodesManual, setNodesManual] = useState<any[]>([]);
  const [selectedKeysManual, setSelectedKeysManual] = useState<any>({});
  const [manualKeysFlat, setManualKeysFlat] = useState<string[]>([]); // apenas para montar payload de subitens marcados

  // Portage
  const [nodesBasePortage, setNodesBasePortage] = useState<any[]>([]);
  const [nodesPortage, setNodesPortage] = useState<any[]>([]);
  const [selectedPortageKeys, setSelectedPortageKeys] = useState<any>({});

  // VB-Mapp
  const [nodesBaseVbMapp, setNodesBaseVbMapp] = useState<any[]>([]);
  const [nodesVbMapp, setNodesVbMapp] = useState<any[]>([]);
  const [selectedVbMappKeys, setSelectedVbMappKeys] = useState<any>({});

  // Manutenção (objeto com 3 árvores)
  const [nodesMaintenance, setNodesMaintenance] = useState<MaintenanceObject>({
    manual: [],
    vbmapp: [],
    portage: [],
  });
  const [selectedMaintenanceKeys, setSelectedMaintenanceKeys] = useState<any>({
    manual: {},
    vbmapp: {},
    portage: {},
  });

  const getPEI = useCallback(async () => {
    if (!paciente || !calendarioId) return;
    setLoading(true);
    try {
      const [peiData, vbMappData, portageData, atividadesSessao] = await Promise.all([
        filter('pei', { paciente, protocoloId: TIPO_PROTOCOLO.pei }),
        filter('protocolo/meta', {
          pacienteId: paciente.id,
          protocoloId: TIPO_PROTOCOLO.vbMapp,
          notSelected: [VALOR_PORTAGE.sim],
        }),
        filter('protocolo/meta', {
          pacienteId: paciente.id,
          protocoloId: TIPO_PROTOCOLO.portage,
          notSelected: [VALOR_PORTAGE.sim],
        }),
        getList(`pei/activity-session/${calendarioId}`),
      ]);

      const pei = peiData.data;
      const vbmapp = vbMappData.data;
      const portage = portageData.data;

      setIsEdit(!!pei?.length || !!portage?.length || !!vbmapp?.length);

      // ------- Monta Manual (PEI) base -------
      if (Array.isArray(pei) && pei.length > 0) {
        const manualBase: any[] = [];

        pei.forEach((programa: any) => {
          const metas: any[] = [];

          (programa.metas || []).forEach((meta: any) => {
            const children = (meta.subitems || []).map((subitem: any) => ({
              key: subitem.id,
              label: subitem.value,
              data: subitem.id,
            }));

            if (children.length) {
              metas.push({
                key: meta.id,
                label: meta.value,
                data: meta.id,
                children,
              });
            }
          });

          if (metas.length) {
            manualBase.push({
              ...programa,
              key: programa.id,
              label: programa.programa?.nome ?? programa.label ?? 'Programa',
              data: programa.id,
              children: metas,
            });
          }
        });

        setNodesBaseManual(manualBase);
      }

      // ------- VB-Mapp base -------
      if (Array.isArray(vbmapp) && vbmapp.length > 0) {
        setNodesBaseVbMapp(vbmapp);
        const prevVbMapp = atividadesSessao?.selectedVbMappKeys;
        const hasPrevVbMapp = prevVbMapp && Object.keys(prevVbMapp).length > 0;
        setSelectedVbMappKeys(hasPrevVbMapp ? prevVbMapp : fallbackSelection?.vbmapp || {});
      }

      // ------- Portage base -------
      if (Array.isArray(portage) && portage.length > 0) {
        setNodesBasePortage(portage);
        const prevPortage = atividadesSessao?.selectedPortageKeys;
        const hasPrevPortage = prevPortage && Object.keys(prevPortage).length > 0;
        setSelectedPortageKeys(hasPrevPortage ? prevPortage : fallbackSelection?.portage || {});
      }

      // ------- Seleções anteriores (Manual) -------
      // Prefere o planejamento prévio salvo (pei/activity-session/:id) —
      // mesma fonte que a tela de Metas sempre leu. Só cai no fallback
      // (derivado da própria sessão já registrada) quando essa fonte vem
      // vazia, o que acontece de verdade pra sessão já atendida (ver
      // comentário de fallbackSelection acima).
      const prevManual = atividadesSessao?.selectedKeys;
      const hasPrevManual = prevManual && Object.keys(prevManual).length > 0;
      const manualSelection = hasPrevManual ? prevManual : fallbackSelection?.manual;
      if (manualSelection && Object.keys(manualSelection).length > 0) {
        setSelectedKeysManual(manualSelection);
        setManualKeysFlat(Object.keys(manualSelection));
      }

      // ------- Manutenção (objeto) -------
      const maintObj = normalizeMaintenanceObject(atividadesSessao?.maintenance);
      setNodesMaintenance(maintObj);

      const prevMaintSel = atividadesSessao?.selectedMaintenanceKeys || {};
      setSelectedMaintenanceKeys({
        manual: prevMaintSel?.manual || {},
        vbmapp: prevMaintSel?.vbmapp || {},
        portage: prevMaintSel?.portage || {},
      });
    } catch (error) {
      // opcional: toast
    } finally {
      setLoading(false);
    }
  }, [paciente, calendarioId, fallbackSelection]);

  // Recalcula árvores visíveis quando base muda ou quando os selecionados de manutenção mudam
  useEffect(() => {
    const excludedManual = new Set(extractCheckedKeys(selectedMaintenanceKeys.manual));
    setNodesManual(buildFilteredTreeNodes(nodesBaseManual, excludedManual));

    const excludedVbmapp = new Set(extractCheckedKeys(selectedMaintenanceKeys.vbmapp));
    setNodesVbMapp(buildFilteredTreeNodes(nodesBaseVbMapp, excludedVbmapp));

    const excludedPortage = new Set(extractCheckedKeys(selectedMaintenanceKeys.portage));
    setNodesPortage(buildFilteredTreeNodes(nodesBasePortage, excludedPortage));
  }, [nodesBaseManual, nodesBaseVbMapp, nodesBasePortage, selectedMaintenanceKeys]);

  const onSubmit = async () => {
    if (!paciente || !calendarioId) return;
    setLoading(true);
    try {
      const atividades: any[] = [];

      nodesManual.forEach((programas: any) => {
        const programaCurrent: any[] = [];
        (programas.children || []).forEach((meta: any) => {
          const subitemsCurrent = (meta.children || []).filter((subitem: any) =>
            manualKeysFlat.includes(subitem.key)
          );
          if (subitemsCurrent.length) {
            programaCurrent.push({ ...meta, children: subitemsCurrent });
          }
        });

        if (programaCurrent.length) {
          atividades.push({ ...programas, children: programaCurrent });
        }
      });

      const peisIds: any = atividades.map((item: any) => item.key);

      const payload: any = {
        calendarioId,
        peisIds,
        pacienteId: paciente.id,
        atividades,
        selectedKeys: selectedKeysManual,

        maintenance: nodesMaintenance,
        selectedMaintenanceKeys,

        portage: nodesPortage,
        selectedPortageKeys,
        vbmapp: nodesVbMapp,
        selectedVbMappKeys,
      };

      if (isEdit) {
        payload.id = calendarioId;
        await update('pei/activity-session', payload);
      } else {
        await create('pei/activity-session', payload);
      }

      renderToast({
        type: 'success',
        title: '200',
        message: 'Cadastrado com sucesso!',
        open: true,
      });

      onSaved?.();
    } catch (error) {
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Falha ao cadastrar!',
        open: true,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    getPEI();
  }, [getPEI]);

  const hasAnyContent =
    nodesManual.length > 0 ||
    nodesPortage.length > 0 ||
    nodesVbMapp.length > 0 ||
    (nodesMaintenance.manual?.length ?? 0) > 0 ||
    (nodesMaintenance.vbmapp?.length ?? 0) > 0 ||
    (nodesMaintenance.portage?.length ?? 0) > 0;

  return {
    loading,
    nodesManual,
    selectedKeysManual,
    setSelectedKeysManual,
    manualKeysFlat,
    setManualKeysFlat,
    nodesPortage,
    selectedPortageKeys,
    setSelectedPortageKeys,
    nodesVbMapp,
    selectedVbMappKeys,
    setSelectedVbMappKeys,
    nodesMaintenance,
    selectedMaintenanceKeys,
    setSelectedMaintenanceKeys,
    hasAnyContent,
    onSubmit,
  };
}

export type MetasSelection = ReturnType<typeof useMetasSelection>;
