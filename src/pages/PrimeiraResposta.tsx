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

export default function PrimeiraResposta() {
  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>({});
  const [list, setList] = useState<ProgramaGroup[] | null>(null);

  const { renderToast } = useToast();

  // ------------------ Helpers de UI ------------------
  const renderBodyTemplate = (row: ChildRow, index: number) => {
    const dia = row?.dias?.[index];
    if (!dia) return '-';

    return (
      <div className="grid grid-rows-3 justify-center">
        <div className="flex justify-center">{dia.data}</div>

        <div className="flex gap-2 justify-center">
          <div
            className={clsx(
              'flex justify-center items-center font-inter font-light rounded-full w-4 h-4',
              { 'bg-green-400 text-white': dia.primeiraResposta }
            )}
            title="Sim"
          >
            S
          </div>
          <div
            className={clsx(
              'flex justify-center items-center font-inter font-light rounded-full w-4 h-4',
              { 'bg-red-400 text-white': !dia.primeiraResposta }
            )}
            title="Não"
          >
            N
          </div>
        </div>

        <div className="flex justify-center">{dia.porcentagem}%</div>
      </div>
    );
  };

  const renderSections = (sections: ProgramaGroup[]) => {
    if (!sections || sections.length === 0) return <NotFound />;

    return (
      <Accordion multiple>
        {sections.map((sec, idx) => (
          <AccordionTab
            key={`sec-${idx}-${sec.programa}`}
            tabIndex={idx}
            header={
              <div className="flex items-center w-full">
                <span>{sec.programa}</span>
              </div>
            }
          >
            <DataTable value={sec.children} scrollable>
              {/* field="programa" — bate com ChildRow.programa (o único
                  campo de identificação que o tipo declara, e que a API
                  sessao/atividade/:pacienteId realmente manda). Um commit
                  recente trocou isso pra field="meta"/"subItem", campos
                  que não existem no objeto — as colunas ficavam sempre
                  em branco (os dias continuavam aparecendo, já que usam
                  `body` lendo row.dias[index], não `field`). */}
              <Column
                field="programa"
                header="Programa"
                style={{ width: '25%' }}
              />
              {Array.from({ length: sec.qtdColumns }).map((_, index) => (
                <Column
                  key={`col-${index}`}
                  header={`Dia ${index + 1}`}
                  body={(row: ChildRow) => renderBodyTemplate(row, index)}
                />
              ))}
            </DataTable>
          </AccordionTab>
        ))}
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

    return <Card>{renderSections(list)}</Card>;
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
