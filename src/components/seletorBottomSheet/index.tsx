import { useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { colorsData, colorsTextData } from '../../util/util';
import { resolveEspecialidadeCodigo } from '../../util/especialidade';
import './styles.css';

// Seleção em bottom sheet, no lugar do Dropdown/MultiSelect do PrimeReact.
// No celular o dropdown abria colado no campo, mostrava 4-5 itens e ficava
// atrás do teclado ao buscar; aqui a lista ocupa a parte de baixo da tela,
// com linhas grandes e a busca fixa no topo — mesmo padrão do
// MetasBottomSheet.
//
// As opções seguem o formato dos inputs do app: objetos com `nome` (e em
// geral `id`), e o valor é o próprio objeto, como no Dropdown com
// optionLabel="nome".

type Opcao = any;

// A partir de quantas opções a busca aparece: com poucas ela só atrapalha.
const MINIMO_PARA_BUSCA = 8;

const semAcento = (texto: unknown) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export const rotuloDaOpcao = (opcao: Opcao) =>
  opcao && typeof opcao === 'object' ? String(opcao.nome ?? '') : String(opcao ?? '');

// Identidade da opção: id quando existe (o valor gravado no formulário pode
// ser outra instância do mesmo objeto, vinda da API), senão o nome.
const chaveDaOpcao = (opcao: Opcao) => {
  if (opcao && typeof opcao === 'object') {
    if (opcao.id !== undefined && opcao.id !== null) return `id:${opcao.id}`;
    if (opcao.value !== undefined && opcao.value !== null) return `v:${opcao.value}`;
    return `n:${opcao.nome}`;
  }
  return `p:${opcao}`;
};

const mesmaOpcao = (a: Opcao, b: Opcao) =>
  a !== undefined && a !== null && b !== undefined && b !== null && chaveDaOpcao(a) === chaveDaOpcao(b);

// Chips coloridos pela especialidade, como o MultiSelect fazia via
// setColorChips.
const estiloDoChip = (opcao: Opcao) => {
  const codigo = resolveEspecialidadeCodigo(rotuloDaOpcao(opcao));
  return codigo ? { background: colorsData[codigo], color: colorsTextData[codigo] } : undefined;
};

interface SeletorBottomSheetProps {
  titulo: string;
  options?: Opcao[];
  value?: Opcao | Opcao[] | null;
  onChange: (valor: any) => void;
  multiple?: boolean;
  disabled?: boolean;
  // Mostra o "Limpar" (equivalente ao showClear do Dropdown).
  clearable?: boolean;
  className?: string;
  id?: string;
}

export function SeletorBottomSheet({
  titulo,
  options,
  value,
  onChange,
  multiple = false,
  disabled = false,
  clearable = true,
  className = '',
  id,
}: SeletorBottomSheetProps) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  // No múltiplo a escolha só vale no "Concluir": fechar o sheet descarta.
  const [rascunho, setRascunho] = useState<Opcao[]>([]);
  const listaRef = useRef<HTMLUListElement>(null);

  const lista: Opcao[] = Array.isArray(options) ? options : [];
  const selecionados: Opcao[] = multiple
    ? Array.isArray(value)
      ? value
      : []
    : value !== undefined && value !== null && value !== ''
    ? [value]
    : [];

  const filtradas = useMemo(() => {
    const termo = semAcento(busca);
    if (!termo) return lista;
    return lista.filter((opcao) => semAcento(rotuloDaOpcao(opcao)).includes(termo));
  }, [lista, busca]);

  const abrir = () => {
    if (disabled) return;
    setBusca('');
    setRascunho(selecionados);
    setAberto(true);
  };

  // Abre já rolado até o item escolhido, para quem só quer conferir.
  useEffect(() => {
    if (!aberto || multiple) return;
    const timer = setTimeout(() => {
      listaRef.current
        ?.querySelector('[aria-selected="true"]')
        ?.scrollIntoView({ block: 'center' });
    }, 50);
    return () => clearTimeout(timer);
  }, [aberto, multiple]);

  const escolher = (opcao: Opcao) => {
    if (multiple) {
      setRascunho((atuais) =>
        atuais.some((a) => mesmaOpcao(a, opcao))
          ? atuais.filter((a) => !mesmaOpcao(a, opcao))
          : [...atuais, opcao]
      );
      return;
    }
    onChange(opcao);
    setAberto(false);
  };

  const limpar = () => {
    if (multiple) {
      setRascunho([]);
      return;
    }
    onChange(null);
    setAberto(false);
  };

  const concluir = () => {
    onChange(rascunho);
    setAberto(false);
  };

  const marcados = multiple ? rascunho : selecionados;
  const temValor = selecionados.length > 0;
  const mostrarBusca = lista.length >= MINIMO_PARA_BUSCA;

  return (
    <>
      {/* Mesmas classes do Dropdown do PrimeReact: o campo fica idêntico
          aos outros inputs e o label-float continua funcionando. */}
      <button
        type="button"
        id={id}
        className={`seletor-campo p-dropdown p-component p-inputwrapper ${
          temValor ? 'p-inputwrapper-filled' : ''
        } ${disabled ? 'p-disabled' : ''} ${aberto ? 'p-focus' : ''} ${className}`}
        onClick={abrir}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        data-testid={id ? `seletor-${id}` : undefined}
      >
        <span className="p-dropdown-label p-inputtext seletor-valor">
          {multiple && temValor ? (
            <span className="seletor-chips">
              {selecionados.map((opcao) => (
                <span key={chaveDaOpcao(opcao)} className="seletor-chip" style={estiloDoChip(opcao)}>
                  {rotuloDaOpcao(opcao)}
                </span>
              ))}
            </span>
          ) : temValor ? (
            rotuloDaOpcao(selecionados[0])
          ) : (
            ' '
          )}
        </span>
        <span className="p-dropdown-trigger">
          <i className="p-dropdown-trigger-icon pi pi-chevron-down" />
        </span>
      </button>

      <Sidebar
        visible={aberto}
        onHide={() => setAberto(false)}
        position="bottom"
        showCloseIcon={false}
        blockScroll
        className="seletor-sheet"
        aria-label={titulo}
      >
        <div className="seletor-conteudo">
          <span className="seletor-alca" aria-hidden />

          <div className="seletor-topo">
            <div>
              <strong>{titulo}</strong>
              <small>
                {multiple
                  ? `${marcados.length} ${marcados.length === 1 ? 'selecionado' : 'selecionados'}`
                  : `${lista.length} ${lista.length === 1 ? 'opção' : 'opções'}`}
              </small>
            </div>
            <div className="seletor-topo-acoes">
              {clearable && (multiple ? rascunho.length > 0 : temValor) && (
                <button type="button" className="seletor-limpar" onClick={limpar}>
                  Limpar
                </button>
              )}
              <button
                type="button"
                className="seletor-fechar"
                onClick={() => setAberto(false)}
                aria-label="Fechar"
              >
                <i className="pi pi-times" />
              </button>
            </div>
          </div>

          {mostrarBusca && (
            <label className="seletor-busca">
              <i className="pi pi-search" />
              <input
                type="search"
                inputMode="search"
                placeholder="Buscar"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                aria-label={`Buscar em ${titulo}`}
              />
              {busca && (
                <button type="button" onClick={() => setBusca('')} aria-label="Limpar busca">
                  <i className="pi pi-times-circle" />
                </button>
              )}
            </label>
          )}

          <ul
            ref={listaRef}
            className="seletor-lista"
            role="listbox"
            aria-multiselectable={multiple || undefined}
          >
            {filtradas.map((opcao) => {
              const marcado = marcados.some((m) => mesmaOpcao(m, opcao));
              return (
                <li key={chaveDaOpcao(opcao)}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={marcado}
                    className={`seletor-opcao ${marcado ? 'marcada' : ''}`}
                    onClick={() => escolher(opcao)}
                  >
                    {multiple && (
                      <span className="seletor-caixa" aria-hidden>
                        {marcado && <i className="pi pi-check" />}
                      </span>
                    )}
                    <span className="seletor-rotulo">{rotuloDaOpcao(opcao)}</span>
                    {!multiple && marcado && <i className="pi pi-check seletor-check" />}
                  </button>
                </li>
              );
            })}
          </ul>

          {!filtradas.length && (
            <div className="seletor-vazio">
              <i className="pi pi-search" />
              {busca ? `Nada encontrado para "${busca}"` : 'Nenhuma opção disponível'}
            </div>
          )}

          {multiple && (
            <div className="seletor-rodape">
              <button type="button" className="seletor-concluir" onClick={concluir}>
                Concluir
                {rascunho.length ? ` (${rascunho.length})` : ''}
              </button>
            </div>
          )}
        </div>
      </Sidebar>
    </>
  );
}
