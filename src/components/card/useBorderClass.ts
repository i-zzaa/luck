import { resolveEspecialidadeCodigo } from '../../util/especialidade';

const BASE =
  'rounded-lg cursor-pointer hover:scale-[101%] duration-700 ease-in-out border-solid border-l-4';

// border-solid é necessário aqui: o Card renderiza um <fieldset>, e
// fieldset tem um border-style padrão do navegador ("groove", o
// baixo-relevo entalhado) que o preflight do Tailwind não reseta. Sem
// isso, border-l-4 (largura) + border-to (cor) só definem parte do
// border — o style "groove" continua valendo e transforma a borda
// colorida num baixo-relevo cinza quase imperceptível.
const COLORS: Record<string, string> = {
  TO: `${BASE} border-to`,
  FONO: `${BASE} border-fono`,
  PSICOPEDAG: `${BASE} border-psicopedag`,
  PSICO: `${BASE} border-psico`,
  MOTRICIDADE: `${BASE} border-motricidade`,
  MUSICOTERAPIA: `${BASE} border-musicoterapia`,
};

const DEFAULT = 'rounded-lg';
const FREE = 'border-solid border-l-4 border-l-green-400 rounded-lg cursor-not-allowed';

export function useBorderColorClass(type: string = 'DEFAULT'): string {
  const normalized = type.trim().toUpperCase();

  if (normalized === 'FREE') return FREE;
  if (normalized === 'DEFAULT' || !normalized) return DEFAULT;

  const codigo = resolveEspecialidadeCodigo(type);
  return codigo ? COLORS[codigo] : DEFAULT;
}
