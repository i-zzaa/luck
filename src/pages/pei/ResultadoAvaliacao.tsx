import clsx from 'clsx';
import { VALOR_PORTAGE } from '../../constants/protocolo';
import { formatdate } from '../../util/util';

// Portage / VB-MAPP na tela PEI: resultado (primeira × atual) e o que
// está em aquisição — mesmo desenho do protótipo (board, linha PEI).

const formatarData = (data?: string | null) =>
  data ? formatdate(data).slice(0, 5) : '';

// "0 a 1" → "0 a 1 ano"; "1 a 2" → "1 a 2 anos".
const rotuloFaixa = (faixa?: string) => {
  const m = /^\s*(\d+)\s*a\s*(\d+)\s*$/.exec(faixa || '');
  if (!m) return faixa || '';
  return `${m[1]} a ${m[2]} ${m[2] === '1' ? 'ano' : 'anos'}`;
};

// Portage: duas barras por área · faixa — primeira avaliação (clara) e
// atual (roxa). Os percentuais vêm prontos de tabelaComparativa
// (item 17), o front não calcula nada.
export function ResultadoPortage({ dados }: { dados: any }) {
  const avaliacoes: any[] = dados?.avaliacoes || [];
  if (!avaliacoes.length) return null;

  const atual = avaliacoes.find((a) => a.tipo === 'atual') || avaliacoes[avaliacoes.length - 1];
  const primeira =
    avaliacoes.find((a) => a.tipo === 'primeira' && a !== atual) ||
    (avaliacoes.length > 1 ? avaliacoes[0] : null);

  const valorEm = (avaliacao: any, categoria: string, indice: number) => {
    const cat = (avaliacao?.categorias || []).find((c: any) => c.nome === categoria);
    return cat?.valores?.[indice]?.percentual ?? null;
  };

  const linhas: { nome: string; antes: number | null; atual: number | null }[] = [];
  (atual.categorias || []).forEach((categoria: any) => {
    (atual.faixasEtarias || []).forEach((faixa: string, i: number) => {
      const indiceAntes = (primeira?.faixasEtarias || []).indexOf(faixa);
      linhas.push({
        nome: `${categoria.nome} · ${rotuloFaixa(faixa)}`,
        antes: primeira && indiceAntes >= 0 ? valorEm(primeira, categoria.nome, indiceAntes) : null,
        atual: categoria.valores?.[i]?.percentual ?? null,
      });
    });
  });

  const comparacao = primeira
    ? `Primeira avaliação (${formatarData(primeira.data)}) × atual (${formatarData(atual.data)})`
    : `Avaliação de ${formatarData(atual.data)}`;

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[13px] text-gray-800">{comparacao}</span>
      {primeira && (
        <div className="flex gap-3.5 text-[12px] font-semibold text-gray-800">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 rounded bg-[#d8b4e2]" />
            Primeira
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 rounded bg-primary" />
            Atual
          </span>
        </div>
      )}
      {linhas.map((linha) => {
        const delta =
          linha.antes !== null && linha.atual !== null ? linha.atual - linha.antes : 0;
        const texto =
          linha.atual === null
            ? 'Não se aplica'
            : primeira
              ? `${linha.antes === null ? '—' : `${linha.antes}%`} → ${linha.atual}%`
              : `${linha.atual}%`;

        return (
          <div key={linha.nome} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-[14px] font-semibold text-[#27272a]">{linha.nome}</span>
              <span
                className={clsx(
                  'shrink-0 text-[13px] font-bold',
                  delta > 0 ? 'text-[#15803d]' : delta < 0 ? 'text-[#b91c1c]' : 'text-gray-800'
                )}
              >
                {texto}
              </span>
            </div>
            {primeira && (
              <div className="h-2 rounded bg-[#f4f4f5] overflow-hidden">
                <div className="h-2 rounded bg-[#d8b4e2]" style={{ width: `${linha.antes ?? 0}%` }} />
              </div>
            )}
            <div className="h-2 rounded bg-[#f4f4f5] overflow-hidden">
              <div className="h-2 rounded bg-primary" style={{ width: `${linha.atual ?? 0}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const ETIQUETA: Record<string, { label: string; className: string }> = {
  [VALOR_PORTAGE.asVezes]: { label: 'Às vezes', className: 'bg-[#fef3c7] text-[#92400e]' },
  [VALOR_PORTAGE.nao]: { label: 'Não', className: 'bg-[#fee2e2] text-[#b91c1c]' },
  nulo: { label: 'Não avaliado', className: 'bg-[#f4f4f5] text-gray-800' },
};

const etiquetaDe = (selected: any) =>
  ETIQUETA[selected === null || selected === undefined || selected === '' ? 'nulo' : `${selected}`] ||
  ETIQUETA.nulo;

// Agrupa por área · faixa (Portage, quando a meta traz faixaEtaria) ou
// pelo programa (VB-MAPP).
export const agruparPendentes = (itens: any[] = []) => {
  const grupos: { titulo: string; metas: any[] }[] = [];
  itens.forEach((item) => {
    const programa = item?.programa?.nome ?? item?.programa ?? '';
    (item?.metas || []).forEach((meta: any) => {
      const titulo = meta?.faixaEtaria ? `${programa} · ${rotuloFaixa(meta.faixaEtaria)}` : programa;
      const grupo = grupos.find((g) => g.titulo === titulo);
      if (grupo) grupo.metas.push(meta);
      else grupos.push({ titulo, metas: [meta] });
    });
  });
  return grupos;
};

// "Em aquisição": o que ainda não foi atingido (/pei/filtro com
// `pendentes`), com a última resposta da avaliação como etiqueta.
export function PendentesAvaliacao({ grupos }: { grupos: { titulo: string; metas: any[] }[] }) {
  return (
    <>
      {grupos.map((grupo) => (
        <section
          key={grupo.titulo}
          className="bg-white border border-gray-200 rounded-[14px] px-3.5 py-3 flex flex-col gap-2"
        >
          <span className="text-[13px] font-bold text-primary">{grupo.titulo}</span>
          {grupo.metas.map((meta: any, i: number) => {
            const etiqueta = etiquetaDe(meta?.selected);
            return (
              <div
                key={meta?.id ?? i}
                className="flex items-start justify-between gap-2.5 pt-2 border-t border-[#f4f4f5]"
              >
                <span className="text-[14px] leading-[1.35] text-[#27272a]">{meta?.value}</span>
                <span
                  className={clsx(
                    'shrink-0 rounded-full px-2 py-px text-[11px] font-bold',
                    etiqueta.className
                  )}
                >
                  {etiqueta.label}
                </span>
              </div>
            );
          })}
        </section>
      ))}
    </>
  );
}
