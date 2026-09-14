import { useCallback, useEffect, useState } from 'react';
import { dropDown, getList } from '../server';

import { Card } from '../components/card';
import { useToast } from '../contexts/toast';
import { Filter } from '../components';
import { PrimeirasRespostasFields } from '../constants/formFields';
import { NotFound } from '../components/notFound';
import { LoadingHeron } from '../components/loading';
import { GraficoLinha, PontoGrafico } from '../components/graficoLinha';
import moment from 'moment';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import clsx from 'clsx';
import { Accordion, AccordionTab } from 'primereact/accordion';
import {
  STATUS_META,
  STATUS_META_COLOR_CLASS,
  STATUS_META_LABEL,
} from '../constants/protocolo';

// --------- Tipos do shape real ---------
// GET sessao/atividade/:pacienteId?ultimasSessoes=N (item 23 do
// pedido-frontend-fase2): array solto de programas, já resumido pelo
// backend — status por tarefa, média/classificação do programa, datas de
// coluna e evolução. Com o query param presente o backend troca pro shape
// novo; sem ele devolve o antigo (cru), por isso o param é obrigatório aqui.
// Datas sempre ISO (YYYY-MM-DD); porcentagem numérica ou null (sem "-").
type Classificacao = 'alto' | 'medio' | 'baixo' | 'na';
type Dia = {
  data: string;
  primeiraResposta: '+' | '-';
  porcentagem: number | null;
};
type ChildRow = {
  programa: string;
  status: STATUS_META.atingida | STATUS_META.aquisicao;
  dias: Dia[];
};
type ProgramaGroup = {
  programa: string;
  mediaAcerto: number | null;
  classificacao: Classificacao;
  colunas: { data: string | null }[];
  evolucao: { data: string | null; mediaAcerto: number | null }[];
  children: ChildRow[];
};

// --------- Estado inicial ----------
const fieldsConst = PrimeirasRespostasFields;

// Quantas sessões mais recentes a tela mostra — é o backend que aplica a
// janela (e usa o mesmo N pro status "atingida"); aqui só escolhe o N.
// Mais que 3 e a tabela não cabe na largura do celular.
const ULTIMAS_SESSOES = 3;

// Cor por faixa de acerto — a faixa (classificacao) vem pronta do
// backend; aqui só traduz pra classe Tailwind. Leitura rápida sem
// precisar ler o número: verde (domínio), amarelo (em progresso),
// vermelho (atenção), cinza (sem dado).
const COR_CLASSIFICACAO: Record<Classificacao, string> = {
  alto: 'text-green-500',
  medio: 'text-yellow-500',
  baixo: 'text-red-400',
  na: 'text-gray-400',
};

// Mesma escala da classificação do programa, aplicada à % de uma célula
// só. O backend não manda classificação por dia, e o pedido é que o front
// não recalcule corte 80/50 — então a célula fica neutra e só o cabeçalho
// do programa ganha cor.
const COR_PORCENTAGEM_DIA = 'text-gray-700';

// Exibe só DD/MM — com o ano as 3 colunas não cabem na largura do celular
// sem rolagem horizontal. Sem data (nenhuma tarefa com dado naquele
// índice), cai no "Dia N".
const formatarDataColuna = (data: string | null, index: number) => {
  if (!data) return `Dia ${index + 1}`;
  const m = moment(data, 'YYYY-MM-DD', true);
  return m.isValid() ? m.format('DD/MM') : data;
};

const formatarMedia = (valor: number | null) =>
  valor === null ? null : Math.round(valor);

const renderStatusMeta = (status: ChildRow['status']) => {
  // Só o ícone ao lado do nome da tarefa — o texto ("Em aquisição")
  // numa coluna estreita quebrava linha e disputava a leitura com o nome.
  // O significado de cada ícone fica na legenda (renderLegenda) e no
  // title (tooltip/leitor de tela). Mesmo rótulo/cor que a tela de PEI
  // usa pro status de uma meta (constants/protocolo.ts).
  return (
    <i
      className={clsx(
        'pi shrink-0 text-sm',
        ICONE_STATUS_META[status],
        STATUS_META_COLOR_CLASS[status]
      )}
      title={STATUS_META_LABEL[status]}
      aria-label={STATUS_META_LABEL[status]}
    />
  );
};

