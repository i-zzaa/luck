import clsx from 'clsx';

interface HeaderProgramaProps {
  estimuloDiscriminativo?: string;
  resposta?: string;
  estimuloReforcadorPositivo?: string;
}

// SD / Resposta / SR+ da tela de Sessão — três colunas lado a lado com
// rótulo curto (mesmo desenho da tela PEI: pages/pei/ProgramaPeiCard). O
// rótulo longo ("SR+ (estímulo reforçador positivo)") quebrava em 4
// linhas nas caixas de antes; o nome completo fica no title. Só as que
// têm valor.
export const HeaderPrograma = ({
  estimuloDiscriminativo = '',
  resposta = '',
  estimuloReforcadorPositivo = '',
}: HeaderProgramaProps) => {
  const colunas = [
    { rotulo: 'SD', completo: 'Estímulo discriminativo', valor: estimuloDiscriminativo },
    { rotulo: 'Resposta', completo: 'Resposta', valor: resposta },
    { rotulo: 'SR+', completo: 'Estímulo reforçador positivo', valor: estimuloReforcadorPositivo },
  ].filter((c) => c.valor);

  if (!colunas.length) return null;

  return (
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
          <span className="text-[13px] leading-[1.35] text-[#27272a] break-words">{c.valor}</span>
        </div>
      ))}
    </div>
  );
};
