import { useCallback, useEffect, useRef, useState } from 'react';
import { Accordion, AccordionTab, Column, DataTable, TabPanel, TabView } from 'primereact';
import CheckboxPortage from '../components/CheckboxPortage';
import { create, dropDown, filter } from '../server';
import { TIPO_PORTAGE, TIPO_PROTOCOLO, VALOR_PORTAGE, VBMAPP } from '../constants/protocolo';
import { ButtonHeron } from '../components';

import { useToast } from '../contexts/toast';
import gerarPdf from '../constants/pdfVBMAPP';

export default function VBMapp({ paciente }: { paciente: { id: number; nome: string } }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [list, setList] = useState<any>({});
  const [selectedItems, setSelectedItems] = useState<any[]>([]); // Controlar itens selecionados
  const { renderToast } = useToast();

  const [nivel, setNivel] = useState<number>(VBMAPP.um);
  const [existe, setExiste] = useState<boolean>(false);


  const exportPDF = async() => {
    const { data }: any = await filter('protocolo', {
      pacienteId: paciente.id,
      protocoloId: TIPO_PROTOCOLO.vbMapp,
      type: 'pdf'
    })

    if (data) {
      await handleGerarPdf(data)
    }else {
      setLoading(false);
      renderToast({
        type: 'failure',
        title: 'Erro!',
        message: 'Não existe Portage cadastrado no momento!',
        open: true,
      });
    }
  }

  const handleGerarPdf = async (data: any) => {
    gerarPdf(data)
  };

  const getVBMapp = async () => {
    const { data }: any = await filter('protocolo', {
      pacienteId: paciente.id,
      protocoloId: TIPO_PROTOCOLO.vbMapp,
      nivel
    })

    if (data) {
      setExiste(true)
      // setList(data.portage);
    }else {
      setExiste(false)
      renderList(nivel)
    }
  };

  const renderList = useCallback(async (nivel: number) => {
    try {
      const atividade = await dropDown(`protocolo/vbmapp/${nivel}`);
      setList(atividade);
    } catch (error) {
      console.error('Error fetching dropdown data', error);
    }
  }, []);

  const onSubmit = async () => {
    setLoading(true);

    const payload = {
      pacienteId: paciente.id,
      vbmapp: list
    }

    try {
      await create('protocolo/vbmapp', payload);
      setExiste(true)
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
  };

  const renderTab = () => {
    return (
      <TabView activeIndex={nivel}   onTabChange={(e) => {
        setNivel(e.index)
        renderList(e.index + 1)
      }}>
        <TabPanel header="Nível 1">
          { renderTable() }
        </TabPanel>
        <TabPanel header="Nível 2">
          { renderTable() }
        </TabPanel>
        <TabPanel header="Nível 3">
          { renderTable() }
        </TabPanel>
      </TabView>
    )
  }

  const renderedCheckboxes = (rowData: any, programa: string) => {
    const value = rowData.selected || null;

    return (
      <CheckboxPortage
        key={rowData.id}
        value={value}
        onChange={(newValue: any) => {
          rowData.selected = newValue
        }} // Atualiza o checkbox
      />
    );
  };

  const renderTable = () => (
    <div className="mt-8">
       <Accordion>
        {
          Object.keys(list).map((programa: any, keys: number) => (
            <AccordionTab className="mb-2" key={keys} 
            tabIndex={keys}
            header={
              <div className="flex items-center  w-full">
                <span>{ programa }</span>
              </div>
            }>
            <DataTable
                id="vbmapp-page"
                value={list[programa]}
                selection={selectedItems}

                responsiveLayout="scroll"
                dataKey="id"
                tableStyle={{ minWidth: 'none' }}
              >
                <Column
                  body={(row: any) => renderedCheckboxes(row, programa)} // Renderiza o checkbox personalizado
                  bodyStyle={{ padding: '.1rem' }}
                ></Column>
                <Column
                  field="nome"
                  header=""
                  bodyStyle={{ wordBreak: 'break-word', padding: '.1rem' }}
                ></Column>
              </DataTable>
            </AccordionTab>
          ))
        }
      </Accordion>
    </div>
  );

  const renderExport = () => (
    existe &&  <div className="mt-auto">
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
  );

  const renderFooter = () => (
    <div className="mt-auto">
      <ButtonHeron
        text="Salvar"
        type="primary"
        size="full"
        onClick={onSubmit}
        loading={loading}
      />
    </div>
  );

  useEffect(() => {
    getVBMapp ();
  }, [paciente]);

  return (
    <div className="mt-8 space-y-6">
      {renderExport()}
      {renderTab() }
      {renderFooter()}
    </div>
  );
}
