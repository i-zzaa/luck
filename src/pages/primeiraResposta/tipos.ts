import moment from 'moment';
import { STATUS_META } from '../../constants/protocolo';

// --------- Tipos do shape real ---------
// GET sessao/atividade/:pacienteId?ultimasSessoes=N (item 23 do
// pedido-frontend-fase2): array solto de programas, já resumido pelo
// backend — status por tarefa, média/classificação do programa, datas de
// coluna e evolução. Com o query param presente o backend troca pro shape
// novo; sem ele devolve o antigo (cru), por isso o param é obrigatório aqui.
// Datas sempre ISO (YYYY-MM-DD); porcentagem numérica ou null (sem "-").
export type Classificacao = 'alto' | 'medio' | 'baixo' | 'na';
export type Dia = {
  data: string;
  primeiraResposta: '+' | '-';
  porcentagem: number | null;
};
// Um ITEM de uma meta (o backend chama o rótulo do item de `programa`,
// herança do shape antigo). `meta`: rótulo da meta dona do item — null no
// Portage (sem esse nível) e em respostas de antes do campo existir.
export type ChildRow = {
  programa: string;
  meta?: string | null;
  status: STATUS_META.atingida | STATUS_META.aquisicao;
  dias: Dia[];
};
export type ProgramaGroup = {
  programa: string;
  mediaAcerto: number | null;
  classificacao: Classificacao;
  colunas: { data: string | null }[];
  evolucao: { data: string | null; mediaAcerto: number | null }[];
  children: ChildRow[];
};

// Faixa de acerto do programa — vem pronta do backend (classificacao); o
// front só traduz pra rótulo + cor, sem recalcular o corte 80/50. Rótulo
// em texto junto da cor: a faixa não pode depender só do verde/vermelho.
// Hex direto (arbitrary value): a paleta customizada do tailwind.config
// só tem um tom por cor — text-green-500/text-yellow-500, usados antes
// aqui, nem existiam e saíam sem cor.
export const FAIXA: Record<Exclude<Classificacao, 'na'>, { label: string; className: string }> = {
  alto: { label: 'Alto', className: 'bg-[#dcfce7] text-[#15803d]' },
  medio: { label: 'Médio', className: 'bg-[#fef3c7] text-[#92400e]' },
  baixo: { label: 'Baixo', className: 'bg-[#fee2e2] text-[#b91c1c]' },
};

export const tarefaAtingida = (row: ChildRow) =>
  row.status === STATUS_META.atingida ||
  (row.status as string) === STATUS_META.manutencao;

// Exibe só DD/MM — com o ano as colunas não cabem na largura do celular.
// Sem data (nenhuma tarefa com dado naquele índice), cai no "Dia N".
export const formatarDataColuna = (data: string | null, index: number) => {
  if (!data) return `Dia ${index + 1}`;
  const m = moment(data, 'YYYY-MM-DD', true);
  return m.isValid() ? m.format('DD/MM') : data;
};

export const formatarMedia = (valor: number | null) =>
  valor === null ? null : Math.round(valor);

// "10/09 a 24/09": primeira e última data de coluna entre todos os
// programas (cada programa tem as próprias sessões).
export const periodo = (lista: ProgramaGroup[]) => {
  const datas = lista
    .flatMap((sec) => sec.colunas || [])
    .map((c) => c.data)
    .filter((d): d is string => !!d && moment(d, 'YYYY-MM-DD', true).isValid())
    .sort();
  if (!datas.length) return null;
  const inicio = moment(datas[0]).format('DD/MM');
  const fim = moment(datas[datas.length - 1]).format('DD/MM');
  return inicio === fim ? inicio : `${inicio} a ${fim}`;
};

export type GrupoMeta = { meta: string | null; itens: ChildRow[] };

// Itens do programa agrupados pela meta, na ordem em que aparecem.
export const agruparPorMeta = (children: ChildRow[] = []): GrupoMeta[] => {
  const grupos: GrupoMeta[] = [];
  children.forEach((item) => {
    const meta = item.meta ?? null;
    const grupo = grupos.find((g) => g.meta === meta);
    if (grupo) grupo.itens.push(item);
    else grupos.push({ meta, itens: [item] });
  });
  return grupos;
};
