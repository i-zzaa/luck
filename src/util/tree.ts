// Helpers puros de árvore usados pela tela de Metas (seleção de
// programa/meta/subitem em PEI, Portage e VB-Mapp). Extraído de
// pages/Metas.tsx: nenhuma dessas funções depende de estado do
// componente, só dos argumentos recebidos.

// Formato recorrente de nó de árvore vindo do backend (programa > meta >
// subitem, em PEI/Portage/VB-Mapp/Manutenção). O backend não tem um DTO
// formal pra isso — profundidade e presença de cada campo variam por tipo
// de protocolo (ver comentário de filterExcludedNode abaixo) — por isso o
// índice [key: string]: any: documenta os campos conhecidos sem fingir
// que a forma é mais rígida do que realmente é.
export interface TreeNode {
  key?: string | number;
  id?: string | number;
  label?: string;
  nome?: string;
  value?: string;
  children?: TreeNode[];
  subitems?: TreeNode[];
  estimuloDiscriminativo?: string;
  estimuloReforcadorPositivo?: string;
  resposta?: string;
  permiteSubitens?: boolean;
  [key: string]: any;
}

export type MaintenanceObject = {
  manual?: TreeNode[];
  vbmapp?: TreeNode[];
  portage?: TreeNode[];
};

export const extractCheckedKeys = (selection: any | undefined) => {
  if (!selection || typeof selection !== 'object') return [];
  return Object.entries(selection).reduce((acc: string[], [key, value]: any) => {
    const isChecked = value === true || (typeof value === 'object' && value?.checked);
    if (isChecked) acc.push(String(key));
    return acc;
  }, []);
};

// Remove recursivamente os nós cuja key está em excludedKeys, podando
// qualquer galho que fique sem filhos. Funciona pra árvore de qualquer
// profundidade (o Manual vem em 3 níveis - programa > meta > subitem -
// mas VB-Mapp e Portage vêm em 2 níveis - meta > subitem direto -,
// então não dá pra assumir uma profundidade fixa aqui).
export const filterExcludedNode = (node: TreeNode, excludedKeys: Set<string>): TreeNode | null => {
  const isLeaf = !Array.isArray(node?.children) || node.children.length === 0;

  if (isLeaf) {
    return excludedKeys.has(String(node?.key)) ? null : node;
  }

  const childrenFiltrados = (node.children as TreeNode[])
    .map((child: TreeNode) => filterExcludedNode(child, excludedKeys))
    .filter((n): n is TreeNode => n !== null);

  return childrenFiltrados.length
    ? { ...node, children: childrenFiltrados }
    : null;
};

export const buildFilteredTreeNodes = (baseNodes: TreeNode[] = [], excludedKeys: Set<string> = new Set()) => {
  return (baseNodes || [])
    .map((node: TreeNode) => filterExcludedNode(node, excludedKeys))
    .filter((n): n is TreeNode => n !== null);
};

export const hasNodes = (arr?: any[]) => Array.isArray(arr) && arr.length > 0;

// conta quantos nós estão marcados numa seleção de Tree (checkbox) —
// serve só pro contador visual da seção, não precisa distinguir
// folha/pai: cada chave marcada = 1 no contador.
export const countSelected = (selection: any) => extractCheckedKeys(selection).length;

export const normalizeMaintenanceObject = (raw: any): MaintenanceObject => {
  const safeArray = (v: any) => (Array.isArray(v) ? v : []);
  if (!raw || typeof raw !== 'object') return { manual: [], vbmapp: [], portage: [] };
  return {
    manual: safeArray(raw.manual),
    vbmapp: safeArray(raw.vbmapp),
    portage: safeArray(raw.portage),
  };
};
