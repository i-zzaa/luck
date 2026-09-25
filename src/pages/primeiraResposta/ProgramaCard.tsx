import { useState } from 'react';
import clsx from 'clsx';
import { GraficoSeries } from '../../components/graficoLinha/GraficoSeries';
import {
  ChildRow,
  Dia,
  FAIXA,
  GrupoMeta,
  ProgramaGroup,
  agruparPorMeta,
  formatarDataColuna,
  formatarMedia,
  tarefaAtingida,
} from './tipos';

interface ProgramaCardProps {
  sec: ProgramaGroup;
  open: boolean;
  onToggle: () => void;
}

// Uma cor e um traço por item da meta — as linhas do gráfico se
// distinguem por cor E padrão, não só pela cor. A mesma amostra aparece
// ao lado do nome do item na grade e serve de legenda.
const SERIES = [
  { cor: '#662977', traco: '' },
  { cor: '#c2410c', traco: '7 4' },
  { cor: '#0f766e', traco: '2 4' },
  { cor: '#be185d', traco: '10 3 2 3' },
  { cor: '#1d4ed8', traco: '4 3' },
  { cor: '#57534e', traco: '1 3' },
];
const serieDe = (index: number) => SERIES[index % SERIES.length];

const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);

// Um card por programa. Fechado: faixa de acerto (texto + cor), quantas
// metas e quantos itens atingidos. Aberto: uma seção por meta, com um
// gráfico de todos os itens dela e a grade item × sessão.
export function ProgramaCard({ sec, open, onToggle }: ProgramaCardProps) {
  const media = formatarMedia(sec.mediaAcerto);
  const faixa = sec.classificacao !== 'na' ? FAIXA[sec.classificacao] : null;
  const itens = sec.children || [];
  const atingidos = itens.filter(tarefaAtingida).length;
  const grupos = agruparPorMeta(itens);
  const comMetas = grupos.some((g) => g.meta !== null);

  return (
    <article className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full min-h-[72px] flex items-center gap-3 py-3 pl-3.5 pr-3 text-left"
      >
        <span className="flex-1 min-w-0 flex flex-col gap-1">
          <span className="text-[16px] font-bold text-[#27272a] break-words">
            {sec.programa}
          </span>
          <span className="text-[13px] text-gray-800">
            {comMetas && `${grupos.length} ${plural(grupos.length, 'meta', 'metas')} · `}
            {atingidos} de {itens.length}{' '}
            {plural(itens.length, 'item atingido', 'itens atingidos')}
          </span>
        </span>

        <span
          className={clsx(
            'shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-bold',
            faixa ? faixa.className : 'bg-gray-200 text-gray-800'
          )}
        >
          {media === null
            ? 'Sem dados'
            : faixa
              ? `${faixa.label} · ${media}%`
              : `${media}%`}
        </span>

        <i
          className={clsx(
            'pi pi-chevron-down shrink-0 text-primary transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="border-t border-gray-200 px-3.5 pb-2 flex flex-col">
          {grupos.map((grupo, i) => (
            <SecaoMeta
              key={`${grupo.meta ?? 'sem-meta'}-${i}`}
              grupo={grupo}
              numero={i + 1}
              mostrarCabecalho={comMetas}
              colunas={sec.colunas || []}
            />
          ))}
        </div>
      )}
    </article>
  );
}

// Legenda da tela inteira — uma vez só, acima da lista de programas (ver
// pages/PrimeiraResposta.tsx), não repetida em cada programa aberto. Dois
// indicadores convivem na mesma célula (cor = acertou de primeira ou não;
// número = % de acertos na sessão inteira).
export function Legenda() {
  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[12px] font-semibold text-gray-800">
      <span className="flex items-center gap-1.5">
        <span className="w-[18px] h-[18px] rounded-[5px] bg-[#dcfce7] border border-[#86efac]" />
        acertou de primeira
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-[18px] h-[18px] rounded-[5px] bg-[#fee2e2] border border-[#fca5a5]" />
        não acertou
      </span>
      <span>% = acertos na sessão</span>
      {/* Regra do backend (sessao.service getResumoAtividadePorPrograma):
          atingido = 100% em todas as sessões da janela (3). */}
      <span className="basis-full">
        Atingido = 100% nas 3 últimas sessões seguidas
      </span>
    </div>
  );
}

