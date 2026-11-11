import { useEffect, useState } from 'react';
import { BottomSheet } from '../bottomSheet';
import { ButtonHeron } from '../button';
import { QuadroDeAssinatura } from './QuadroDeAssinatura';
import { Carimbo } from './Carimbo';
import { tracoTemConteudo, type CarimboDados, type TracoAssinatura } from './traco';

interface Props {
  aberta: boolean;
  aoFechar: () => void;
  aoConfirmar: (traco: TracoAssinatura) => void;
  /** Carimbo de quem está registrando, para conferir antes de assinar. */
  carimbo?: CarimboDados | null;
  salvando?: boolean;
}

/**
 * Último passo antes de salvar a sessão: a terapeuta assina o resumo, como
 * fazia na folha de "Relatório evolutivo de sessão" (assinatura e carimbo).
 */
export function JanelaDeAssinatura({ aberta, aoFechar, aoConfirmar, carimbo, salvando }: Props) {
  const [traco, setTraco] = useState<TracoAssinatura>([]);
  // Só cobra depois da primeira tentativa: a janela não abre vermelha.
  const [tentou, setTentou] = useState(false);

  // Abrir de novo começa do zero.
  useEffect(() => {
    if (!aberta) return;
    setTraco([]);
    setTentou(false);
  }, [aberta]);

  const assinou = tracoTemConteudo(traco);

  const confirmar = () => {
    setTentou(true);
    if (!assinou) return;
    aoConfirmar(traco);
  };

  return (
    <BottomSheet
      open={aberta}
      onClose={() => !salvando && aoFechar()}
      titulo="Assinatura da sessão"
      descricao="Assine para finalizar. A assinatura e o seu carimbo vão junto do resumo."
    >
      <div className="flex flex-col gap-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <QuadroDeAssinatura traco={traco} onChange={setTraco} desabilitado={salvando} />

        <div className="flex items-center gap-2">
          {tentou && !assinou && (
            <span className="text-[13px] font-semibold text-red-900">Assine dentro do quadro.</span>
          )}
          <button
            type="button"
            onClick={() => setTraco([])}
            disabled={!traco.length || salvando}
            className="ml-auto h-9 px-3 rounded-[10px] text-[13px] font-bold text-primary disabled:opacity-40"
          >
            Limpar
          </button>
        </div>

        {carimbo && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[12px] text-gray-800">Seu carimbo</span>
            <Carimbo carimbo={carimbo} />
            {!carimbo.registro && (
              <span className="text-center text-[12px] text-gray-800">
                Peça à coordenação para cadastrar o seu CRM / registro no conselho.
              </span>
            )}
          </div>
        )}

        <div className="flex gap-2.5 pt-1">
          <div className="w-[40%]">
            <ButtonHeron
              text="Voltar"
              type="second"
              size="full"
              onClick={aoFechar}
              disabled={salvando}
            />
          </div>
          <div className="flex-1">
            <ButtonHeron
              text="Assinar e salvar"
              icon="pi pi-check"
              type="primary"
              size="full"
              loading={salvando}
              onClick={confirmar}
            />
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
