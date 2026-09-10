import { NIVEL_COR } from '../../constants/pdfRelatorioEvolucao';

// Mesma grade colorida por nível do Relatório de Evolução em PDF (ver
// constants/pdfRelatorioEvolucao.ts/desenharVBMapp), agora também na
// tela — antes, selecionar VB-MAPP no filtro do PEI só mostrava a
// árvore de itens/checkboxes, sem o preenchimento visual por
// atividade que o PDF já tinha.
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
              const maxItens = programas.reduce(
                (max, programa) =>
                  Math.max(
                    max,
                    Object.keys(dados[nivel][data][programa]).length
                  ),
                0
              );

              return (
                <div key={data} className="mb-3">
                  <div className="font-inter text-[11px] text-gray-400 mb-1">
                    {data}
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="border-collapse">
                      <thead>
                        <tr>
                          {programas.map((programa) => (
                            <th
                              key={programa}
                              className="bg-gray-100 border border-gray-200 px-1 py-1 font-inter text-[9px] font-semibold text-gray-800 whitespace-nowrap"
                            >
                              {programa}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: maxItens }).map(
                          (_, indexItem) => (
                            <tr key={indexItem}>
                              {programas.map((programa) => {
                                const atividades = Object.keys(
                                  dados[nivel][data][programa]
                                );
                                const atividade = atividades[indexItem];
                                const percentual = atividade
                                  ? dados[nivel][data][programa][atividade]
                                      .percentual
                                  : 0;

                                return (
                                  <td
                                    key={programa}
                                    className="border border-gray-200 p-0"
                                  >
                                    <div
                                      className="w-5 h-5"
                                      style={corCelula(percentual, corNivel)}
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
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