// Uma meta: cabeçalho, gráfico com uma linha por item e a grade
// item × sessão. Tocar num item destaca a linha dele no gráfico.
function SecaoMeta({
  grupo,
  numero,
  mostrarCabecalho,
  colunas,
}: {
  grupo: GrupoMeta;
  numero: number;
  mostrarCabecalho: boolean;
  colunas: ProgramaGroup['colunas'];
}) {
  const [destaque, setDestaque] = useState<number | null>(null);

  const datas = colunas.map((coluna, i) => formatarDataColuna(coluna.data, i));
  const atingidos = grupo.itens.filter(tarefaAtingida).length;
  const series = grupo.itens.map((item, i) => ({
    id: String(i),
    ...serieDe(i),
    valores: colunas.map((_, c) => formatarMedia(item.dias?.[c]?.porcentagem ?? null)),
  }));
  const temGrafico = series.some((s) => s.valores.some((v) => v !== null));
  const podeDestacar = grupo.itens.length > 1;
  const gridTemplateColumns = `minmax(0, 1fr) repeat(${colunas.length}, 54px)`;
  const nomeMeta = grupo.meta ?? `Meta ${numero}`;

  const descricaoGrafico = grupo.itens
    .map(
      (item) =>
        `${item.programa} ${datas
          .map((data, c) => {
            const v = item.dias?.[c]?.porcentagem;
            return `${data} ${v === null || v === undefined ? 'sem registro' : `${Math.round(v)}%`}`;
          })
          .join(', ')}`
    )
    .join('; ');

  return (
    <section className="flex flex-col gap-2.5 py-4 border-b border-gray-200 last:border-b-0">
      {mostrarCabecalho && (
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-bold tracking-[0.08em] text-primary">
            META {numero}
          </span>
          <h3 className="m-0 text-[15px] font-bold leading-[1.35] text-[#27272a] break-words">
            {grupo.meta ?? 'Sem meta'}
          </h3>
          <span className="text-[13px] text-gray-800">
            {atingidos} de {grupo.itens.length}{' '}
            {plural(grupo.itens.length, 'item atingido', 'itens atingidos')}
          </span>
        </div>
      )}

      {temGrafico && (
        <>
          <GraficoSeries
            datas={datas}
            series={series}
            destaque={destaque === null ? null : String(destaque)}
            altura={140}
            ariaLabel={`Acerto por item — ${nomeMeta}: ${descricaoGrafico}`}
          />
          {podeDestacar && (
            <span className="-mt-1 text-[12px] text-gray-800">
              {destaque === null
                ? 'Toque num item para destacar a linha dele'
                : 'Toque de novo no item para ver todos'}
            </span>
          )}
        </>
      )}

      <div role="table" aria-label={`Itens — ${nomeMeta}`} className="flex flex-col">
        <div role="row" className="grid gap-1.5 items-end pb-1.5" style={{ gridTemplateColumns }}>
          <span role="columnheader" className="text-[12px] font-bold text-gray-800">
            Item
          </span>
          {datas.map((data, i) => (
            <span
              key={i}
              role="columnheader"
              className="text-[12px] font-bold text-gray-800 text-center"
            >
              {data}
            </span>
          ))}
        </div>

        {grupo.itens.map((item, i) => (
          <div
            key={`${item.programa}-${i}`}
            role="row"
            className="grid gap-1.5 items-center py-2 border-t border-[#f4f4f5]"
            style={{ gridTemplateColumns }}
          >
            <div role="cell" className="min-w-0">
              <NomeItem
                item={item}
                serie={serieDe(i)}
                ativo={destaque === i}
                onClick={
                  podeDestacar
                    ? () => setDestaque(destaque === i ? null : i)
                    : undefined
                }
              />
            </div>
            {colunas.map((_, c) => (
              <CelulaDia key={c} dia={item.dias?.[c]} data={datas[c]} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function NomeItem({
  item,
  serie,
  ativo,
  onClick,
}: {
  item: ChildRow;
  serie: { cor: string; traco: string };
  ativo: boolean;
  onClick?: () => void;
}) {
  // Sem etiqueta de status por item — o que foi atingido aparece nas
  // contagens da meta/programa, e as células já mostram cada sessão.
  const conteudo = (
    <span className="flex items-center gap-[7px]">
        <svg width="18" height="8" viewBox="0 0 18 8" aria-hidden="true" className="shrink-0">
          <line
            x1="1"
            y1="4"
            x2="17"
            y2="4"
            stroke={serie.cor}
            strokeWidth={3}
            strokeDasharray={serie.traco || undefined}
            strokeLinecap="round"
          />
        </svg>
        <span
          className={clsx(
            'text-[14px] leading-[1.3] text-[#27272a] break-words',
            ativo ? 'font-bold' : 'font-semibold'
          )}
        >
          {item.programa}
        </span>
    </span>
  );

  if (!onClick) {
    return <div className="py-1">{conteudo}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={clsx(
        'w-full min-h-[44px] flex items-center py-1 pr-1.5 rounded-lg text-left',
        ativo && 'bg-[#faf5fc]'
      )}
    >
      {conteudo}
    </button>
  );
}

function CelulaDia({ dia, data }: { dia?: Dia; data: string }) {
  if (!dia) {
    return (
      <div
        role="cell"
        aria-label={`${data}: sem sessão`}
        className="h-11 rounded-[10px] flex items-center justify-center bg-[#f4f4f5] text-[#71717a] text-[12px] font-bold"
      >
        —
      </div>
    );
  }

  const acertou = dia.primeiraResposta === '+';
  // null = sessão sem porcentagem apurada naquele dia. Arredondado: o
  // backend manda 66.67, que não cabe no bloco e não muda a leitura.
  const pct = dia.porcentagem === null ? '—' : `${Math.round(dia.porcentagem)}%`;

  return (
    <div
      role="cell"
      aria-label={`${data}: ${acertou ? 'acertou de primeira' : 'não acertou de primeira'}, ${
        dia.porcentagem === null ? 'sem percentual' : `${Math.round(dia.porcentagem)}% de acerto`
      }`}
      className={clsx(
        'h-11 rounded-[10px] flex items-center justify-center',
        acertou ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fee2e2] text-[#b91c1c]'
      )}
    >
      {/* Só a cor diz se acertou de primeira (sem ícone ✓/✕); o
          aria-label mantém isso pra leitor de tela. */}
      <span className="text-[12px] font-bold">{pct}</span>
    </div>
  );
}
