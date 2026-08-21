// Helpers puros usados por useSessionForm.ts pra montar a árvore de
// slots (atividade/manutenção/portage/vb-mapp) e validar o resumo da
// sessão. Extraído pra um módulo próprio, sem nenhuma dependência de
// UI/rota/contexto — useSessionForm.ts importa daqui, e assim dá pra
// testar essa lógica isolada sem montar o hook inteiro (que arrasta
// react-router-dom, contexto de toast, chamadas de API, e por tabela o
// grafo de import de todas as rotas do app).

export const isObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
export const isPrimitiveOrNull = (v: any) => v === null || !isObj(v);

// `content` é HTML vindo do RichTextEditor (Tiptap) — um editor "vazio"
// não é string vazia, é algo como "<p></p>". Precisa tirar as tags e os
// espaços/&nbsp; pra saber se o resumo tem texto de verdade.
export const isResumoVazio = (html: string) =>
  (html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim().length === 0;

export const padSlots = (arr: any[], count: number) => {
  const base = Array.isArray(arr) ? arr.slice(0, count) : [];
  if (base.length < count) {
    base.push(...Array.from({ length: count - base.length }, () => null));
  }
  return base;
};
