import clsx from 'clsx';
import moment from 'moment';
import { colorsData } from '../../util/util';
import { CodigoEspecialidade, resolveEspecialidadeCodigo } from '../../util/especialidade';
import { classificarStatus } from '../../util/status';

// Texto da especialidade na cor dela, só que mais escura: as cores de
// colorsData são pra fundo/borda e, em texto de 12px sobre branco, várias
// (laranja, amarelo) não passam de contraste.
const TEXTO_ESPECIALIDADE: Record<CodigoEspecialidade, string> = {
  TO: '#c2410c',
  FONO: '#a16207',
  PSICO: '#7e22ce',
  PSICOPEDAG: '#27272a',
  MOTRICIDADE: '#15803d',
  MUSICOTERAPIA: '#a16207',
};

const NOME_CURTO: Record<CodigoEspecialidade, string> = {
  TO: 'TO',
  FONO: 'Fono',
  PSICO: 'Psico',
  PSICOPEDAG: 'Psicopedagogia',
  MOTRICIDADE: 'Psicomotricidade',
  MUSICOTERAPIA: 'Musicoterapia',
};

export const sessaoPassada = (item: any) =>
  moment().startOf('day').isAfter(moment(item?.date).startOf('day'));

// Um status só, em texto + cor: atendida > falta/atestado (do backend) >
// "Não atendida" (dia passado sem atendimento — derivado aqui, o backend
// não manda campo de situação pra isso) > o status do evento.
const statusDaSessao = (item: any) => {
  if (item?.isAttended === true) {
    return { label: 'Atendida', className: 'bg-[#dcfce7] text-[#15803d]' };
  }
  const categoria = classificarStatus(item?.statusEventos);
  if (categoria === 'falta') {
    return { label: item.statusEventos.nome || 'Falta', className: 'bg-[#fee2e2] text-[#b91c1c]' };
  }
  if (categoria === 'atestado') {
    return { label: item.statusEventos.nome || 'Atestado', className: 'bg-[#fef3c7] text-[#92400e]' };
  }
  if (sessaoPassada(item)) {
    return { label: 'Não atendida', className: 'bg-[#fee2e2] text-[#b91c1c]' };
  }
  if (item?.statusEventos?.nome) {
    return { label: item.statusEventos.nome, className: 'bg-[#f4f4f5] text-[#3f3f46]' };
  }
  return null;
};

export function HorarioLivre({ item }: { item: any }) {
  return (
    <div className="min-h-[44px] flex items-center gap-3 px-3.5 border border-dashed border-gray-300 rounded-xl text-[13px] text-gray-800">
      <span className="font-bold text-[#3f3f46]">
        {item?.start}–{item?.end}
      </span>
      <span>{item?.title || 'Horário livre'}</span>
    </div>
  );
}

export function SessaoCard({
  item,
  onAbrir,
  onMetas,
}: {
  item: any;
  onAbrir: () => void;
  onMetas: () => void;
}) {
  // Decisões que vêm prontas do backend (item 7 do pedido-frontend-fase2):
  // - podeAbrirSessao: já embute "sessão atendida sempre abre em leitura";
  // - podeEditarMetas: sessão ainda não atendida e com status que permite
  //   atendimento.
  const podeAbrir = item?.podeAbrirSessao === true;
  const passada = sessaoPassada(item);
  // Regra da Agenda: sessão de dia passado nunca mostra "Metas", mesmo
  // que o backend mande podeEditarMetas (não atendida de ontem, p.ex.).
  const mostrarMetas = item?.podeEditarMetas === true && !passada;

  const codigo = resolveEspecialidadeCodigo(item?.especialidade);
  const corBarra = codigo ? colorsData[codigo] : '#d3d3d3';
  const corTexto = codigo ? TEXTO_ESPECIALIDADE[codigo] : '#52525b';
  const especialidade = codigo ? NOME_CURTO[codigo] : item?.especialidade?.nome;
  const status = statusDaSessao(item);
  const inicio = item?.data?.start;
  const fim = item?.data?.end;
  const detalhes = [item?.modalidadeExibicao, item?.localExibicao].filter(Boolean).join(' · ');

  return (
    <article
      className={clsx(
        'flex items-stretch rounded-[14px] border border-gray-200 overflow-hidden',
        passada ? 'bg-[#fcfcfd]' : 'bg-white'
      )}
    >
      <span className="w-1 shrink-0" style={{ background: corBarra }} aria-hidden />
      <button
        type="button"
        onClick={() => podeAbrir && onAbrir()}
        disabled={!podeAbrir}
        aria-label={[item?.title, inicio && fim ? `${inicio} às ${fim}` : null, status?.label]
          .filter(Boolean)
          .join(', ')}
        className="flex-1 min-w-0 flex gap-3 py-3 pl-3 pr-2 text-left disabled:cursor-default"
      >
        <span className="w-11 shrink-0 flex flex-col gap-0.5">
          <span className="text-[15px] font-bold text-[#27272a]">{inicio}</span>
          <span className="text-[12px] text-gray-800">{fim}</span>
        </span>
        <span className="flex-1 min-w-0 flex flex-col gap-1">
          <span className="text-[15px] font-bold text-[#27272a] truncate">{item?.title}</span>
          <span className="text-[12px] text-gray-800">
            {especialidade && (
              <span className="font-bold" style={{ color: corTexto }}>
                {especialidade}
              </span>
            )}
            {especialidade && detalhes && ' · '}
            {detalhes}
          </span>
          {status && (
            <span
              className={clsx(
                'self-start rounded-full px-2 py-px text-[11px] font-bold',
                status.className
              )}
            >
              {status.label}
            </span>
          )}
        </span>
      </button>
      <div className="flex items-center gap-0.5 pr-2">
        {mostrarMetas && (
          <button
            type="button"
            onClick={onMetas}
            aria-label={`Metas da sessão de ${item?.title}`}
            className="h-10 flex items-center gap-1.5 px-3 rounded-[10px] border border-primary bg-white text-[13px] font-bold text-primary"
          >
            <i className="pi pi-list text-[12px]" />
            Metas
          </button>
        )}
        {/* Indica que dá pra abrir — some quando o card está bloqueado
            (sessão futura fora do dia, tipo que não registra sessão…). */}
        {podeAbrir && <i className="pi pi-chevron-right text-[12px] text-[#71717a] ml-1" aria-hidden />}
      </div>
    </article>
  );
}
