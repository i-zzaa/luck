import clsx from 'clsx';
import { caminhoSvg, nomeDoCarimbo, type CarimboDados, type TracoAssinatura } from './traco';

/**
 * A assinatura já colhida, de volta na tela. Em SVG e não em canvas: aqui
 * ninguém desenha, e assim ela sai nítida em qualquer tamanho.
 */
export function AssinaturaDesenhada({
  traco,
  largura = 300,
  altura = 120,
  className,
  rotulo,
}: {
  traco: TracoAssinatura;
  largura?: number;
  altura?: number;
  className?: string;
  rotulo?: string;
}) {
  const caminho = caminhoSvg(traco || [], largura, altura);
  if (!caminho) return null;

  return (
    <svg
      viewBox={`0 0 ${largura} ${altura}`}
      className={clsx('h-auto w-full', className)}
      role="img"
      aria-label={rotulo ?? 'Assinatura da terapeuta'}
      data-testid="assinatura-desenhada"
    >
      <path
        d={caminho}
        fill="none"
        stroke="#1f2937"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Carimbo da terapeuta, como o de borracha da folha de evolução: nome
 * completo, especialidade e registro no conselho, um embaixo do outro.
 */
export function Carimbo({ carimbo, className }: { carimbo: CarimboDados; className?: string }) {
  return (
    <div
      className={clsx(
        'inline-flex flex-col items-center rounded-md border-2 border-violet-800 px-3 py-1.5 text-center text-violet-800',
        className
      )}
      data-testid="carimbo"
    >
      <span className="text-[13px] font-bold leading-4">{nomeDoCarimbo(carimbo.nome)}</span>
      {carimbo.especialidade && (
        <span className="text-[12px] leading-4">{carimbo.especialidade}</span>
      )}
      {carimbo.registro ? (
        <span className="text-[12px] font-semibold leading-4">{carimbo.registro}</span>
      ) : (
        <span className="text-[11px] italic leading-4 text-red-900">Registro não cadastrado</span>
      )}
    </div>
  );
}

/** "Assinatura e Carimbo" da folha: a rubrica por cima, o carimbo ao lado. */
export function AssinaturaECarimbo({
  traco,
  carimbo,
  assinadaEm,
  className,
}: {
  traco: TracoAssinatura;
  carimbo?: CarimboDados | null;
  assinadaEm?: string | null;
  className?: string;
}) {
  const quando = assinadaEm ? new Date(assinadaEm) : null;

  return (
    <div className={clsx('flex flex-wrap items-end gap-3', className)}>
      <div className="flex min-w-[140px] flex-1 flex-col">
        <AssinaturaDesenhada traco={traco} largura={240} altura={80} className="max-w-[220px]" />
        <span className="border-t border-gray-800 pt-0.5 text-[11px] text-gray-800">
          Assinatura e Carimbo
          {quando && !Number.isNaN(quando.getTime()) &&
            ` · ${quando.toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}`}
        </span>
      </div>
      {carimbo && <Carimbo carimbo={carimbo} />}
    </div>
  );
}
