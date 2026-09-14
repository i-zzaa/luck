import { Sidebar } from 'primereact/sidebar';
import { ButtonHeron } from '../button';
import { useMetasSelection } from '../../pages/metas/useMetasSelection';
import { MetasSelectionFields } from '../../pages/metas/MetasSelectionFields';

interface MetasBottomSheetProps {
  open: boolean;
  onClose: () => void;
  calendarioId: number | string | undefined;
  // chamado depois de salvar com sucesso — quem chama decide como
  // recarregar as metas da tela por trás (ver useSessionForm: refreshMetas)
  onSaved: () => void;
}

// Mesmo fluxo de seleção de metas da tela dedicada (pages/Metas.tsx),
// mas dentro de um bottom sheet — pra abrir/editar metas sem sair da
// tela de Sessão. Reaproveita o mesmo hook (useMetasSelection) e o
// mesmo bloco de seções (MetasSelectionFields); só o entorno (header,
// footer, like fechar o sheet em vez de navegar) é diferente.
export function MetasBottomSheet({
  open,
  onClose,
  calendarioId,
  onSaved,
}: MetasBottomSheetProps) {
  const selection = useMetasSelection({
    calendarioId,
    onSaved: () => {
      onClose();
      onSaved();
    },
  });

  return (
    <Sidebar
      visible={open}
      onHide={onClose}
      position="bottom"
      className="rounded-t-2xl"
      style={{ height: '85vh' }}
    >
      <div className="flex flex-col h-full">
        <span className="font-inter font-bold text-gray-800 text-lg">
          Adicionar metas
        </span>
        <p className="font-inter text-xs text-gray-400 mt-1">
          Selecione os programas para essa sessão.
        </p>

        <div className="flex-1 overflow-y-auto mt-2 pb-4">
          <MetasSelectionFields selection={selection} />
        </div>

        <div className="pt-3 border-t border-gray-300 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <ButtonHeron
            text="Salvar"
            type="primary"
            size="full"
            onClick={() => selection.onSubmit()}
            loading={selection.loading}
            typeButton="button"
            disabled={!selection.hasAnyContent}
          />
        </div>
      </div>
    </Sidebar>
  );
}
