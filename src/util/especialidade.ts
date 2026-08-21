// Resolve o nome/código de uma especialidade pro código canônico curto
// (TO/FONO/PSICO/PSICOPEDAG/MOTRICIDADE/MUSICOTERAPIA), que é o que os
// mapas de cor (borda de card, tag) usam como chave.
//
// Existiam DUAS implementações praticamente idênticas dessa mesma lógica
// (useBorderColorClass e o Tag), e uma TERCEIRA (Tag/bgClassMap) que nem
// tinha o fallback por substring — só casava com a sigla exata, então
// qualquer especialidade vinda como nome completo ("Terapia Ocupacional")
// nunca batia e a tag sempre caía no cinza padrão, silenciosamente.
// Consolidado aqui num único lugar.
//
// FALLBACK TEMPORÁRIO: prefere um `codigo` estável vindo do backend (ver
// docs/pedido-backend-formatacao.md); só cai no matching por substring do
// nome livre quando `codigo` não vier.
export type CodigoEspecialidade =
  | 'TO'
  | 'FONO'
  | 'PSICO'
  | 'PSICOPEDAG'
  | 'MOTRICIDADE'
  | 'MUSICOTERAPIA';

const CODIGOS_VALIDOS: CodigoEspecialidade[] = [
  'TO',
  'FONO',
  'PSICO',
  'PSICOPEDAG',
  'MOTRICIDADE',
  'MUSICOTERAPIA',
];

// Ordem importa, do mais específico pro mais genérico: "psicopedagogia" E
// "psicomotricidade" também contêm "psico" como substring, então
// PSICOPEDAG e MOTRICIDADE precisam ser checados antes de PSICO, senão os
// dois caem incorretamente em PSICO. "TO" sozinho (2 letras) daria falso
// positivo em qualquer palavra que contivesse "to" — por isso o fallback
// usa "OCUPACIONAL" (de "Terapia Ocupacional") em vez da sigla.
const MATCH_ORDER: Array<[string, CodigoEspecialidade]> = [
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

export type EspecialidadeInput =
  | string
  | { codigo?: string; nome?: string }
  | undefined
  | null;

export const resolveEspecialidadeCodigo = (
  especialidade: EspecialidadeInput
): CodigoEspecialidade | null => {
  const bruto =
    typeof especialidade === 'string'
      ? especialidade
      : especialidade?.codigo || especialidade?.nome || '';

  const normalized = normalize(bruto);
  if (!normalized) return null;

  if (CODIGOS_VALIDOS.includes(normalized as CodigoEspecialidade)) {
    return normalized as CodigoEspecialidade;
  }

  const match = MATCH_ORDER.find(([substring]) => normalized.includes(substring));
  return match ? match[1] : null;
};
