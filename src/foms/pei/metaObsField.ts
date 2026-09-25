// Convenção de id de campo pro texto livre de uma meta do Manual (PEI)
// — a observação (a conclusão saiu do formulário) — usado no
// react-hook-form ao lado do id "de verdade" da meta (ex.: "3-meta-0"). "::" nunca aparece nos ids
// compostos que usePeiForm.ts monta ("-meta-"/"-sub-item-"), então dá pra
// reconhecer esses campos com segurança em Object.keys(formvalue) sem
// confundir com o parsing de meta/subitem em onSubmit.
//
// O status da meta não tem campo no formulário: não se cadastra, só
// aparece na tela do PEI e nos relatórios (ver foms/pei/index.tsx).

// sufixo do id no form -> propriedade da meta no payload/backend
export const META_TEXTO_CAMPOS = {
  obs: 'observacao',
} as const;

type MetaTextoSufixo = keyof typeof META_TEXTO_CAMPOS;

const META_TEXTO_REGEX = new RegExp(
  `::(${Object.keys(META_TEXTO_CAMPOS).join('|')})$`
);

export const metaTextoFieldId = (metaId: string, sufixo: MetaTextoSufixo) =>
  `${metaId}::${sufixo}`;

export const metaObsFieldId = (metaId: string) => metaTextoFieldId(metaId, 'obs');

export const isMetaTextoField = (key: string) => META_TEXTO_REGEX.test(key);

// Propriedade da meta que o campo preenche (ex.: "observacao").
export const metaPropFromField = (key: string) =>
  META_TEXTO_CAMPOS[key.match(META_TEXTO_REGEX)![1] as MetaTextoSufixo];

export const baseMetaIdFromField = (key: string) =>
  key.replace(META_TEXTO_REGEX, '');
