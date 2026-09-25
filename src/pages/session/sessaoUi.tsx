import { ReactNode } from 'react';
import clsx from 'clsx';

// Peças de layout da tela de Sessão, compartilhadas por Manual, Portage e
// VB-MAPP (SessionActivity/SessionPortage/SessionVBMapp). Os controles de
// registro (CheckboxDTT, CheckboxSN) continuam os mesmos — aqui é só o
// entorno: card do programa, cabeçalho da meta, item com placar.

const isObjNode = (n: any) => n && typeof n === 'object' && !Array.isArray(n);

export const getLabel = (n: any) => n?.label ?? n?.value ?? n?.nome ?? '—';

// Folhas da árvore = nós cujos filhos são os slots (null/valor), não
// outros nós. É o que a terapeuta registra: meta folha ou ato.
export const folhasDe = (arvore: any[] = []): any[] => {
  const folhas: any[] = [];
  const visitar = (no: any) => {
    const filhos = Array.isArray(no?.children) ? no.children : [];
    if (filhos.some(isObjNode)) filhos.filter(isObjNode).forEach(visitar);
    else if (filhos.length) folhas.push(no);
  };
  (arvore || []).forEach(visitar);
  return folhas;
};

const preenchidos = (slots: any[] = []) => slots.filter((v) => v !== null && v !== undefined && v !== '');

export const contarComTentativa = (arvore: any[] = []) => {
  const folhas = folhasDe(arvore);
  return {
    total: folhas.length,
    comTentativa: folhas.filter((f) => preenchidos(f.children).length > 0).length,
  };
};

// Regra do treino: 4 tentativas corretas (C) em espaços consecutivos.
export const quatroCorretasSeguidas = (slots: any[] = []) => {
  let seguidas = 0;
  for (const v of slots) {
    seguidas = v === 'C' ? seguidas + 1 : 0;
    if (seguidas >= 4) return true;
  }
  return false;
};

// Card de um programa (Manual), área · faixa (Portage) ou nível ·
// programa (VB-MAPP). Quem controla aberto/fechado é o pai.
export function CardGrupo({
  titulo,
  resumo,
  open,
  onToggle,
  children,
}: {
  titulo: string;
  resumo?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <article className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full min-h-[64px] flex items-center gap-3 py-3 pl-3.5 pr-3 text-left"
      >
        <span className="flex-1 min-w-0 flex flex-col gap-1">
          <span className="text-[16px] font-bold text-[#27272a] break-words">{titulo}</span>
          {resumo && <span className="text-[13px] text-gray-800">{resumo}</span>}
        </span>
        <i
          className={clsx(
            'pi pi-chevron-down shrink-0 text-primary transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="border-t border-gray-200 px-3.5 pt-3 pb-4 flex flex-col gap-3.5">
          {children}
        </div>
      )}
    </article>
  );
}

// "2 de 3 itens com tentativas" — resumo do card do grupo.
export const resumoGrupo = (no: any) => {
  const { total, comTentativa } = contarComTentativa([no]);
  if (!total) return undefined;
  return `${comTentativa} de ${total} ${total === 1 ? 'item com tentativas' : 'itens com tentativas'}`;
};

export function CabecalhoMeta({ numero, nome }: { numero: number; nome: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-bold tracking-[0.08em] text-primary">META {numero}</span>
      <span className="text-[14px] font-semibold leading-[1.4] text-[#27272a]">{nome}</span>
    </div>
  );
}

// Um item com as tentativas (os controles de sempre, passados em
// children) e o placar. Linha simples, sem caixa — os itens de uma meta
// ficam separados só por uma divisória. Registrando (não em leitura),
// ganha a etiqueta "4 seguidas" quando fecha 4 corretas consecutivas.
export function ItemTentativas({
  nome,
  slots,
  leitura = false,
  children,
}: {
  nome: string;
  slots: any[];
  leitura?: boolean;
  children: ReactNode;
}) {
  const feitas = preenchidos(slots);
  const corretas = feitas.filter((v) => v === 'C').length;
  const encerrar = !leitura && quatroCorretasSeguidas(slots);

  return (
    <div className="flex flex-col gap-1.5 py-2.5 border-t border-[#f4f4f5] first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] font-semibold text-[#27272a] break-words">{nome}</span>
        <span className="shrink-0 flex items-center gap-1.5 text-[12px] text-gray-800">
          {encerrar && (
            <span
              role="status"
              title="4 corretas seguidas — pode encerrar este item"
              className="flex items-center gap-1 rounded-full px-2 py-px bg-[#dcfce7] text-[#15803d] font-bold"
            >
              <i className="pi pi-check text-[9px]" />4 seguidas
            </span>
          )}
          {feitas.length ? `${corretas}/${feitas.length} corretas` : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}
