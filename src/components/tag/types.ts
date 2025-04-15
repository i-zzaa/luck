export const BASE_CLASS =
  'text-sm items-center flex text-white py-2 px-2 rounded-full cursor-pointer disabled:opacity-100';

export const bgClassMap: Record<string, string> = {
  TO: 'bg-to',
  FONO: 'bg-fono',
  PSICO: 'bg-psico',
  PSICOPEDAG: 'bg-black',
  MOTRICIDADE: 'bg-motricidade',
  MUSICOTERAPIA: 'bg-musicoterapia',
};

export interface TagProps {
  onClick?: () => void;
  type: 'to' | 'fono' | 'psico' | 'PsicoPEDAG' | 'motricidade' | 'musicoterapia';
  disabled: boolean;
}