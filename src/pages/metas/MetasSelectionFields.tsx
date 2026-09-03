import { Tree } from 'primereact/tree';
import { Card, CollapsibleSection } from '../../components';
import { NotFound } from '../../components/notFound';
import { countSelected, hasNodes } from '../../util/tree';
import { MetasSelection } from './useMetasSelection';

// Renderização pura das 4 seções (Manual/Portage/VB-Mapp/Manutenção) —
// extraída de pages/Metas.tsx pra ser reaproveitada tanto na tela
// dedicada quanto no bottom sheet dentro da Sessão. Cabeçalho (dados do
// agendamento) e rodapé (botão Salvar) ficam de fora de propósito: cada
// contexto que usa isso tem os seus próprios (a tela é uma página cheia
// com footer fixo; o bottom sheet tem seu footer dentro do próprio
// sheet).
interface Props {
  selection: MetasSelection;
  // Ação extra mostrada abaixo do "não encontrado" (ex: a tela dedicada
  // mostra um botão "Cadastrar Protocolo" que navega pra outra rota —
  // não faz sentido dentro do bottom sheet da Sessão, cujo objetivo é
  // justamente não navegar pra fora).
  notFoundExtra?: React.ReactNode;
}

export function MetasSelectionFields({ selection, notFoundExtra }: Props) {
  const {
    nodesManual,
    selectedKeysManual,
    setSelectedKeysManual,
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
  } = selection;

  const maintenanceCount =
    countSelected(selectedMaintenanceKeys.manual) +
    countSelected(selectedMaintenanceKeys.vbmapp) +
    countSelected(selectedMaintenanceKeys.portage);

  const hasMaintenance =
    hasNodes(nodesMaintenance.manual) ||
    hasNodes(nodesMaintenance.vbmapp) ||
    hasNodes(nodesMaintenance.portage);

  return (
    <>
      {hasNodes(nodesManual) && (
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
      )}

      {hasNodes(nodesPortage) && (
        <CollapsibleSection title="Portage" count={countSelected(selectedPortageKeys)}>
          <Tree
            value={nodesPortage}
            selectionMode="checkbox"
            selectionKeys={selectedPortageKeys}
            onSelectionChange={(e: any) => setSelectedPortageKeys(e.value)}
            className="w-full md:w-30rem"
          />
        </CollapsibleSection>
      )}

      {hasNodes(nodesVbMapp) && (
        <CollapsibleSection title="VB-Mapp" count={countSelected(selectedVbMappKeys)}>
          <Tree
            value={nodesVbMapp}
            selectionMode="checkbox"
            selectionKeys={selectedVbMappKeys}
            onSelectionChange={(e: any) => setSelectedVbMappKeys(e.value)}
            className="w-full md:w-30rem"
          />
        </CollapsibleSection>
      )}

      {hasMaintenance && (
        <CollapsibleSection title="Manutenção" count={maintenanceCount} defaultOpen={false}>
          <Card className="rounded-lg cursor-not-allowed max-w-[100%]">
            {hasNodes(nodesMaintenance.manual) && (
              <div>
                <div className="text-gray-400">Manual (em manutenção)</div>
                <Tree
                  value={nodesMaintenance.manual}
                  selectionMode="checkbox"
                  selectionKeys={selectedMaintenanceKeys.manual || {}}
                  onSelectionChange={(e: any) =>
                    setSelectedMaintenanceKeys((prev: any) => ({ ...prev, manual: e.value }))
                  }
                  className="w-full md:w-30rem"
                />
              </div>
            )}

            {hasNodes(nodesMaintenance.vbmapp) && (
              <div>
                <div className="text-gray-400 mt-4">VB-Mapp (em manutenção)</div>
                <Tree
                  value={nodesMaintenance.vbmapp}
                  selectionMode="checkbox"
                  selectionKeys={selectedMaintenanceKeys.vbmapp || {}}
                  onSelectionChange={(e: any) =>
                    setSelectedMaintenanceKeys((prev: any) => ({ ...prev, vbmapp: e.value }))
                  }
                  className="w-full md:w-30rem"
                />
              </div>
            )}

            {hasNodes(nodesMaintenance.portage) && (
              <div>
                <div className="text-gray-400 mt-4">Portage (em manutenção)</div>
                <Tree
                  value={nodesMaintenance.portage}
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
      )}

      {!hasAnyContent && (
        <div className="grid gap-4 justify-center py-4">
          <NotFound />
          {notFoundExtra}
        </div>
      )}
    </>
  );
}
