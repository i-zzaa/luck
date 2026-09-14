// Helpers puros de árvore usados pela tela de Metas (contadores das
// seções). Montagem e poda das árvores (inclusive dos itens em
// manutenção) passaram pro backend — GET pei/activity-session/:id/metas —
// então aqui sobra só o que é reatividade do formulário.

export const extractCheckedKeys = (selection: any | undefined) => {
  if (!selection || typeof selection !== 'object') return [];
  return Object.entries(selection).reduce((acc: string[], [key, value]: any) => {
    const isChecked = value === true || (typeof value === 'object' && value?.checked);
    if (isChecked) acc.push(String(key));
    return acc;
  }, []);
};

export const hasNodes = (arr?: any[]) => Array.isArray(arr) && arr.length > 0;

// selectedKeys vem do backend no formato do Tree com checkbox do
// PrimeReact ({ [key]: { checked, partialChecked } }) — nó só parcial
// (partialChecked sem checked) não conta.
//
// conta quantos nós estão marcados numa seleção de Tree (checkbox) —
// serve só pro contador visual da seção, não precisa distinguir
// folha/pai: cada chave marcada = 1 no contador.
export const countSelected = (selection: any) => extractCheckedKeys(selection).length;
