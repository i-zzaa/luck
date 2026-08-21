import { FC } from 'react';
import clsx from 'clsx';

interface ScheduleInfoProps {
  title: string;
  status: string;
  localidade: string;
  localExternoDescricao?: string;
  isExterno: boolean;
  km?: number;
  modalidadeInfo: string;
}

// destaca visualmente status que exigem atenção (ex.: falta) dos que
// só confirmam o andamento normal do atendimento
const getStatusClass = (status?: string) => {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('falta')) return 'bg-red-400 text-white';
  if (normalized.includes('atestado')) return 'bg-yellow-400 text-gray-800';
  return 'bg-gray-300 text-gray-800';
};

export const ScheduleInfo: FC<ScheduleInfoProps> = ({
  title,
  status,
  localidade,
  localExternoDescricao,
  isExterno,
  km,
  modalidadeInfo,
}) => (
  <div className="text-gray-800 text-sm text-center grid justify-center gap-1">
    <div className="font-base font-semibold text-primary">{title}</div>

    <p className="flex gap-2 items-center justify-center">
      <span>{modalidadeInfo}</span>
      {status && (
        <span
          className={clsx(
            'font-inter font-semibold rounded-full px-2 py-0.5 leading-4',
            getStatusClass(status)
          )}
        >
          {status}
        </span>
      )}
    </p>

    <p className="flex gap-2 items-center justify-center">
      {isExterno ? localExternoDescricao : localidade}
      {isExterno && (
        <span className="font-bold font-inter">{`- ${km}km`}</span>
      )}
    </p>
  </div>
);
