import { FC } from 'react';
import { ScheduleInfo } from './ScheduleInfo';
import { ChoiceItemScheduleProps } from './types';

export const ChoiceItemSchedule: FC<ChoiceItemScheduleProps> = ({
  start,
  end,
  title,
  statusEventos,
  localExibicao,
  modalidade,
}) => (
  <div className="flex gap-2 w-full items-start">
    <div className="grid text-center font-inter text-sm text-gray-400">
      <span>{start}</span> - <span>{end}</span>
    </div>

    <ScheduleInfo
      title={title}
      status={statusEventos}
      localExibicao={localExibicao}
      modalidadeInfo={modalidade || ''}
    />
  </div>
);