const ICONE_STATUS_META: Record<string, string> = {
  [STATUS_META.atingida]: 'pi-check-circle',
  [STATUS_META.aquisicao]: 'pi-exclamation-triangle',
};

export default function PrimeiraResposta() {
  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>({});
  const [list, setList] = useState<ProgramaGroup[] | null>(null);

  const { renderToast } = useToast();

  // ------------------ Helpers de UI ------------------
  const renderBodyTemplate = (row: ChildRow, index: number) => {
    const dia = row?.dias?.[index];
    if (!dia) return <span className="text-gray-300">—</span>;

    const acertouDePrimeira = dia.primeiraResposta === '+';

    return (
      <div className="flex flex-wrap items-center justify-center gap-x-1 py-1">
        <i
          className={clsx('pi text-xs', {
            'pi-check-circle text-green-400': acertouDePrimeira,
            'pi-times-circle text-red-300': !acertouDePrimeira,
          })}
          title={
            acertouDePrimeira ? 'Acertou de primeira' : 'Não acertou de primeira'
          }
        />
        <span
          className={clsx(
            'font-inter text-xs font-semibold',
            dia.porcentagem === null ? 'text-gray-400' : COR_PORCENTAGEM_DIA
          )}
        >
          {/* null = sessão sem porcentagem apurada naquele dia. */}
          {dia.porcentagem === null ? '—' : `${dia.porcentagem}%`}
        </span>
      </div>
    );
  };

  // Um gráfico só por programa: a evolução (média de acerto por coluna de
  // sessão) vem pronta do backend, já na janela de ULTIMAS_SESSOES e em
  // ordem cronológica — aqui só formata a data pra exibição. Com menos de
  // 2 pontos com valor não exibe: um ponto solto não mostra evolução.
  const renderGrafico = (sec: ProgramaGroup) => {
    const pontos: PontoGrafico[] = (sec.evolucao || []).map((p, i) => ({
      data: formatarDataColuna(p.data, i),
      valor: formatarMedia(p.mediaAcerto),
    }));
    if (pontos.filter((p) => p.valor !== null).length < 2) return null;

    return (
      <div className="flex flex-col gap-2 mt-8 min-w-0 w-full">
        <span className="font-inter text-xs font-semibold text-gray-800">
          Evolução do programa (média de acerto por data)
        </span>
        <GraficoLinha pontos={pontos} altura={200} />
      </div>
    );
  };

  const renderSections = (sections: ProgramaGroup[]) => {
    if (!sections || sections.length === 0) return <NotFound />;

    return (
      <Accordion multiple>
        {sections.map((sec, idx) => {
          const media = formatarMedia(sec.mediaAcerto);

          return (
            <AccordionTab
              key={`sec-${idx}-${sec.programa}`}
              tabIndex={idx}
              header={
                <div className="flex items-center justify-between w-full pr-2">
                  <span className="font-inter font-semibold">
                    {sec.programa}
                  </span>
                  {media !== null && (
                    <span
                      className={clsx(
                        'font-inter text-xs font-semibold',
                        COR_CLASSIFICACAO[sec.classificacao] ??
                          COR_CLASSIFICACAO.na
                      )}
                    >
                      {media}% de acerto
                    </span>
                  )}
                </div>
              }
            >
              <DataTable
                value={sec.children}
                stripedRows
                className="text-sm"
                // Sem `scrollable` e com layout fixo em 100%: a tabela
                // cabe na largura da tela (sem rolagem horizontal), e as
                // colunas dividem o espaço em vez de crescer pelo conteúdo.
                tableStyle={{ tableLayout: 'fixed', width: '100%' }}
              >
                {/* Nome da tarefa (ChildRow.programa — único campo de
                    identificação que o tipo declara, e que a API
                    sessao/atividade/:pacienteId realmente manda; rotulado
                    "Tarefa" pra não repetir o nome do cabeçalho do
                    Accordion, que já representa o programa) + status
                    que o backend já manda pronto. */}
                <Column
                  header="Tarefa"
                  style={{ width: '40%' }}
                  headerClassName="font-inter !px-2"
                  bodyClassName="font-inter !px-2 break-words"
                  body={(row: ChildRow) => (
                    <div className="flex items-start gap-1.5 py-1">
                      <span className="mt-0.5 flex">
                        {renderStatusMeta(row.status)}
                      </span>
                      <span className="text-sm font-medium leading-snug text-gray-800">
                        {row.programa}
                      </span>
                    </div>
                  )}
                />
                {(sec.colunas || []).map((coluna, index) => (
                  <Column
                    key={`col-${index}`}
                    header={formatarDataColuna(coluna.data, index)}
                    headerClassName="font-inter !px-1 text-center"
                    bodyClassName="!px-1"
                    body={(row: ChildRow) => renderBodyTemplate(row, index)}
                  />
                ))}
              </DataTable>
              {renderGrafico(sec)}
            </AccordionTab>
          );
        })}
      </Accordion>
    );
  };

  // ------------------ Filtro ------------------
  const onSubmitFilter = async ({ pacienteId }: any) => {
    setLoading(true);
    try {
      const result: ProgramaGroup[] = await getList(
        `sessao/atividade/${pacienteId.id}?ultimasSessoes=${ULTIMAS_SESSOES}`
      );
      setList(result);
    } catch (error) {
      setList(null);
      renderToast({
        type: 'failure',
        title: '401',
        message: 'PEI não encontrado!',
        open: true,
      });
    }
    setLoading(false);
  };

  const renderFilter = () => (
    <Filter
      id="form-filter-pei"
      legend="Filtro"
      nameButton="Cadastrar"
      fields={fieldsConst}
      dropdown={dropDownList}
      onSubmit={onSubmitFilter}
      onReset={() => setList(null)}
      screen="PEI"
      loading={loading}
    />
  );

  // ------------------ Legenda ------------------
  // Dois indicadores diferentes convivem na mesma célula (ícone = acertou
  // de primeira; número = % de acertos na sessão inteira) — sem isso fica
  // fácil confundir um com o outro.
  const renderLegenda = () => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 py-2 font-inter text-[11px] text-gray-400">
      <span className="flex items-center gap-1 whitespace-nowrap">
        <i className="pi pi-check-circle text-green-400 text-xs" />
        Acertou de primeira
      </span>
      <span className="flex items-center gap-1 whitespace-nowrap">
        <i className="pi pi-times-circle text-red-300 text-xs" />
        Não acertou de primeira
      </span>
      <span className="whitespace-nowrap">% = acertos na sessão</span>
      {/* Status da tarefa: na tabela aparece só o ícone, ao lado do nome. */}
      {[STATUS_META.atingida, STATUS_META.aquisicao].map((status) => (
        <span key={status} className="flex items-center gap-1 whitespace-nowrap">
          <i
            className={clsx(
              'pi text-xs',
              ICONE_STATUS_META[status],
              STATUS_META_COLOR_CLASS[status]
            )}
          />
          {STATUS_META_LABEL[status]}
        </span>
      ))}
    </div>
  );

  // ------------------ Conteúdo ------------------
  const renderContent = () => {
    if (loading) return <LoadingHeron />;

    if (!list?.length) {
      return (
        <Card>
          <NotFound />
        </Card>
      );
    }

    return (
      <>
        {renderLegenda()}
        <Card>{renderSections(list)}</Card>
      </>
    );
  };

  // ------------------ Dropdowns ------------------
  const renderPrograma = useCallback(async () => {
    const [paciente]: any = await Promise.all([dropDown('paciente')]);
    setDropDownList({ paciente });
  }, []);

  useEffect(() => {
    renderPrograma();
  }, [renderPrograma]);

  return (
    <div>
      {renderFilter()}
      {renderContent()}
    </div>
  );
}
