import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { create, filter, getList, update } from '../server';
import { useToast } from '../contexts/toast';
import { Tree, TreeCheckboxSelectionKeys } from 'primereact/tree';
import { ButtonHeron, Card, CollapsibleSection } from '../components';
import { ChoiceItemSchedule } from '../components/choiceItemSchedule';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { NotFound } from '../components/notFound';
import { TIPO_PROTOCOLO, VALOR_PORTAGE } from '../constants/protocolo';
import {
  MaintenanceObject,
  buildFilteredTreeNodes,
  countSelected,
  extractCheckedKeys,
  hasNodes,
  normalizeMaintenanceObject,
} from '../util/tree';

// -------------------- Componente --------------------
export default function Metas() {
  const { renderToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location as any;

  const [loading, setLoading] = useState<boolean>(false);
  const [isEdit, seIsEdit] = useState(false);

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
    setLoading(true);
    try {
      const paciente = state.paciente;

      const [peiData, vbMappData, portageData, atividadesSessao] = await Promise.all([
        filter('pei', { paciente, protocoloId: TIPO_PROTOCOLO.pei }),
        filter('protocolo/meta', { pacienteId: paciente.id, protocoloId: TIPO_PROTOCOLO.vbMapp }),
        filter('protocolo/meta', {
          pacienteId: paciente.id,
          protocoloId: TIPO_PROTOCOLO.portage,
          notSelected: [VALOR_PORTAGE.sim],
        }),
        getList(`pei/activity-session/${state.id}`),
      ]);

      const pei = peiData.data;
      const vbmapp = vbMappData.data;
      const portage = portageData.data;

      seIsEdit(!!pei?.length || !!portage?.length || !!vbmapp?.length);

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
        setSelectedVbMappKeys(atividadesSessao?.selectedVbMappKeys || {});
      }

      // ------- Portage base -------
      if (Array.isArray(portage) && portage.length > 0) {
        setNodesBasePortage(portage);
        setSelectedPortageKeys(atividadesSessao?.selectedPortageKeys || {});
      }

      // ------- Seleções anteriores (Manual) -------
      if (atividadesSessao?.selectedKeys && Object.values(atividadesSessao.selectedKeys).length > 0) {
        const sel = atividadesSessao.selectedKeys;
        setSelectedKeysManual(sel);
        setManualKeysFlat(Object.keys(sel));
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
  }, [state]);

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
    setLoading(true);
    try {
      const atividades: any[] = [];

      // Manual: usa a árvore já filtrada (nodesManual) e selectedKeysManual para montar payload
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
        calendarioId: state.id,
        peisIds,
        pacienteId: state.paciente.id,
        atividades, // Manual selecionado
        selectedKeys: selectedKeysManual,

        // Manutenção: objeto e seleções por sessão
        maintenance: nodesMaintenance,
        selectedMaintenanceKeys,

        // Portage e VB-Mapp (árvores filtradas pela manutenção + seleções por sessão)
        portage: nodesPortage,
        selectedPortageKeys,
        vbmapp: nodesVbMapp,
        selectedVbMappKeys,
      };

      if (isEdit) {
        payload.id = state.id;
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

      navigate(`/${CONSTANTES_ROUTERS.CALENDAR}`);
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

  const renderHeader = useMemo(() => {
    return (
      <ChoiceItemSchedule
        start={state?.data?.start}
        end={state?.data?.end}
        statusEventos={state?.statusEventos}
        title={state?.title}
        localidade={state?.localidade?.nome}
        localExternoDescricao={state?.localExternoDescricao}
        localExibicao={state?.localExibicao}
        isExterno={state?.isExterno}
        km={state?.km}
        modalidade={state?.modalidade?.nome}
        dataInicio={state?.dataInicio}
        dataFim={state?.dataFim}
        dataAtual={state?.dataAtual}
      />
    );
  }, [state]);

  const renderContentManual = () => {
    return (
      hasNodes(nodesManual) && (
        <CollapsibleSection title="Manual" count={countSelected(selectedKeysManual)}>
          <Tree
            value={nodesManual}
            selectionMode="checkbox"
            selectionKeys={selectedKeysManual}
            onSelectionChange={(e: any) => {
              setSelectedKeysManual(e.value);
              setManualKeysFlat(Object.keys(e.value));
            }}
            className="w-full md:w-30rem"
          />
        </CollapsibleSection>
      )
    );
  };

  const renderContentPortage = () => {
    return (
      hasNodes(nodesPortage) && (
        <CollapsibleSection title="Portage" count={countSelected(selectedPortageKeys)}>
          <Tree
            value={nodesPortage}
            selectionMode="checkbox"
            selectionKeys={selectedPortageKeys}
            onSelectionChange={(e: any) => setSelectedPortageKeys(e.value)}
            className="w-full md:w-30rem"
          />
        </CollapsibleSection>
      )
    );
  };

  const renderContentVbMapp = () => {
    return (
      hasNodes(nodesVbMapp) && (
        <CollapsibleSection title="VB-Mapp" count={countSelected(selectedVbMappKeys)}>
          <Tree
            value={nodesVbMapp}
            selectionMode="checkbox"
            selectionKeys={selectedVbMappKeys}
            onSelectionChange={(e: any) => setSelectedVbMappKeys(e.value)}
            className="w-full md:w-30rem"
          />
        </CollapsibleSection>
      )
    );
  };

  const renderContentMaintenance = () => {
    const maint = nodesMaintenance;
    const hasAny =
      hasNodes(maint.manual) || hasNodes(maint.vbmapp) || hasNodes(maint.portage);

    if (!hasAny) return null;

    const maintenanceCount =
      countSelected(selectedMaintenanceKeys.manual) +
      countSelected(selectedMaintenanceKeys.vbmapp) +
      countSelected(selectedMaintenanceKeys.portage);

    return (
      <CollapsibleSection
        title="Manutenção"
        count={maintenanceCount}
        defaultOpen={false}
      >
        <Card className="rounded-lg cursor-not-allowed max-w-[100%]">
          {hasNodes(maint.manual) && (
            <div>
              <div className="text-gray-400">Manual (em manutenção)</div>
              <Tree
                value={maint.manual}
                selectionMode="checkbox"
                selectionKeys={selectedMaintenanceKeys.manual || {}}
                onSelectionChange={(e: any) =>
                  setSelectedMaintenanceKeys((prev: any) => ({ ...prev, manual: e.value }))
                }
                className="w-full md:w-30rem"
              />
            </div>
          )}

          {hasNodes(maint.vbmapp) && (
            <div>
              <div className="text-gray-400 mt-4">VB-Mapp (em manutenção)</div>
              <Tree
                value={maint.vbmapp}
                selectionMode="checkbox"
                selectionKeys={selectedMaintenanceKeys.vbmapp || {}}
                onSelectionChange={(e: any) =>
                  setSelectedMaintenanceKeys((prev: any) => ({ ...prev, vbmapp: e.value }))
                }
                className="w-full md:w-30rem"
              />
            </div>
          )}

          {hasNodes(maint.portage) && (
            <div>
              <div className="text-gray-400 mt-4">Portage (em manutenção)</div>
              <Tree
                value={maint.portage}
                selectionMode="checkbox"
                selectionKeys={selectedMaintenanceKeys.portage || {}}
                onSelectionChange={(e: any) =>
                  setSelectedMaintenanceKeys((prev: any) => ({ ...prev, portage: e.value }))
                }
                className="w-full md:w-30rem"
              />
            </div>
          )}
        </Card>
      </CollapsibleSection>
    );
  };

  const renderNotFound = () => {
    return (
      !hasNodes(nodesVbMapp) &&
      !hasNodes(nodesPortage) &&
      !hasNodes(nodesMaintenance.manual) &&
      !hasNodes(nodesMaintenance.vbmapp) &&
      !hasNodes(nodesMaintenance.portage) &&
      !hasNodes(nodesManual) && (
        <div className="grid gap-4 justify-center">
          <NotFound />
          <ButtonHeron
            text="Cadastrar Protocolo"
            icon="pi pi-book"
            type="primary"
            color="white"
            size="sm"
            onClick={() =>
              navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
                state: { item: { paciente: state.paciente } },
              })
            }
          />
        </div>
      )
    );
  };

  const hasAnyContent = () =>
    hasNodes(nodesVbMapp) ||
    hasNodes(nodesPortage) ||
    hasNodes(nodesMaintenance.manual) ||
    hasNodes(nodesMaintenance.vbmapp) ||
    hasNodes(nodesMaintenance.portage) ||
    hasNodes(nodesManual);

  const renderFooter = () => {
    return (
      hasAnyContent() && (
        <div className="fixed inset-x-0 bottom-0 z-10 px-4 pt-3 bg-background border-t border-gray-300 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <ButtonHeron
            text="Salvar"
            type="primary"
            size="full"
            onClick={() => onSubmit()}
            loading={loading}
            typeButton="button"
          />
        </div>
      )
    );
  };

  useEffect(() => {
    // Mesmo caso do Session: location.state some ao dar F5/abrir link
    // direto, e sem esse guard renderHeader e getPEI liam state.paciente/
    // state.id de um state ausente e derrubavam a página inteira (sem
    // Error Boundary no projeto).
    if (!state?.paciente) {
      renderToast({
        type: 'failure',
        title: 'Erro',
        message: 'Paciente não encontrado. Acesse pelo PEI.',
        open: true,
      });
      navigate(`/${CONSTANTES_ROUTERS.PEI}`);
      return;
    }

    getPEI();
  }, [getPEI]);

  return (
    <div
      className={clsx(
        'h-[90vh] flex flex-col overflow-y-auto',
        hasAnyContent() && 'pb-24'
      )}
    >
      {renderHeader}

      <div className="text-gray-400 text-xs mt-4 mx-2">
        Selecione os programas para a sessão
      </div>

      {renderContentManual()}
      {renderContentPortage()}
      {renderContentVbMapp()}
      {renderContentMaintenance()}
      {renderNotFound()}
      {renderFooter()}
    </div>
  );
}
