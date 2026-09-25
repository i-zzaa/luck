// Convenção de id de campo pro status/observação de uma meta do Manual
// (PEI) — usados no react-hook-form ao lado do id "de verdade" da meta
// (ex.: "3-meta-0"). "::" nunca aparece nos ids compostos que
// usePeiForm.ts monta ("-meta-"/"-sub-item-"), então dá pra reconhecer
// esses campos com segurança em Object.keys(formvalue) sem confundir com
// o parsing de meta/subitem em onSubmit.
export const metaStatusFieldId = (metaId: string) => `${metaId}::status`;
export const metaObsFieldId = (metaId: string) => `${metaId}::obs`;

export const isMetaStatusOrObsField = (key: string) =>
  key.endsWith('::status') || key.endsWith('::obs');

export const baseMetaIdFromField = (key: string) =>
  key.replace(/::(status|obs)$/, '');
