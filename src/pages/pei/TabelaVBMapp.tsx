import { NIVEL_COR } from '../../constants/pdfRelatorioEvolucao';
import { formatdate } from '../../util/util';

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
// esquerda) com uma célula por slot — nunca precisa de scroll
// horizontal e cada célula estica (flex-1) pra preencher a linha toda.
//
// dados: `tabelaComparativa` de POST /pei/filtro (item 19 do
// heron-list-nest/docs/pedido-frontend-fase2.md):
// { niveis: [{ nivel, sessoes: [{ data, programas: [{ nome, slots }] }] }] }
// O backend já entrega níveis decrescentes (só os com dado), sessões em
// ordem cronológica e `slots` com tamanho fixo (SLOT_COUNT_ATIVIDADE,
// `null` = slot vazio) e `preenchimento` resolvido — a tela não ordena,
// não corta em 10 e não converte percentual em cor por conta própria.
type Props = { dados: any };

// gray-300 (#D3D3D3) — não gray-100/gray-200 — por causa de
// tailwind.config.cjs: ele REDEFINE a paleta de cores inteira (não usa
// `extend`), com só um punhado de tons por cor. gray-100 não existe
// nesse config, então `border-gray-100`/`divide-gray-100` não geram
// CSS nenhum — a borda cai pro `currentColor` herdado (preto), bem
// mais escura do que a cor clara pretendida. gray-300 é o tom claro
// que REALMENTE existe (mesma cor da borda do Card/RichTextEditor no
// resto da tela) — usado tanto no contorno da tabela quanto em cada
// quadrado/slot, pra marcar o limite de cada item mesmo sem
// preenchimento (vazio ou slot null — os dois ficam brancos, só a
// borda demarca o quadrado).
const estiloSlot = (slot: any, corNivel: string) => {
  if (slot?.preenchimento === 'cheio') return { backgroundColor: corNivel };
  if (slot?.preenchimento === 'metade') {
    return {
      background: `linear-gradient(to bottom, #ffffff 50%, ${corNivel} 50%)`,
    };
  }
  return { backgroundColor: '#ffffff' };
};

export function TabelaVBMapp({ dados }: Props) {
  const niveis: any[] = dados?.niveis || [];

  if (!niveis.length) return null;

  return (
    <div className="mx-2 my-2 flex flex-col gap-5">
      {niveis.map(({ nivel, sessoes }: any) => {
        const corNivel = NIVEL_COR[nivel] || '#666666';

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

            {(sessoes || []).map((sessao: any) => (
              <div key={sessao.data} className="mb-3">
                <div className="font-inter text-[11px] text-gray-400 mb-1">
                  {formatdate(sessao.data)}
                </div>
                <div className="rounded-lg border border-gray-300 divide-y divide-gray-300">
                  {(sessao.programas || []).map((programa: any) => (
                    <div
                      key={programa.nome}
                      className="flex items-center gap-2 px-2 py-1.5"
                    >
                      <span
                        className="w-16 shrink-0 font-inter text-[10px] font-semibold text-gray-800 truncate"
                        title={programa.nome}
                      >
                        {programa.nome}
                      </span>
                      <div className="flex flex-1 gap-1">
                        {(programa.slots || []).map(
                          (slot: any, index: number) => (
                            <div
                              key={slot?.atividade ?? `vazio-${index}`}
                              className="flex-1 h-4 rounded border border-gray-300"
                              title={slot?.atividade}
                              style={estiloSlot(slot, corNivel)}
                            />
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
