import { FC } from 'react';
import { useModalidadeInfo } from './useModalidadeInfo';
import { ScheduleInfo } from './ScheduleInfo';
import { ChoiceItemScheduleProps } from './types';

export const ChoiceItemSchedule: FC<ChoiceItemScheduleProps> = ({
  start,
  end,
  title,
  statusEventos,
  localidade,
  isExterno,
  km,
  modalidade,
  dataInicio,
  dataFim,
  dataAtual,
}) => {
  const modalidadeInfo = useModalidadeInfo(modalidade, dataInicio, dataFim, dataAtual);

  return (
    <div className="flex gap-2 w-full items-center">
      <div className="grid text-center font-inter text-sm text-gray-400">
        <span>{start}</span> - <span>{end}</span>
      </div>

      <ScheduleInfo
        title={title}
        status={statusEventos}
        localidade={localidade}
        isExterno={isExterno}
        km={km}
        modalidadeInfo={modalidadeInfo}
      />
    </div>
  );
};
