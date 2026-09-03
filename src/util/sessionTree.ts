// Helpers puros usados por useSessionForm.ts pra montar a árvore de
// slots (atividade/manutenção/portage/vb-mapp) e validar o resumo da
// sessão. Extraído pra um módulo próprio, sem nenhuma dependência de
// UI/rota/contexto — useSessionForm.ts importa daqui, e assim dá pra
// testar essa lógica isolada sem montar o hook inteiro (que arrasta
// react-router-dom, contexto de toast, chamadas de API, e por tabela o
// grafo de import de todas as rotas do app).

export const isObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
export const isPrimitiveOrNull = (v: any) => v === null || !isObj(v);

// `html` é o conteúdo vindo do RichTextEditor (Tiptap) — um editor
// "vazio" não é string vazia, é algo como "<p></p>". Precisa tirar as
// tags e os espaços/&nbsp; pra contar só o texto de verdade.
export const resumoTextLength = (html: string): number =>
  (html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim().length;

export const isResumoVazio = (html: string) => resumoTextLength(html) === 0;

// Resumo da sessão precisa de pelo menos esse tanto de caractere de
// texto de verdade (sem contar tags HTML) — regra de negócio do
// prontuário, não é limite técnico de nenhum campo.
export const MIN_RESUMO_LENGTH = 200;

export const padSlots = (arr: any[], count: number) => {
  const base = Array.isArray(arr) ? arr.slice(0, count) : [];
  if (base.length < count) {
    base.push(...Array.from({ length: count - base.length }, () => null));
  }
  return base;
};

// Chave de seleção no formato que o Tree do PrimeReact espera
// (selectionKeys), usado pelo bottom sheet de metas.
export type SelectionKeys = Record<string, { checked: boolean; partialChecked: boolean }>;

// Deriva quais metas "já foram treinadas" numa árvore de sessão (a
// mesma árvore com slots que useSessionForm monta pra
// SessionActivity/SessionPortage/SessionVBMapp — não é a árvore de
// seleção por checkbox da tela de Metas, é outro formato). Usado como
// fallback pro bottom sheet de "Adicionar metas": pra sessão já
// registrada, pei/activity-session/:id (o "planejamento prévio") pode
// não ter mais nada salvo — mas a própria sessão registrada ainda tem
// os slots preenchidos, e é isso que essa função lê.
//
// Um nó-folha (children = array de slots primitivos/null) conta como
// "treinado" se tiver pelo menos um slot preenchido (não-null). Um nó
// interno conta como treinado se algum filho contar — com
// partialChecked quando só PARTE dos filhos contam, igual ao tri-state
// nativo do Tree.
export const extractTrainedSelectionKeys = (nodes: any[]): SelectionKeys => {
  const result: SelectionKeys = {};

  const visit = (node: any): boolean => {
    const children = node?.children;
    if (!Array.isArray(children) || children.length === 0) return false;

    if (children.every(isPrimitiveOrNull)) {
      const trained = children.some((v) => v !== null && v !== undefined);
      if (trained && node?.key !== undefined) {
        result[String(node.key)] = { checked: true, partialChecked: false };
      }
      return trained;
    }

    const childrenTrained = children.map((child: any) => visit(child));
    const anyTrained = childrenTrained.some(Boolean);
    const allTrained = childrenTrained.length > 0 && childrenTrained.every(Boolean);
    if (anyTrained && node?.key !== undefined) {
      result[String(node.key)] = { checked: allTrained, partialChecked: !allTrained };
    }
    return anyTrained;
  };

  (nodes || []).forEach((node) => visit(node));
  return result;
};
