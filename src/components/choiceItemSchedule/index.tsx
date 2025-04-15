import { diffWeek } from '../../util/util';
import { FC } from 'react';

interface ChoiceItemScheduleProps {
  start: string;
  end: string;
  title: string;
  statusEventos: string;
  localidade: string;
  isExterno: boolean;
  km?: number;
  modalidade: string;
  dataInicio?: string;
  dataFim?: string;
  dataAtual?: string;
}

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
  const renderModalidadeInfo = () => {
    const isAvaliacao = modalidade === 'Avaliação';
    const hasDatasValidas = dataInicio && dataFim && dataAtual;

    if (!isAvaliacao || !hasDatasValidas) {
      return <span>{modalidade}</span>;
    }

    const semanaAtual = diffWeek(dataInicio, dataAtual);
    const totalSemanas = diffWeek(dataInicio, dataFim);

    return (
      <span>
        {modalidade}
        <span className="font-inter ml-2">{`${semanaAtual}/${totalSemanas}`}</span>
      </span>
    );
  };

  return (
    <div className="flex gap-2 w-full items-center">
      <div className="grid text-center font-inter text-sm text-gray-400">
        <span>{start}</span> - <span>{end}</span>
      </div>

      <div className="text-gray-800 text-sm text-center grid justify-center">
        <div className="font-base font-semibold text-primary">{title}</div>

        <p className="flex gap-4 items-center justify-between">
          {renderModalidadeInfo()}
          <span>{statusEventos}</span>
        </p>

        <p className="flex gap-4 items-center">
          {localidade}
          {isExterno && (
            <span className="font-bold font-inter">{`- ${km}km`}</span>
          )}
        </p>
      </div>
    </div>
  );
};
