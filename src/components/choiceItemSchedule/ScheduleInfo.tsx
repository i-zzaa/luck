import { FC } from 'react';
import clsx from 'clsx';
import { getStatusClass } from '../../util/status';

interface ScheduleInfoProps {
  title: string;
  status?: { codigo?: string; nome?: string };
  localidade: string;
  localExternoDescricao?: string;
  // FALLBACK TEMPORÁRIO: string já pronta pro "onde foi a sessão" (ex.:
  // "Consultório 2" ou "Casa do paciente - 12km"), preferida quando o
  // backend mandar. Enquanto não vier, cai na regra isExterno atual
  // (ver docs/pedido-backend-formatacao.md).
  localExibicao?: string;
  isExterno: boolean;
  km?: number;
  modalidadeInfo: string;
}

export const ScheduleInfo: FC<ScheduleInfoProps> = ({
  title,
  status,
  localidade,
  localExternoDescricao,
  localExibicao,
  isExterno,
  km,
  modalidadeInfo,
}) => (
  <div className="text-gray-800 text-sm text-center grid justify-center gap-1">
    <div className="font-base font-semibold text-primary">{title}</div>

    <p className="flex gap-2 items-center justify-center">
      <span>{modalidadeInfo}</span>
      {status?.nome && (
        <span
          className={clsx(
            'font-inter font-semibold rounded-full px-2 py-0.5 leading-4',
            getStatusClass(status)
          )}
        >
          {status.nome}
        </span>
      )}
    </p>

    <p className="flex gap-2 items-center justify-center">
      {localExibicao ?? (isExterno ? localExternoDescricao : localidade)}
      {!localExibicao && isExterno && (
        <span className="font-bold font-inter">{`- ${km}km`}</span>
      )}
    </p>
  </div>
);
