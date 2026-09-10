// Transforma o payload cru de GET protocolo/filtro (type: 'pdf') —
// {headers, Socializacao, Cognicao} — na estrutura "por avaliação"
// (Primeira Aplicação x Aplicação Atual) usada tanto pelo Relatório de
// Evolução em PDF (constants/pdfRelatorioEvolucao.ts) quanto pela nova
// tabela comparativa exibida direto na tela do PEI (pages/pei/
// TabelaPortage.tsx) — extraído pra cá pra não duplicar a mesma regra
// de negócio (quais avaliações pegar, como nomear, quais faixas têm
// dado) em dois lugares que precisam ler exatamente igual.

export type AvaliacaoPortage = {
  titulo: string;
  colunas: string[];
  linhas: string[][];
};

export const extrairDataDoRotulo = (rotulo: string) =>
  rotulo.match(/\d{2}\/\d{2}\/\d{4}/)?.[0] || '';

// Mesma faixa de cor que a tela já usa pra "% de acertos" (ver
// corPorcentagem em PrimeiraResposta.tsx): verde (domínio), amarelo (em
// progresso), vermelho (atenção), cinza quando não é um percentual de
// verdade ("Não se aplica").
export type ClassificacaoPercentual = 'alto' | 'medio' | 'baixo' | 'na';

export const classificarPercentual = (
  valor: string
): ClassificacaoPercentual => {
  const numero = parseFloat(valor);
  if (Number.isNaN(numero)) return 'na';
  if (numero >= 80) return 'alto';
  if (numero >= 50) return 'medio';
  return 'baixo';
};

export const transformarPortagePorAvaliacao = (
  data: any
): AvaliacaoPortage[] => {
  const headers: string[] = data?.headers || [];
  const linhasPorCategoria: Record<string, any[]> = {
    Socialização: data?.Socializacao || [],
    Cognição: data?.Cognicao || [],
  };

  // headers[0] é o canto vazio da tabela original; headers[1] é sempre
  // a avaliação mais recente e headers[headers.length - 1] a mais
  // antiga (o backend busca orderBy id desc). Só pega essas duas
  // pontas — com só 1 avaliação cadastrada, os dois índices coincidem
  // e o loop abaixo monta uma vez só.
  const totalAvaliacoes = headers.length - 1;
  const indicesEscolhidos =
    totalAvaliacoes <= 0
      ? []
      : Array.from(new Set([headers.length - 1, 1])).sort((a, b) => b - a);

  const avaliacoes: AvaliacaoPortage[] = [];

  indicesEscolhidos.forEach((indiceAvaliacao, posicao) => {
    // Faixas etárias com dado de verdade nessa avaliação (em qualquer
    // categoria), na mesma ordem em que o backend já as manda.
    const faixasComDado = new Set<string>();
    Object.values(linhasPorCategoria).forEach((linhas) => {
      linhas.forEach((linha) => {
        const percentual = linha[indiceAvaliacao];
        if (percentual && percentual !== 'Não se aplica') {
          faixasComDado.add(linha[0]);
        }
      });
    });
    if (!faixasComDado.size) return; // avaliação sem nada preenchido — não monta tabela vazia

    const faixasOrdenadas = (
      linhasPorCategoria.Socialização.length
        ? linhasPorCategoria.Socialização
        : linhasPorCategoria.Cognição
    )
      .map((linha) => linha[0])
      .filter((faixaEtaria) => faixasComDado.has(faixaEtaria));

    const linhas = Object.entries(linhasPorCategoria)
      .filter(([, linhasCategoria]) => linhasCategoria.length)
      .map(([categoria, linhasCategoria]) => [
        categoria,
        ...faixasOrdenadas.map((faixaEtaria) => {
          const linha = linhasCategoria.find((l) => l[0] === faixaEtaria);
          return linha ? linha[indiceAvaliacao] : '';
        }),
      ]);

    const dataAvaliacao = extrairDataDoRotulo(headers[indiceAvaliacao]);
    // Com as duas pontas escolhidas, nomeia como a referência
    // ("Primeira Aplicação"/"Aplicação Atual"); com só uma (paciente
    // com uma única avaliação cadastrada), mantém o rótulo original do
    // backend — não faz sentido chamar de "primeira" e "atual" a mesma
    // coisa.
    const titulo =
      indicesEscolhidos.length === 2
        ? `${posicao === 0 ? 'Primeira Aplicação' : 'Aplicação Atual'}${dataAvaliacao ? `: ${dataAvaliacao}` : ''}`
        : headers[indiceAvaliacao];

    avaliacoes.push({
      titulo,
      colunas: ['Áreas', ...faixasOrdenadas],
      linhas,
    });
  });

  return avaliacoes;
};
