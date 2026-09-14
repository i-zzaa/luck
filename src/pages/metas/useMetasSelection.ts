import { useCallback, useEffect, useState } from 'react';
import { getList, update } from '../../server';
import { useToast } from '../../contexts/toast';

// Extraído de pages/Metas.tsx (a tela original) pra ser reaproveitado
// também num bottom sheet dentro da tela de Sessão — mesma lógica de
// busca/seleção/salvamento, só que sem depender de useLocation/navigate,
// já que o bottom sheet não é uma rota própria. `onSaved` é quem decide
// o que acontece depois de salvar (a tela cadastro navega pra Agenda; o
// bottom sheet fecha e recarrega as metas da sessão sem sair da tela).
//
// Montagem das árvores, cruzamento com o que já foi salvo, fallback pra
// sessão já atendida e poda dos itens em manutenção são feitos pelo
// backend (GET pei/activity-session/:id/metas, item 5 do
// pedido-frontend-fase2) — aqui só guarda a resposta e o que a pessoa
// marca.
interface UseMetasSelectionParams {
  // id do agendamento/sessão (calendarioId) — undefined enquanto a tela
  // ainda não tem o evento.
  calendarioId: number | string | undefined;
  onSaved?: () => void;
}

type MaintenanceTrees = { manual: any[]; vbmapp: any[]; portage: any[] };

export function useMetasSelection({ calendarioId, onSaved }: UseMetasSelectionParams) {
  const { renderToast } = useToast();

  const [loading, setLoading] = useState<boolean>(false);

  const [nodesManual, setNodesManual] = useState<any[]>([]);
  const [selectedKeysManual, setSelectedKeysManual] = useState<any>({});

  const [nodesPortage, setNodesPortage] = useState<any[]>([]);
  const [selectedPortageKeys, setSelectedPortageKeys] = useState<any>({});

  const [nodesVbMapp, setNodesVbMapp] = useState<any[]>([]);
  const [selectedVbMappKeys, setSelectedVbMappKeys] = useState<any>({});

  // Manutenção só é exibida/marcada aqui — a árvore em si é calculada
  // pelo backend ao registrar sessões e não é reenviada no salvar.
  const [nodesMaintenance, setNodesMaintenance] = useState<MaintenanceTrees>({
    manual: [],
    vbmapp: [],
    portage: [],
  });
  const [selectedMaintenanceKeys, setSelectedMaintenanceKeys] = useState<any>({
    manual: {},
    vbmapp: {},
    portage: {},
  });

  const getMetas = useCallback(async () => {
    if (!calendarioId) return;
    setLoading(true);
    try {
      const response = await getList(`pei/activity-session/${calendarioId}/metas`);

      setNodesManual(response?.manual?.nodes || []);
      setSelectedKeysManual(response?.manual?.selectedKeys || {});

      setNodesPortage(response?.portage?.nodes || []);
      setSelectedPortageKeys(response?.portage?.selectedKeys || {});

      setNodesVbMapp(response?.vbmapp?.nodes || []);
      setSelectedVbMappKeys(response?.vbmapp?.selectedKeys || {});

      setNodesMaintenance({
        manual: response?.maintenance?.manual || [],
        vbmapp: response?.maintenance?.vbmapp || [],
        portage: response?.maintenance?.portage || [],
      });
      // selectedKeys de manutenção pode vir {} (planejamento ainda não
      // existe) — as Trees leem .manual/.vbmapp/.portage direto.
      const maintenanceSelected = response?.maintenance?.selectedKeys || {};
      setSelectedMaintenanceKeys({
        manual: maintenanceSelected.manual || {},
        vbmapp: maintenanceSelected.vbmapp || {},
        portage: maintenanceSelected.portage || {},
      });
    } catch (error) {
      renderToast({
        type: 'failure',
        title: 'Erro',
        message: 'Não foi possível carregar as metas.',
        open: true,
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarioId]);

  const onSubmit = async () => {
    if (!calendarioId) return;
    setLoading(true);
    try {
      // PUT é upsert por calendário (item 6): não precisa decidir entre
      // criar/editar, e atividades/peisIds são montados pelo servidor a
      // partir das keys.
      await update(`pei/activity-session/${calendarioId}`, {
        selectedKeys: {
          manual: selectedKeysManual,
          portage: selectedPortageKeys,
          vbmapp: selectedVbMappKeys,
          maintenance: selectedMaintenanceKeys,
        },
      });

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
    getMetas();
  }, [getMetas]);

  const hasAnyContent =
    nodesManual.length > 0 ||
    nodesPortage.length > 0 ||
    nodesVbMapp.length > 0 ||
    nodesMaintenance.manual.length > 0 ||
    nodesMaintenance.vbmapp.length > 0 ||
    nodesMaintenance.portage.length > 0;

  return {
    loading,
    nodesManual,
    selectedKeysManual,
    setSelectedKeysManual,
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
