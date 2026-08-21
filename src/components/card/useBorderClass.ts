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

// Ordem importa, do mais específico pro mais genérico: "psicopedagogia" E
// "psicomotricidade" também contêm "psico" como substring, então
// PSICOPEDAG e MOTRICIDADE precisam ser checados antes de PSICO, senão
// os dois caem incorretamente em PSICO. "TO" sozinho (2 letras) daria
// falso positivo em qualquer palavra que contivesse "to" — por isso o
// fallback usa "OCUPACIONAL" (de "Terapia Ocupacional") em vez da sigla.
const MATCH_ORDER: Array<[string, keyof typeof COLORS]> = [
  ['PSICOPEDAG', 'PSICOPEDAG'],
  ['MOTRICIDADE', 'MOTRICIDADE'],
  ['PSICO', 'PSICO'],
  ['FONO', 'FONO'],
  ['MUSICOTERAPIA', 'MUSICOTERAPIA'],
  ['OCUPACIONAL', 'TO'],
];

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove os acentos (marcas de combinacao, pos normalize('NFD'))
    .toUpperCase()
    .trim();

export function useBorderColorClass(type: string = 'DEFAULT'): string {
  const normalized = normalize(type);

  if (normalized === 'FREE') return FREE;
  if (normalized === 'DEFAULT' || !normalized) return DEFAULT;

  // Match exato primeiro (cobre os códigos curtos: "TO", "FONO", "PSICO"...).
  if (COLORS[normalized]) return COLORS[normalized];

  // Fallback por substring: cobre o nome completo da especialidade vindo
  // da API (ex.: "Fonoaudiologia", "Psicologia", "Terapia Ocupacional"),
  // que nunca bateria com uma chave exata do mapa acima. Sem isso, toda
  // especialidade cujo `.nome` não seja literalmente a sigla cai no
  // DEFAULT e o card nunca ganha a borda colorida.
  const match = MATCH_ORDER.find(([substring]) => normalized.includes(substring));
  return match ? COLORS[match[1]] : DEFAULT;
}
