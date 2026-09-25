import { ReactNode } from 'react';
import clsx from 'clsx';
import { VALOR_PORTAGE } from '../../constants/protocolo';
import { useIsTabRoute } from '../../components/Nav/useIsTabRoute';
import { ABOVE_TAB_BAR } from '../../components/Nav/bottomTabBarLayout';
import { BottomSheet } from '../../components/bottomSheet';

// Peças compartilhadas pela avaliação do Portage e do VB-MAPP
// (foms/Portage.tsx, foms/VBMapp.tsx): mesma resposta de 3 valores
// (VALOR_PORTAGE), mesmo agrupamento em cards com progresso.

export type Resposta = VALOR_PORTAGE | null | undefined;

const OPCOES = [
  { valor: VALOR_PORTAGE.sim, label: 'Sim', ativo: 'bg-[#15803d] border-[#15803d] text-white' },
  { valor: VALOR_PORTAGE.asVezes, label: 'Às vezes', ativo: 'bg-[#b45309] border-[#b45309] text-white' },
  { valor: VALOR_PORTAGE.nao, label: 'Não', ativo: 'bg-[#b91c1c] border-[#b91c1c] text-white' },
];

const respondido = (valor: Resposta) =>
  valor !== null && valor !== undefined && `${valor}` !== '';

// Três botões com texto, um toque só — no lugar do quadrado que alternava
// S → AV → N → vazio (3 toques pra "Não", letras sem legenda). Tocar de
// novo na opção marcada limpa a resposta.
export function RespostaSegmentada({
  valor,
  onChange,
  rotulo,
  compacta = false,
}: {
  valor: Resposta;
  onChange: (valor: VALOR_PORTAGE | null) => void;
  rotulo: string;
  compacta?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="grid grid-cols-3 gap-1.5">
      {OPCOES.map((op) => {
        const ativo = `${valor}` === op.valor;
        return (
          <button
            key={op.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(ativo ? null : op.valor)}
            className={clsx(
              'border font-bold',
              compacta ? 'h-8 rounded-lg text-[12px]' : 'h-[38px] rounded-[10px] text-[13px]',
              ativo ? op.ativo : 'bg-white border-gray-300 text-[#3f3f46]'
            )}
          >
            {op.label}
          </button>
        );
      })}
    </div>
  );
}

export type Contagem = {
  total: number;
  respondidos: number;
  sim: number;
  asVezes: number;
  nao: number;
};

// Conta item + subitens (cada subitem também é respondido).
export const contarRespostas = (itens: any[] = []): Contagem => {
  const c: Contagem = { total: 0, respondidos: 0, sim: 0, asVezes: 0, nao: 0 };
  const somar = (valor: Resposta) => {
    c.total += 1;
    if (!respondido(valor)) return;
    c.respondidos += 1;
    if (`${valor}` === VALOR_PORTAGE.sim) c.sim += 1;
    else if (`${valor}` === VALOR_PORTAGE.asVezes) c.asVezes += 1;
    else if (`${valor}` === VALOR_PORTAGE.nao) c.nao += 1;
  };
  itens.forEach((item) => {
    somar(item?.selected);
    (item?.subitems || []).forEach((sub: any) => somar(sub?.selected));
  });
  return c;
};

export const somarContagens = (lista: Contagem[]): Contagem =>
  lista.reduce(
    (a, c) => ({
      total: a.total + c.total,
      respondidos: a.respondidos + c.respondidos,
      sim: a.sim + c.sim,
      asVezes: a.asVezes + c.asVezes,
      nao: a.nao + c.nao,
    }),
    { total: 0, respondidos: 0, sim: 0, asVezes: 0, nao: 0 }
  );

// "Só não avaliados": item sem resposta, ou com algum subitem sem resposta.
export const itemPendente = (item: any) =>
  !respondido(item?.selected) ||
  (item?.subitems || []).some((sub: any) => !respondido(sub?.selected));

// Quantas respostas mudaram desde a última versão salva. Compara pela
// posição na árvore (grupo → item → subitem), não pelo id — mesma razão
// de onCheckboxChange em Portage.tsx/VBMapp.tsx usar índice.
export const contarAlteracoes = (
  atual: Record<string, any[]>,
  salvo: Record<string, any[]>
) => {
  let n = 0;
  const norm = (v: Resposta) => (respondido(v) ? `${v}` : null);
  Object.keys(atual || {}).forEach((grupo) => {
    (atual[grupo] || []).forEach((item: any, i: number) => {
      const antes = salvo?.[grupo]?.[i];
      if (norm(item?.selected) !== norm(antes?.selected)) n += 1;
      (item?.subitems || []).forEach((sub: any, j: number) => {
        if (norm(sub?.selected) !== norm(antes?.subitems?.[j]?.selected)) n += 1;
      });
    });
  });
  return n;
};

