import { ButtonHeron } from '../button';
import { BottomSheet } from '../bottomSheet';
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
    <BottomSheet
      open={open}
      onClose={onClose}
      titulo="Adicionar metas"
      descricao="Selecione os programas para essa sessão."
      altura="cheia"
    >
      <div className="flex-1 min-h-0 overflow-y-auto pb-4">
        <MetasSelectionFields selection={selection} />
      </div>

      <div className="pt-3 border-t border-gray-300">
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
    </BottomSheet>
  );
}
