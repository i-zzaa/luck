// Helpers puros usados pela tela de Sessão (useSessionForm.ts) — sem
// nenhuma dependência de UI/rota/contexto, pra dar pra testar isolado sem
// montar o hook inteiro (que arrasta react-router-dom, contexto de toast,
// chamadas de API, e por tabela o grafo de import de todas as rotas).
//
// As árvores de slots (atividade/manutenção/portage/vb-mapp) chegam do
// backend já no formato final (item 7 da fase 1) — o transform/padding
// que existia aqui (padSlots) e em useSessionForm saiu.

export const isObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
export const isPrimitiveOrNull = (v: any) => v === null || !isObj(v);

// `html` é o conteúdo vindo do RichTextEditor (Tiptap) — um editor
// "vazio" não é string vazia, é algo como "<p></p>". Precisa tirar as
// tags e os espaços/&nbsp; pra contar só o texto de verdade. Só UX: o
// mínimo de verdade é validado no servidor (item 4 da fase 2), e o
// número vem de GET /sessao/config.
export const resumoTextLength = (html: string): number =>
  (html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim().length;

export const isResumoVazio = (html: string) => resumoTextLength(html) === 0;

// Protocolos aceitos por PUT /sessao/calendario/:id (item 2 da fase 2).
// 'manutencao' vale pras 3 sub-árvores de manutenção — o servidor procura
// a chave nas três.
export type ProtocoloResposta = 'manual' | 'portage' | 'vbmapp' | 'manutencao';

export interface RespostaSessao {
  nodeKey: string;
  protocolo: ProtocoloResposta;
  slots: any[];
}

// Achata uma árvore de sessão nas respostas que o servidor espera: uma
// entrada por nó-folha (children = array de slots primitivos/null). A
// topologia (programa/meta/subitem) o servidor já tem no planejamento —
// basta dizer ONDE (nodeKey) e O QUÊ (slots). Folha sem nada marcado vai
// junto (slots só null) de propósito: assim a árvore gravada fica com
// todos os slots, igual à que a tela exibe no modo leitura.
export const extractRespostas = (
  nodes: any[],
  protocolo: ProtocoloResposta
): RespostaSessao[] => {
  const respostas: RespostaSessao[] = [];

  const visit = (node: any) => {
    const children = node?.children;
    if (!Array.isArray(children) || children.length === 0) return;

    if (children.every(isPrimitiveOrNull)) {
      if (node?.key !== undefined && node?.key !== null) {
        respostas.push({ nodeKey: String(node.key), protocolo, slots: children });
      }
      return;
    }

    children.forEach(visit);
  };

  (nodes || []).forEach(visit);
  return respostas;
};

// Preserva as respostas já marcadas na tela quando as árvores são
// recarregadas do servidor — é o que acontece ao voltar do "Adicionar
// metas" (useSessionForm/refreshMetas): o planejamento recém-salvo volta
// com todos os slots vazios e, sem isso, o que a terapeuta já treinou
// some da tela (e nem chega a ser enviado no salvar).
//
// Casa folha com folha pela `key`; a topologia (metas novas incluídas) e
// a quantidade de slots são sempre as da árvore nova — do que já estava
// preenchido só entram os slots com valor.
export const mesclarRespostas = (novas: any[], atuais: any[]): any[] => {
  const preenchidosPorChave = new Map<string, any[]>();

  const coletar = (node: any) => {
    const children = node?.children;
    if (!Array.isArray(children) || children.length === 0) return;

    if (children.every(isPrimitiveOrNull)) {
      if (node?.key !== undefined && node?.key !== null) {
        preenchidosPorChave.set(String(node.key), children);
      }
      return;
    }

    children.forEach(coletar);
  };

  (atuais || []).forEach(coletar);
  if (!preenchidosPorChave.size) return novas || [];

  const aplicar = (node: any): any => {
    const children = node?.children;
    if (!Array.isArray(children) || children.length === 0) return node;

    if (children.every(isPrimitiveOrNull)) {
      const salvos =
        node?.key !== undefined && node?.key !== null
          ? preenchidosPorChave.get(String(node.key))
          : undefined;

      if (!salvos) return node;

      const slots = children.map((slot: any, i: number) =>
        salvos[i] === undefined || salvos[i] === null ? slot : salvos[i]
      );

      return { ...node, children: slots };
    }

    return { ...node, children: children.map(aplicar) };
  };

  return (novas || []).map(aplicar);
};