// variante "forte": escolha principal da tela (o protocolo) — opção
// marcada em roxo cheio sobre trilho cinza. "suave" (padrão): escolhas
// dentro do protocolo (área, nível).
export function Segmentado<T extends string | number>({
  opcoes,
  valor,
  onChange,
  rotulo,
  variante = 'suave',
}: {
  opcoes: { valor: T; label: string }[];
  valor: T;
  onChange: (valor: T) => void;
  rotulo: string;
  variante?: 'suave' | 'forte';
}) {
  const forte = variante === 'forte';
  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      className={clsx(
        'grid gap-1 p-1 rounded-xl',
        forte ? 'bg-[#f4f4f5]' : 'bg-white border border-gray-200'
      )}
      style={{ gridTemplateColumns: `repeat(${opcoes.length}, minmax(0, 1fr))` }}
    >
      {opcoes.map((op) => {
        const ativo = op.valor === valor;
        return (
          <button
            key={String(op.valor)}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(op.valor)}
            className={clsx(
              'rounded-lg font-bold',
              forte ? 'h-10 text-[14px]' : 'h-9 text-[13px]',
              ativo
                ? forte
                  ? 'bg-primary text-white'
                  : 'bg-[#f3e8f7] text-primary'
                : forte
                  ? 'text-[#3f3f46]'
                  : 'text-gray-800'
            )}
          >
            {op.label}
          </button>
        );
      })}
    </div>
  );
}

// Progresso do protocolo inteiro + relatório (secundário, ao lado — antes
// era o botão roxo grande no topo da tela).
export function ProgressoGeral({
  contagem,
  protocolo,
  onRelatorio,
}: {
  contagem: Contagem;
  protocolo: string;
  onRelatorio?: () => void;
}) {
  const pct = contagem.total ? Math.round((contagem.respondidos / contagem.total) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <span className="text-[13px] font-bold text-[#27272a]">
          {contagem.respondidos} de {contagem.total} itens avaliados no {protocolo}
        </span>
        <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {onRelatorio && (
        <button
          type="button"
          onClick={onRelatorio}
          className="h-10 shrink-0 flex items-center gap-1.5 px-3 rounded-[10px] border border-primary bg-white text-[13px] font-bold text-primary"
        >
          <i className="pi pi-file-pdf text-[14px]" />
          Relatório
        </button>
      )}
    </div>
  );
}

export function FiltroPendentes({
  ativo,
  onChange,
}: {
  ativo: boolean;
  onChange: (ativo: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!ativo)}
      aria-pressed={ativo}
      className={clsx(
        'self-start h-9 flex items-center gap-1.5 px-3.5 rounded-full border text-[13px] font-bold',
        ativo ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-[#3f3f46]'
      )}
    >
      <i className="pi pi-filter text-[11px]" />
      Só não avaliados
    </button>
  );
}

// Card de uma faixa etária (Portage) ou programa (VB-MAPP).
export function GrupoAvaliacao({
  titulo,
  contagem,
  open,
  onToggle,
  acao,
  vazio,
  children,
}: {
  titulo: string;
  contagem: Contagem;
  open: boolean;
  onToggle: () => void;
  acao?: ReactNode;
  vazio?: boolean;
  children: ReactNode;
}) {
  const completo = contagem.total > 0 && contagem.respondidos === contagem.total;
  const pct = contagem.total ? Math.round((contagem.respondidos / contagem.total) * 100) : 0;

  return (
    <article className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full min-h-[64px] flex items-center gap-3 py-3 pl-3.5 pr-3 text-left"
      >
        <span className="flex-1 min-w-0 flex flex-col gap-1.5">
          <span className="flex justify-between items-baseline gap-2">
            <span className="text-[16px] font-bold text-[#27272a] break-words">{titulo}</span>
            <span
              className={clsx(
                'shrink-0 text-[12px] font-bold',
                completo ? 'text-[#15803d]' : 'text-gray-800'
              )}
            >
              {completo ? 'Completo' : `${contagem.respondidos} de ${contagem.total}`}
            </span>
          </span>
          <span className="h-[5px] rounded-full bg-[#f4f4f5] overflow-hidden">
            <span
              className={clsx('block h-[5px] rounded-full', completo ? 'bg-[#15803d]' : 'bg-primary')}
              style={{ width: `${pct}%` }}
            />
          </span>
          <span className="text-[12px] text-gray-800">
            {contagem.sim} sim · {contagem.asVezes} às vezes · {contagem.nao} não
          </span>
        </span>
        <i
          className={clsx(
            'pi pi-chevron-down shrink-0 text-primary transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="border-t border-gray-200 px-3.5 pt-1 pb-3.5 flex flex-col">
          {acao}
          {vazio ? (
            <p className="m-0 mt-3 text-[14px] text-gray-800">
              Todos os itens desta parte já foram avaliados.
            </p>
          ) : (
            children
          )}
        </div>
      )}
    </article>
  );
}

