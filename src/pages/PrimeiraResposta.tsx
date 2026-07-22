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

// --------- Tipos do novo shape ---------
type Dia = { primeiraResposta: boolean; data: string; porcentagem: number };
type ChildRow = { programa: string; dias: Dia[] };
type ProgramaGroup = {
  programa: string;
  children: ChildRow[];
  qtdColumns: number;
};

type ApiResponse = {
  manual: ProgramaGroup[];
  portage: ProgramaGroup[];
  vbmapp: Record<string, ProgramaGroup[]>; // nível -> array de groups
};

// --------- Estado inicial ----------
const fieldsConst = PrimeirasRespostasFields;

export default function PrimeiraResposta() {
  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>({});
  const [list, setList] = useState<ApiResponse | null>(null);

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
              <Column field="meta" header="Meta" style={{ width: '25%' }} />
              <Column
                field="subItem"
                header="Subitem"
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

  const renderVBMAPP = (vbmapp: Record<string, ProgramaGroup[]>) => {
    const levels = Object.keys(vbmapp || {});
    if (levels.length === 0) return <NotFound />;

    // Accordion de níveis; dentro de cada nível, usamos o mesmo renderer de sections
    return (
      <Accordion multiple>
        {levels.map((nivel, key) => (
          <AccordionTab
            tabIndex={key}
            key={`nivel-${nivel}`}
            header={
              <div className="flex items-center w-full">
                <span>{nivel}</span>
              </div>
            }
          >
            {renderSections(vbmapp[nivel] || [])}
          </AccordionTab>
        ))}
      </Accordion>
    );
  };

  // ------------------ Filtro ------------------
  const onSubmitFilter = async ({ pacienteId }: any) => {
    setLoading(true);
    try {
      const result: ApiResponse = await getList(
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

    const hasManual = !!list?.manual?.length;
    const hasPortage = !!list?.portage?.length;
    const hasVbmapp = !!list?.vbmapp && Object.keys(list.vbmapp).length > 0;

    if (!hasManual && !hasPortage && !hasVbmapp) {
      return (
        <Card>
          <NotFound />
        </Card>
      );
    }

    return (
      <Card>
        <Accordion multiple>
          {/* MANUAL */}
          {hasManual && (
            <AccordionTab
              tabIndex={0}
              header={
                <div className="flex items-center w-full">
                  <span>Manual</span>
                </div>
              }
              disabled={!hasManual}
            >
              {renderSections(list!.manual || [])}
            </AccordionTab>
          )}

          {/* PORTAGE */}
          {hasPortage && (
            <AccordionTab
              tabIndex={1}
              header={
                <div className="flex items-center w-full">
                  <span>Portage</span>
                </div>
              }
              disabled={!hasPortage}
            >
              {renderSections(list!.portage || [])}
            </AccordionTab>
          )}

          {/* VB-MAPP */}
          {hasVbmapp && (
            <AccordionTab
              tabIndex={2}
              header={
                <div className="flex items-center w-full">
                  <span>VB-MAPP</span>
                </div>
              }
              disabled={!hasVbmapp}
            >
              {renderVBMAPP(list!.vbmapp || {})}
            </AccordionTab>
          )}
        </Accordion>
      </Card>
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
