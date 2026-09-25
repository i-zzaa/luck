import { useState } from 'react';
import clsx from 'clsx';
import {
  STATUS_META,
  STATUS_META_LABEL_CURTO,
  STATUS_META_PILL_CLASS,
} from '../../constants/protocolo';

const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);

const metaAtingida = (meta: any) =>
  meta?.status === STATUS_META.atingida || meta?.status === STATUS_META.manutencao;

// SD / Resposta / SR+ — três colunas lado a lado, com rótulo curto (o
// longo, "SR+ (estímulo reforçador positivo)", quebrava em 4 linhas nas
// caixas de antes). O nome completo fica no title. Só as que têm valor.
function Colunas({ fonte }: { fonte: any }) {
  const colunas = [
    { rotulo: 'SD', completo: 'Estímulo discriminativo', valor: fonte?.estimuloDiscriminativo },
    { rotulo: 'Resposta', completo: 'Resposta', valor: fonte?.resposta },
    { rotulo: 'SR+', completo: 'Estímulo reforçador positivo', valor: fonte?.estimuloReforcadorPositivo },
  ].filter((c) => c.valor);
  const procedimento = fonte?.procedimentoEnsino?.nome;

  if (!colunas.length && !procedimento) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* Título numa linha e o conteúdo na de baixo, no mesmo estilo das
          colunas SD/Resposta/SR+. */}
      {procedimento && (
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-bold text-primary">Procedimento</span>
          <span className="text-[14px] font-semibold leading-[1.35] text-[#27272a] break-words">
            {procedimento}
          </span>
        </div>
      )}
      {!!colunas.length && (
        <div
          className="grid py-2.5 border-y border-[#f4f4f5]"
          style={{ gridTemplateColumns: `repeat(${colunas.length}, minmax(0, 1fr))` }}
        >
          {colunas.map((c, i) => (
            <div
              key={c.rotulo}
              title={c.completo}
              className={clsx(
                'min-w-0 flex flex-col gap-1',
                i === 0 ? 'pr-2.5' : 'px-2.5 border-l border-gray-200'
              )}
            >
              <span className="text-[12px] font-bold text-primary">{c.rotulo}</span>
              <span className="text-[13px] leading-[1.35] text-[#27272a] break-words">
                {c.valor}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Meta({
  meta,
  numero,
  comColunas,
}: {
  meta: any;
  numero: number;
  // Portage: procedimento/estímulos vêm em cada meta, não no programa.
  comColunas: boolean;
}) {
  const status = meta?.status;
  const itens: any[] = meta?.subitems || [];

  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-[#f4f4f5]">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold tracking-[0.08em] text-primary">
          META {numero}
        </span>
        {status && STATUS_META_LABEL_CURTO[status] && (
          <span
            className={clsx(
              'rounded-full px-2 py-px text-[11px] font-bold',
              STATUS_META_PILL_CLASS[status]
            )}
          >
            {STATUS_META_LABEL_CURTO[status]}
          </span>
        )}
      </div>
      <span className="text-[14px] font-semibold leading-[1.4] text-[#27272a]">
        {meta?.value}
      </span>
      {comColunas && <Colunas fonte={meta} />}
      {!!itens.length && (
        <div className="flex flex-wrap gap-1.5">
          {itens.map((item: any, i: number) => (
            <span
              key={item?.id ?? i}
              className="text-[13px] px-2.5 py-1 rounded-lg bg-[#f4f4f5] text-[#3f3f46]"
            >
              {item?.value}
            </span>
          ))}
        </div>
      )}
      {meta?.observacao && (
        <p className="m-0 text-[13px] leading-[1.4] text-[#3f3f46]">
          <span className="font-bold">Observação: </span>
          {meta.observacao}
        </p>
      )}
    </div>
  );
}

interface ProgramaPeiCardProps {
  item: any;
  open: boolean;
  onToggle: () => void;
  // Portage: colunas por meta; Manual/VB-MAPP: no programa.
  colunasPorMeta: boolean;
  // Só no Manual: editar/excluir o programa inteiro (peiIds).
  onEditar?: () => void;
  onExcluir?: () => void;
}

// Um card por programa. Fechado: procedimento, quantas metas e quantas
// atingidas. Aberto: procedimento + SD/Resposta/SR+ e as metas.
export function ProgramaPeiCard({
  item,
  open,
  onToggle,
  colunasPorMeta,
  onEditar,
  onExcluir,
}: ProgramaPeiCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const metas: any[] = item?.metas || [];
  const atingidas = metas.filter(metaAtingida).length;
  const nome = item?.programa?.nome ?? item?.programa ?? '';
  const procedimento = !colunasPorMeta ? item?.procedimentoEnsino?.nome : null;
  const temAcoes = !!(onEditar || onExcluir);

  const resumo = [
    procedimento,
    `${metas.length} ${plural(metas.length, 'meta', 'metas')}, ${atingidas} ${plural(
      atingidas,
      'atingida',
      'atingidas'
    )}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="relative bg-white border border-gray-200 rounded-[14px]">
      <div className="flex items-start">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex-1 min-w-0 min-h-[68px] flex flex-col gap-1 pt-3 pb-3 pl-3.5 pr-1 text-left"
        >
          <span className="text-[16px] font-bold text-[#27272a] break-words">{nome}</span>
          <span className="text-[13px] text-gray-800">{resumo}</span>
        </button>
        {temAcoes && (
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={`Mais ações de ${nome}`}
            aria-expanded={menuOpen}
            className="w-11 h-11 mt-2.5 shrink-0 flex items-center justify-center rounded-full text-gray-800"
          >
            <i className="pi pi-ellipsis-h" />
          </button>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={`${open ? 'Recolher' : 'Abrir'} ${nome}`}
          className="w-11 h-11 mt-2.5 mr-1.5 shrink-0 flex items-center justify-center rounded-full text-primary"
        >
          <i className={clsx('pi pi-chevron-down transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-[4] cursor-default"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="menu"
            className="absolute top-[54px] right-[50px] z-[5] w-[190px] p-1.5 flex flex-col bg-white border border-gray-200 rounded-xl shadow-lg"
          >
            {onEditar && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onEditar();
                }}
                className="h-11 flex items-center gap-2.5 px-2.5 rounded-lg text-[14px] font-semibold text-[#27272a] text-left"
              >
                <i className="pi pi-pencil" />
                Editar programa
              </button>
            )}
            {onExcluir && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onExcluir();
                }}
                className="h-11 flex items-center gap-2.5 px-2.5 rounded-lg text-[14px] font-semibold text-[#b91c1c] text-left"
              >
                <i className="pi pi-trash" />
                Excluir programa
              </button>
            )}
          </div>
        </>
      )}

      {open && (
        <div className="border-t border-gray-200 px-3.5 pt-3 pb-4 flex flex-col gap-3.5">
          {!colunasPorMeta && <Colunas fonte={item} />}
          {metas.map((meta, i) => (
            <Meta key={meta?.id ?? i} meta={meta} numero={i + 1} comColunas={colunasPorMeta} />
          ))}
          {onEditar && (
            <button
              type="button"
              onClick={onEditar}
              className="h-11 flex items-center justify-center gap-2 rounded-xl border border-primary text-[14px] font-bold text-primary"
            >
              <i className="pi pi-pencil text-[13px]" />
              Editar programa
            </button>
          )}
        </div>
      )}
    </article>
  );
}
