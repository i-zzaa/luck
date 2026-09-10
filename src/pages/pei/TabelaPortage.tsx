import {
  classificarPercentual,
  transformarPortagePorAvaliacao,
} from '../../util/portageEvolucao';

// Mesma tabela comparativa do Relatório de Evolução em PDF (ver
// constants/pdfRelatorioEvolucao.ts/desenharPortage), agora também na
// tela — antes, selecionar Portage no filtro do PEI só mostrava a
// árvore de itens/checkboxes, sem nenhum jeito de comparar a evolução
// entre sessões sem abrir o PDF.
const CLASSE_POR_CLASSIFICACAO: Record<string, string> = {
  alto: 'text-green-500',
  medio: 'text-yellow-500',
  baixo: 'text-red-400',
  na: 'text-gray-400',
};

const corClasse = (valor: string) =>
  CLASSE_POR_CLASSIFICACAO[classificarPercentual(valor)];

type Props = { data: any };

export function TabelaPortage({ data }: Props) {
  const avaliacoes = transformarPortagePorAvaliacao(data);

  if (!avaliacoes.length) return null;

  return (
    <div className="mx-2 my-2 flex flex-col gap-4">
      {avaliacoes.map((avaliacao, index) => {
        // Uma avaliação preenche, na grande maioria dos casos, só UMA
        // faixa etária (a que faz sentido pra idade da criança naquele
        // momento) — nesse caso a tabela degenera pra 2 linhas numa
        // única coluna de dado, com um cabeçalho ("Áreas" | "0 a 1")
        // meio artificial pra só 2 números. Em vez disso, lista
        // compacta: categoria à esquerda, percentual colorido à
        // direita — mesma solução do PDF (desenharAvaliacaoCompacta).
        const compacta = avaliacao.colunas.length <= 2;

        return (
          <div key={`${avaliacao.titulo}-${index}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-4 bg-violet-800 rounded-full" />
              <span className="font-inter font-semibold text-sm text-violet-800">
                {avaliacao.titulo}
              </span>
            </div>

            {compacta ? (
              <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
                {avaliacao.linhas.map(([categoria, valor]) => (
                  <div
                    key={categoria}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <span className="font-inter text-sm text-gray-800">
                      {categoria}
                    </span>
                    <span
                      className={`font-inter text-sm font-semibold ${
                        valor === 'Não se aplica'
                          ? 'text-gray-400 italic font-normal'
                          : corClasse(valor)
                      }`}
                    >
                      {valor}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm font-inter">
                  <thead>
                    <tr className="bg-gray-100">
                      {avaliacao.colunas.map((coluna) => (
                        <th
                          key={coluna}
                          className="px-3 py-2 text-left font-semibold text-gray-800 whitespace-nowrap"
                        >
                          {coluna}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {avaliacao.linhas.map((linha) => (
                      <tr key={linha[0]}>
                        {linha.map((valor, colIndex) => (
                          <td
                            key={colIndex}
                            className={
                              colIndex === 0
                                ? 'px-3 py-2 text-gray-800 whitespace-nowrap'
                                : `px-3 py-2 font-semibold whitespace-nowrap ${
                                    valor === 'Não se aplica'
                                      ? 'text-gray-400 italic font-normal'
                                      : corClasse(valor)
                                  }`
                            }
                          >
                            {valor}
                          </td>
                        ))}
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