export function BotaoEditar({ texto, onClick }: { texto: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 h-8 flex items-center gap-1 px-2 rounded-lg bg-[#faf5fc] text-[12px] font-bold text-primary"
    >
      <i className="pi pi-pencil text-[11px]" />
      {texto}
    </button>
  );
}

// Um item com a resposta dele e, aninhados, os subitens.
export function ItemAvaliacao({
  item,
  onResponder,
  onResponderSub,
  acao,
}: {
  item: any;
  onResponder: (valor: VALOR_PORTAGE | null) => void;
  onResponderSub: (subIndex: number, valor: VALOR_PORTAGE | null) => void;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 py-3 border-b border-[#f4f4f5] last:border-b-0">
      <div className="flex items-start gap-2">
        <span className="flex-1 text-[14px] font-semibold leading-[1.35] text-[#27272a]">
          {item.nome}
        </span>
        {acao}
      </div>
      <RespostaSegmentada
        valor={item.selected}
        onChange={onResponder}
        rotulo={`Resposta: ${item.nome}`}
      />
      {!!item?.subitems?.length && (
        <div className="ml-1.5 pl-3 border-l-2 border-gray-200 flex flex-col gap-2.5">
          {item.subitems.map((sub: any, j: number) => (
            <div key={sub.id ?? j} className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-[#3f3f46]">{sub.nome}</span>
              <RespostaSegmentada
                compacta
                valor={sub.selected}
                onChange={(valor) => onResponderSub(j, valor)}
                rotulo={`Resposta: ${sub.nome}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Aparece só com resposta não salva — antes o "Salvar" ficava fixo o
// tempo todo, somando com a tab bar por cima do conteúdo.
export function BarraSalvar({
  alteracoes,
  loading,
  onSalvar,
}: {
  alteracoes: number;
  loading: boolean;
  onSalvar: () => void;
}) {
  const isTabRoute = useIsTabRoute();
  if (alteracoes <= 0) return null;

  return (
    <div
      className={clsx(
        'fixed inset-x-4 z-10 min-h-[56px] flex items-center gap-3 py-1.5 pr-1.5 pl-4 rounded-[14px] bg-[#27272a] text-white shadow-lg',
        isTabRoute ? ABOVE_TAB_BAR : 'bottom-[calc(1rem+env(safe-area-inset-bottom))]'
      )}
    >
      <span className="flex-1 text-[14px] font-semibold">
        {alteracoes} {alteracoes === 1 ? 'resposta não salva' : 'respostas não salvas'}
      </span>
      <button
        type="button"
        onClick={onSalvar}
        disabled={loading}
        className="h-11 px-5 rounded-[10px] bg-white text-[14px] font-bold text-primary disabled:opacity-60"
      >
        {loading ? 'Salvando…' : 'Salvar'}
      </button>
    </div>
  );
}

// Antes de uma troca que descartaria respostas (nível, paciente,
// protocolo): salvar ou descartar, num bottom sheet. Tocar fora ou no X
// cancela e continua onde estava.
export function SheetAlteracoes({
  open,
  alteracoes,
  destino,
  salvando,
  onSalvar,
  onDescartar,
  onCancelar,
}: {
  open: boolean;
  alteracoes: number;
  // "trocar de nível", "trocar de paciente"…
  destino: string;
  salvando: boolean;
  onSalvar: () => void;
  onDescartar: () => void;
  onCancelar: () => void;
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onCancelar}
      titulo={`${alteracoes} ${alteracoes === 1 ? 'resposta não salva' : 'respostas não salvas'}`}
      descricao={`Salve antes de ${destino}, ou descarte essas respostas.`}
    >
      <button
        type="button"
        onClick={onSalvar}
        disabled={salvando}
        className="h-12 rounded-xl bg-primary text-white text-[15px] font-bold disabled:opacity-60"
      >
        {salvando ? 'Salvando…' : 'Salvar'}
      </button>
      <button
        type="button"
        onClick={onDescartar}
        disabled={salvando}
        className="h-12 rounded-xl border border-gray-300 bg-white text-[15px] font-bold text-[#b91c1c] disabled:opacity-60"
      >
        Descartar
      </button>
    </BottomSheet>
  );
}
