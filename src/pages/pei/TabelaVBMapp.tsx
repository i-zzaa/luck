import { NIVEL_COR } from '../../constants/pdfRelatorioEvolucao';

// Mesma grade colorida por nível do Relatório de Evolução em PDF (ver
// constants/pdfRelatorioEvolucao.ts/desenharVBMapp), agora também na
// tela — antes, selecionar VB-MAPP no filtro do PEI só mostrava a
// árvore de itens/checkboxes, sem o preenchimento visual por
// atividade que o PDF já tinha.
//
// No PDF os programas viram COLUNAS de uma grade (planilha), o que faz
// sentido numa folha A4 — na tela, com até 9 programas por nível (ver
// e2e/relatorio-evolucao.spec.ts), isso significa 9 colunas espremidas
// numa largura de ~340px ou um scroll horizontal escondendo metade do
// nível. Em vez disso, cada PROGRAMA vira uma LINHA própria (rótulo à
// esquerda) com as células dos itens dele em flex-wrap — cabe na tela
// de qualquer jeito, sem scroll horizontal, porque um programa com
// muitos itens simplesmente quebra pra uma segunda linha dentro da
// própria linha dele, em vez de estourar a largura da tela.
//
// dados: { [nivel]: { [data]: { [programa]: { [item]: { percentual } } } } }
type Props = { dados: any };

const corCelula = (percentual: number, corNivel: string) => {
  if (percentual === 100) return { backgroundColor: corNivel };
  if (percentual === 50) {
    return {
      background: `linear-gradient(to bottom, #ffffff 50%, ${corNivel} 50%)`,
    };
  }
  return { backgroundColor: '#ffffff' };
};

export function TabelaVBMapp({ dados }: Props) {
  const niveis = Object.keys(dados || {})
    .map(Number)
    .sort((a, b) => a - b);

  if (!niveis.length) return null;

  return (
    <div className="mx-2 my-2 flex flex-col gap-5">
      {niveis.map((nivel) => {
        const corNivel = NIVEL_COR[nivel] || '#666666';
        const datas = Object.keys(dados[nivel]);

        return (
          <div key={nivel}>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-1 h-4 rounded-full"
                style={{ backgroundColor: corNivel }}
              />
              <span
                className="font-inter font-semibold text-sm"
                style={{ color: corNivel }}
              >
                Nível {nivel}
              </span>
            </div>

            {datas.map((data) => {
              const programas = Object.keys(dados[nivel][data]);

              return (
                <div key={data} className="mb-3">
                  <div className="font-inter text-[11px] text-gray-400 mb-1">
                    {data}
                  </div>
                  <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
                    {programas.map((programa) => {
                      const atividades = Object.keys(
                        dados[nivel][data][programa]
                      );

                      return (
                        <div
                          key={programa}
                          className="flex items-center gap-2 px-2 py-1.5"
                        >
                          <span
                            className="w-16 shrink-0 font-inter text-[10px] font-semibold text-gray-700 truncate"
                            title={programa}
                          >
                            {programa}
                          </span>
                          <div className="flex flex-wrap gap-1 flex-1">
                            {atividades.map((atividade) => {
                              const { percentual } =
                                dados[nivel][data][programa][atividade];

                              return (
                                <div
                                  key={atividade}
                                  className="w-4 h-4 rounded-sm border border-gray-300 shrink-0"
                                  style={corCelula(percentual, corNivel)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
