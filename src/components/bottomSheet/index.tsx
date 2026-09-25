import { ReactNode, useId } from 'react';
import clsx from 'clsx';
import { Sidebar } from 'primereact/sidebar';
import '../seletorBottomSheet/styles.css';

// Bottom sheet do app. Base: o sheet do seletor de campo
// (components/seletorBottomSheet) — mesmo Sidebar do PrimeReact e as
// MESMAS classes/CSS (seletor-sheet, seletor-conteudo, seletor-alca,
// seletor-topo, seletor-fechar), então todos os sheets saem idênticos:
// animação, fundo escurecido, alça, título em roxo com a linha de apoio,
// X em círculo e largura centralizada no tablet. Usado nas confirmações
// e ações (Protocolo, PEI), filtro da Agenda e seleção de metas.
//
// `altura`:
// - "conteudo" (padrão): o sheet tem a altura do que está dentro, até
//   85% da tela; passou disso, o corpo rola. Serve pra confirmação e
//   formulário curto.
// - "cheia": o sheet ocupa 85% da tela e quem rola é o conteúdo, por
//   dentro — é o que mantém busca/cabeçalho parados e rodapé sempre
//   visível em lista longa.
export function BottomSheet({
  open,
  onClose,
  titulo,
  descricao,
  acoes,
  altura = 'conteudo',
  children,
}: {
  open: boolean;
  onClose: () => void;
  titulo: string;
  descricao?: ReactNode;
  // Ação no cabeçalho, à esquerda do X (ex.: "Limpar" do seletor).
  acoes?: ReactNode;
  altura?: 'conteudo' | 'cheia';
  children: ReactNode;
}) {
  const id = useId();
  const cheia = altura === 'cheia';

  return (
    <Sidebar
      visible={open}
      onHide={onClose}
      position="bottom"
      showCloseIcon={false}
      blockScroll
      className={clsx('seletor-sheet', cheia && 'seletor-sheet-cheia')}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="seletor-conteudo"
      >
        <span className="seletor-alca" aria-hidden />

        <div className="seletor-topo">
          <div>
            <strong id={id}>{titulo}</strong>
            {descricao && <small>{descricao}</small>}
          </div>
          <div className="seletor-topo-acoes">
            {acoes}
            <button type="button" className="seletor-fechar" onClick={onClose} aria-label="Fechar">
              <i className="pi pi-times" />
            </button>
          </div>
        </div>

        <div className={clsx('bottom-sheet-corpo', cheia && 'bottom-sheet-corpo-cheia')}>
          {children}
        </div>
      </div>
    </Sidebar>
  );
}
