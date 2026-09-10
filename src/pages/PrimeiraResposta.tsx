import { useCallback, useEffect, useState } from 'react';
import { dropDown, getList } from '../server';

import { Card } from '../components/card';
import { useToast } from '../contexts/toast';
import { Filter } from '../components';
import { PrimeirasRespostasFields } from '../constants/formFields';
import { NotFound } from '../components/notFound';
import { LoadingHeron } from '../components/loading';
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
// Conferido contra o payload de verdade de GET sessao/atividade/:pacienteId:
// é um array solto (ProgramaGroup[]), sem nenhum wrapper {manual, portage,
// vbmapp} por fora — essa suposição de estrutura (mantida até aqui) nunca
// bateu com o que o backend manda, então a tela sempre caía no "não há
// itens" independente do dado existir. "atividade" no nome do endpoint é
// a mesma convenção do resto do projeto pra Manual (ver ACTIVITY em
// useSessionForm.ts) — não tem evidência de Portage/VB-MAPP virem daqui.
type Dia = { primeiraResposta: boolean; data: string; porcentagem: string };
type ChildRow = { programa: string; dias: Dia[] };
type ProgramaGroup = {
  programa: string;
  children: ChildRow[];
  qtdColumns: number;
};

// --------- Estado inicial ----------
const fieldsConst = PrimeirasRespostasFields;

// Faixas de cor pra "% de acertos" — leitura rápida sem precisar ler o
// número: verde (domínio), amarelo (em progresso), vermelho (atenção).
const corPorcentagem = (porcentagem: string) => {
  const valor = parseFloat(porcentagem);
  if (Number.isNaN(valor)) return 'text-gray-400';
  if (valor >= 80) return 'text-green-500';
  if (valor >= 50) return 'text-yellow-500';
  return 'text-red-400';
};

// Só as 3 sessões mais recentes cabem na tela — mais que isso e a
// tabela fica ilegível de tanto scroll horizontal.
const MAX_DIAS = 3;

// Média das porcentagens dos dias exibidos (só os MAX_DIAS primeiros),
// de todas as tarefas de um grupo — mostrado no cabeçalho do Accordion
// pra dar o resumo do programa sem precisar abrir. Considera só os dias
// que aparecem na tabela, senão a média não bateria com o que a
// terapeuta está vendo.
const mediaGrupo = (children: ChildRow[]) => {
  const valores = children
    .flatMap((c) => c.dias.slice(0, MAX_DIAS))
    .map((d) => parseFloat(d.porcentagem))
    .filter((v) => !Number.isNaN(v));
  if (!valores.length) return null;
  const media = valores.reduce((acc, v) => acc + v, 0) / valores.length;
  return media.toFixed(0);
};

// A data de uma coluna de dia é a mesma pra todas as tarefas do grupo
// (é a data da sessão, não da tarefa) — usa a primeira que aparecer
// nesse índice como rótulo da coluna, com "Dia N" de fallback caso
// nenhuma tarefa tenha dado nesse índice.
const dataColuna = (children: ChildRow[], index: number) =>
  children.find((c) => c.dias?.[index]?.data)?.dias?.[index]?.data ||
  `Dia ${index + 1}`;

// Meta "atingida" quando as MAX_DIAS sessões mais recentes exibidas
// (mesma janela que a tabela mostra) tiveram 100% de acerto E a
// resposta já veio certa de primeira ("S"/primeiraResposta) nas 3 —
// precisa das 3 completas e consecutivas, não só a média alta. Sem
// isso, cai em "Em aquisição". Mesmo rótulo/cor que a tela de PEI usa
// pro status de uma meta (constants/protocolo.ts), pra ler igual nas
// duas telas.
const metaAtingida = (dias: Dia[]) => {
  const janela = (dias || []).slice(0, MAX_DIAS);
  if (janela.length < MAX_DIAS) return false;
  return janela.every(
    (dia) => dia.primeiraResposta && parseFloat(dia.porcentagem) === 100
  );
};

const renderStatusMeta = (dias: Dia[]) => {
  const atingida = metaAtingida(dias);
  const status = atingida ? STATUS_META.atingida : STATUS_META.aquisicao;

  return (
    <span
      className={clsx(
        'flex items-center gap-1 text-[10px] font-inter font-semibold',
        STATUS_META_COLOR_CLASS[status]
      )}
    >
      <i className={clsx('pi', atingida ? 'pi-check-circle' : 'pi-exclamation-triangle')} />
      {STATUS_META_LABEL[status]}
    </span>
  );
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

    return (
      <div className="flex items-center justify-center gap-1 py-1">
        <i
          className={clsx('pi text-xs', {
            'pi-check-circle text-green-400': dia.primeiraResposta,
            'pi-times-circle text-red-300': !dia.primeiraResposta,
          })}
          title={
            dia.primeiraResposta
              ? 'Acertou de primeira'
              : 'Não acertou de primeira'
          }
        />
        <span
          className={clsx(
            'font-inter text-xs font-semibold',
            corPorcentagem(dia.porcentagem)
          )}
        >
          {/* O backend manda "-" quando não há porcentagem apurada
              (sessão sem tentativa registrada nesse dia, etc.) — "%"
              grudado nesse "-" não faz sentido ("-%"), só quando o
              valor é numérico de verdade. */}
          {dia.porcentagem}
          {!Number.isNaN(parseFloat(dia.porcentagem)) && '%'}
        </span>
      </div>
    );
  };

  const renderSections = (sections: ProgramaGroup[]) => {
    if (!sections || sections.length === 0) return <NotFound />;

    return (
      <Accordion multiple>
        {sections.map((sec, idx) => {
          const media = mediaGrupo(sec.children);

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
                        corPorcentagem(media)
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
                scrollable
                stripedRows
                className="text-sm"
              >
                {/* Nome da tarefa (ChildRow.programa — único campo de
                    identificação que o tipo declara, e que a API
                    sessao/atividade/:pacienteId realmente manda; rotulado
                    "Tarefa" pra não repetir o nome do cabeçalho do
                    Accordion, que já representa o programa) + status
                    calculado a partir dos próprios dias exibidos. */}
                <Column
                  header="Tarefa"
                  style={{ width: '35%' }}
                  className="font-inter"
                  body={(row: ChildRow) => (
                    <div className="flex flex-col gap-1">
                      <span>{row.programa}</span>
                      {renderStatusMeta(row.dias)}
                    </div>
                  )}
                />
                {Array.from({
                  length: Math.min(sec.qtdColumns, MAX_DIAS),
                }).map((_, index) => (
                  <Column
                    key={`col-${index}`}
                    header={dataColuna(sec.children, index)}
                    headerClassName="font-inter whitespace-nowrap"
                    body={(row: ChildRow) => renderBodyTemplate(row, index)}
                  />
                ))}
              </DataTable>
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
        `sessao/atividade/${pacienteId.id}`
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
