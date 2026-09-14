import { formatdate } from '../../util/util';

// Mesma tabela comparativa do Relatório de Evolução em PDF (ver
// constants/pdfRelatorioEvolucao.ts/desenharPortage), agora também na
// tela — antes, selecionar Portage no filtro do PEI só mostrava a
// árvore de itens/checkboxes, sem nenhum jeito de comparar a evolução
// entre sessões sem abrir o PDF.
//
// data: `tabelaComparativa` de POST /pei/filtro (item 17 do
// heron-list-nest/docs/pedido-frontend-fase2.md) — o backend já escolhe
// primeira x atual, calcula o percentual numérico e classifica
// (alto/medio/baixo/na). Aqui só exibe: nada de parse de "80%", regex
// de data no rótulo ou corte 80/50 duplicado no front.
//
// tailwind.config.cjs REDEFINE a paleta de cores inteira (não usa
// `extend`), com só um punhado de tons por cor — "500"/"600"/"700"/
// "100" de qualquer cor NÃO existem aqui, então uma classe como
// `text-green-500` não gera CSS nenhum: o navegador cai no
// `currentColor` (preto/herdado) em vez de verde. green-400/yellow-400/
// red-400/gray-400 são os únicos tons "claro" que existem de verdade
// nesse config — por isso o "500" vira "400" abaixo.
const CLASSE_POR_CLASSIFICACAO: Record<string, string> = {
  alto: 'text-green-400',
  medio: 'text-yellow-400',
  baixo: 'text-red-400',
  na: 'text-gray-400 italic font-normal',
};

// `valor` ausente (categoria sem aquela faixa na árvore) é exibido igual
// a "não se aplica" — mesma leitura de percentual null.
const textoValor = (valor?: any) =>
  valor?.percentual === null || valor?.percentual === undefined
    ? 'Não se aplica'
    : `${valor.percentual}%`;

const classeValor = (valor?: any) =>
  CLASSE_POR_CLASSIFICACAO[valor?.classificacao || 'na'];

type Props = { data: any };

export function TabelaPortage({ data }: Props) {
  const avaliacoes: any[] = data?.avaliacoes || [];

  if (!avaliacoes.length) return null;

  return (
    <div className="mx-2 my-2 flex flex-col gap-4">
      {avaliacoes.map((avaliacao: any) => {
        const faixasEtarias: string[] = avaliacao.faixasEtarias || [];
        const categorias: any[] = avaliacao.categorias || [];
        // `data` vem em ISO separada do título — só formata pra exibir.
        const titulo = avaliacao.data
          ? `${avaliacao.titulo}: ${formatdate(avaliacao.data)}`
          : avaliacao.titulo;

        // Uma avaliação preenche, na grande maioria dos casos, só UMA
        // faixa etária (a que faz sentido pra idade da criança naquele
        // momento) — nesse caso a tabela degenera pra 2 linhas numa
        // única coluna de dado, com um cabeçalho ("Áreas" | "0 a 1")
        // meio artificial pra só 2 números. Em vez disso, lista
        // compacta: categoria à esquerda, percentual colorido à
        // direita — mesma solução do PDF (desenharAvaliacaoCompacta).
        const compacta = faixasEtarias.length <= 1;

        return (
          <div key={avaliacao.tipo ?? avaliacao.titulo}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-4 bg-violet-800 rounded-full" />
              <span className="font-inter font-semibold text-sm text-violet-800">
                {titulo}
              </span>
            </div>

            {compacta ? (
              <div className="rounded-lg border border-gray-200 divide-y divide-gray-200">
                {categorias.map((categoria: any) => {
                  const valor = categoria.valores?.[0];
                  return (
                    <div
                      key={categoria.codigo ?? categoria.nome}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <span className="font-inter text-sm text-gray-800">
                        {categoria.nome}
                      </span>
                      <span
                        className={`font-inter text-sm font-semibold ${classeValor(
                          valor
                        )}`}
                      >
                        {textoValor(valor)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm font-inter">
                  <thead>
                    <tr className="bg-gray-200">
                      {['Áreas', ...faixasEtarias].map((coluna) => (
                        <th
                          key={coluna}
                          className="px-3 py-2 text-left font-semibold text-gray-800 whitespace-nowrap"
                        >
                          {coluna}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {categorias.map((categoria: any) => (
                      <tr key={categoria.codigo ?? categoria.nome}>
                        <td className="px-3 py-2 text-gray-800 whitespace-nowrap">
                          {categoria.nome}
                        </td>
                        {faixasEtarias.map((faixa) => {
                          const valor = (categoria.valores || []).find(
                            (v: any) => v.faixa === faixa
                          );
                          return (
                            <td
                              key={faixa}
                              className={`px-3 py-2 font-semibold whitespace-nowrap ${classeValor(
                                valor
                              )}`}
                            >
                              {textoValor(valor)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
