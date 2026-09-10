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
// esquerda) com exatamente SLOTS_POR_LINHA células — nunca precisa de
// scroll horizontal (a linha inteira sempre cabe, célula nenhuma
// "estoura" a largura da tela) e cada célula estica (flex-1) pra
// preencher a linha toda, em vez de ficar num tamanho fixo pequeno com
// sobra de espaço vazio do lado.
//
// dados: { [nivel]: { [data]: { [programa]: { [item]: { percentual } } } } }
type Props = { dados: any };

// Mesmo número de slots por atividade que o resto do sistema já usa
// (SLOT_COUNT_ATIVIDADE em heron-list-nest/src/pei/pei.service.ts) —
// preenche até 10 quadrados por linha mesmo quando o programa tem
// menos itens respondidos, pra toda linha ficar com a mesma largura e
// os quadrados alinharem em coluna entre um programa e outro, em vez
// de cada linha "flutuar" numa largura diferente conforme a
// quantidade de itens dela.
const SLOTS_POR_LINHA = 10;

// gray-300 (#D3D3D3) — não gray-100/gray-200 — por causa de
// tailwind.config.cjs: ele REDEFINE a paleta de cores inteira (não usa
// `extend`), com só um punhado de tons por cor. gray-100 não existe
// nesse config, então `border-gray-100`/`divide-gray-100` não geram
// CSS nenhum — a borda cai pro `currentColor` herdado (preto), bem
// mais escura do que a cor clara pretendida. gray-300 é o tom claro
// que REALMENTE existe (mesma cor da borda do Card/RichTextEditor no
// resto da tela).
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
                  <div className="rounded-lg border border-gray-300 divide-y divide-gray-300">
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
                            className="w-16 shrink-0 font-inter text-[10px] font-semibold text-gray-800 truncate"
                            title={programa}
                          >
                            {programa}
                          </span>
                          <div className="flex flex-1 gap-1">
                            {Array.from({ length: SLOTS_POR_LINHA }).map(
                              (_, index) => {
                                const atividade = atividades[index];
                                const percentual = atividade
                                  ? dados[nivel][data][programa][atividade]
                                      .percentual
                                  : null;

                                return (
                                  <div
                                    key={atividade ?? `vazio-${index}`}
                                    className="flex-1 h-4 rounded-sm"
                                    style={
                                      percentual === null
                                        ? { backgroundColor: '#f3f4f6' } // gray-100 — sem borda, só o preenchimento já marca o slot vazio
                                        : corCelula(percentual, corNivel)
                                    }
                                  />
                                );
                              }
                            )}
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
