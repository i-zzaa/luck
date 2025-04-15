import { FC } from 'react';

interface ScheduleInfoProps {
  title: string;
  status: string;
  localidade: string;
  isExterno: boolean;
  km?: number;
  modalidadeInfo: string;
}

export const ScheduleInfo: FC<ScheduleInfoProps> = ({
  title,
  status,
  localidade,
  isExterno,
  km,
  modalidadeInfo,
}) => (
  <div className="text-gray-800 text-sm text-center grid justify-center">
    <div className="font-base font-semibold text-primary">{title}</div>

    <p className="flex gap-4 items-center justify-between">
      <span>{modalidadeInfo}</span>
      <span>{status}</span>
    </p>

    <p className="flex gap-4 items-center">
      {localidade}
      {isExterno && (
        <span className="font-bold font-inter">{`- ${km}km`}</span>
      )}
    </p>
  </div>
);
