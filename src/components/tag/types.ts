import { CodigoEspecialidade } from '../../util/especialidade';

export const BASE_CLASS =
  'text-sm items-center flex text-white py-2 px-2 rounded-full cursor-pointer disabled:opacity-100';

export const bgClassMap: Record<CodigoEspecialidade, string> = {
  TO: 'bg-to',
  FONO: 'bg-fono',
  PSICO: 'bg-psico',
  PSICOPEDAG: 'bg-black',
  MOTRICIDADE: 'bg-motricidade',
  MUSICOTERAPIA: 'bg-musicoterapia',
};

export interface TagProps {
  onClick?: () => void;
  // Aceita a sigla ou o nome completo da especialidade — a resolução
  // (com fallback por substring) fica em resolveEspecialidadeCodigo.
  // Antes só casava com a sigla exata, então um nome completo vindo da
  // API sempre caía no cinza padrão, silenciosamente.
  type: string;
  disabled: boolean;
}