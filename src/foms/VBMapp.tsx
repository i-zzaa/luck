import { useCallback, useEffect, useState } from 'react';
import { Accordion, AccordionTab, Column, DataTable, TabPanel, TabView } from 'primereact';
import CheckboxPortage from '../components/CheckboxPortage';
import { create, dropDown, filter } from '../server';
import { TIPO_PROTOCOLO, VBMAPP } from '../constants/protocolo';
import { ButtonHeron } from '../components';

import { useToast } from '../contexts/toast';
import gerarPdf from '../constants/pdfVBMAPP';
import { NotFound } from '../components/notFound';

export default function VBMapp({ paciente }: any) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState({} as any);
  const [selectedItems, setSelectedItems] = useState([]);
  const { renderToast } = useToast();

  const [nivel, setNivel] = useState(VBMAPP.um);
  const [nivelIndex, setNivelIndex] = useState(VBMAPP.um - 1);
  const [existe, setExiste] = useState(false);

  const exportPDF = useCallback(async () => {
    try {
      const { data } = await filter('protocolo', {
        pacienteId: paciente.id,
        protocoloId: TIPO_PROTOCOLO.vbMapp,
        type: 'pdf',
      });

      if (data) {
        await gerarPdf(data);
      } else {
        setLoading(false);
        renderToast({
          type: 'failure',
          title: 'Erro!',
          message: 'Não existe Portage cadastrado no momento!',
          open: true,
        });
      }
    } catch (error) {
      console.error('Erro ao gerar PDF', error);
    }
  }, [paciente.id, renderToast]);

  const getVBMapp = useCallback(
    async (nivelCurrent = nivel) => {
      const { data } = await filter('protocolo', {
        pacienteId: paciente.id,
        protocoloId: TIPO_PROTOCOLO.vbMapp,
        nivel: nivelCurrent,
      });
      setList(data.data);
      setExiste(data.existeResposta);
    },
    [nivel, paciente.id]
  );

  const onSubmit = useCallback(async () => {
    setLoading(true);
    const payload = { pacienteId: paciente.id, vbmapp: list };

    try {
      await create('protocolo/vbmapp', payload);
      setExiste(true);
      renderToast({
        type: 'success',
        title: 'Sucesso!',
        message: 'VB Mapp Cadastrado.',
        open: true,
      });
    } catch (error) {
      console.error('Error saving form data', error);
      renderToast({
        type: 'failure',
        title: 'Erro!',
        message: 'Falha na conexão',
        open: true,
      });
    } finally {
      setLoading(false);
    }
  }, [list, paciente.id, renderToast]);

  const updateNivel = useCallback(
    (e: any) => {
      setNivel(e.index + 1);
      setNivelIndex(e.index);
      getVBMapp(e.index + 1);
    },
    [getVBMapp]
  );

  const renderedCheckboxes = useCallback((rowData: any, programa: any) => {
    const value = rowData.selected || null;
    return (
      <CheckboxPortage
        key={rowData.id}
        value={value}
        onChange={(newValue: any) => {
          rowData.selected = newValue;
        }}
      />
    );
  }, []);

  const renderTable = useCallback(() => (
    <div className="mt-8">
      {Object.keys(list).length > 0 ? (
        <Accordion>
          {Object.keys(list).map((programa, keys) => (
            <AccordionTab className="mb-2" key={keys} tabIndex={keys} header={<div className="flex items-center w-full"><span>{programa.toLocaleUpperCase()}</span></div>}>
              <DataTable
                id="vbmapp-page"
                value={list[programa]}
                selection={selectedItems}
                responsiveLayout="scroll"
                dataKey="id"
                tableStyle={{ minWidth: 'none' }}
              >
                <Column body={(row) => renderedCheckboxes(row, programa)} bodyStyle={{ padding: '.1rem' }} />
                <Column field="nome" header="" bodyStyle={{ wordBreak: 'break-word', padding: '.1rem' }} />
              </DataTable>
            </AccordionTab>
          ))}
        </Accordion>
      ) : (
        <NotFound />
      )}
    </div>
  ), [list, renderedCheckboxes]);

  const renderExport = useCallback(() => (
    existe && (
      <div className="mt-auto">
        <ButtonHeron
          text="Gerar Relatório"
          type="primary"
          size="full"
          icon="pi pi-file-pdf"
          onClick={exportPDF}
          loading={loading}
          typeButton="button"
        />
      </div>
    )
  ), [existe, exportPDF, loading]);

  const renderFooter = useCallback(() => (
    <div className="mt-auto">
      <ButtonHeron text="Salvar" type="primary" size="full" onClick={onSubmit} loading={loading} />
    </div>
  ), [onSubmit, loading]);

  useEffect(() => {
    getVBMapp();
  }, [paciente, getVBMapp]);

  return (
    <div className="mt-8 space-y-6">
      {renderExport()}
      <TabView activeIndex={nivelIndex} onTabChange={updateNivel}>
        <TabPanel header="Nível 1">{renderTable()}</TabPanel>
        <TabPanel header="Nível 2">{renderTable()}</TabPanel>
        <TabPanel header="Nível 3">{renderTable()}</TabPanel>
      </TabView>
      {renderFooter()}
    </div>
  );
}
