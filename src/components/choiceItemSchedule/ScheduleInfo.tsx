import { FC } from 'react';
import clsx from 'clsx';
import { getStatusClass } from '../../util/status';

interface ScheduleInfoProps {
  title: string;
  status?: { codigo?: string; nome?: string };
  // "Onde foi a sessão", já pronto do backend (ex.: "Consultório 2" ou
  // "Casa do paciente - 12km") — a regra isExterno/km mora lá.
  localExibicao?: string;
  modalidadeInfo: string;
}

export const ScheduleInfo: FC<ScheduleInfoProps> = ({
  title,
  status,
  localExibicao,
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

    <p className="flex gap-2 items-center justify-center">{localExibicao}</p>
  </div>
);
