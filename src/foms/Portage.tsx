import { useCallback, useEffect, useRef, useState } from 'react';
import { Accordion, AccordionTab, Column, DataTable } from 'primereact';
import CheckboxPortage from '../components/CheckboxPortage';
import { create, dropDown, filter } from '../server';
import { TIPO_PORTAGE, TIPO_PROTOCOLO, VALOR_PORTAGE } from '../constants/protocolo';
import { ButtonHeron } from '../components';

import { useToast } from '../contexts/toast';
import gerarPdf from '../constants/pdfPortage';

export default function PortageCadastro({ paciente }: { paciente: { id: number; nome: string } }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [list, setList] = useState<any>({});
  const [selectedItems, setSelectedItems] = useState<any[]>([]); // Controlar itens selecionados
  const { renderToast } = useToast();

  const [existePortage, setExistePortage] = useState<boolean>(false);

  const exportPDF = async() => {
    const { data }: any = await filter('protocolo', {
      pacienteId: paciente.id,
      protocoloId: TIPO_PROTOCOLO.portage,
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

  const getPortage = async () => {
    const { data }: any = await filter('protocolo', {
      pacienteId: paciente.id,
      protocoloId: TIPO_PROTOCOLO.portage,
      type: 'local'
    })

    if (data) {
      setExistePortage(true)
      setList(data.portage);
    }else {
      setExistePortage(false)
      renderList()
    }

  };

  const renderList = useCallback(async () => {
    try {
      const atividade = await dropDown('protocolo/portage');
      setList(atividade);
    } catch (error) {
      console.error('Error fetching dropdown data', error);
    }
  }, []);

  const onCheckboxChange = (portageType: string, faixaEtaria: string, itemId: any, value = undefined) => {
    const updatedSelection = { ...list };

    if (updatedSelection[portageType] && updatedSelection[portageType][faixaEtaria]) {
      const activities = updatedSelection[portageType][faixaEtaria];
      const index = activities.findIndex((activity: any) => activity.id === itemId);

      if (index !== -1) {
        if (value !== undefined) {
          // Atualiza com o valor do checkbox diretamente
          activities[index].selected = value;
        } else {
          // Simula o clique na linha, seguindo a lógica dos 3 estados
          let currentValue = activities[index].selected || null;
          let newValue;

          if (currentValue === VALOR_PORTAGE.sim) {
            newValue = VALOR_PORTAGE.asVezes;
          } else if (currentValue === VALOR_PORTAGE.asVezes) {
            newValue = VALOR_PORTAGE.nao;
          } else if (currentValue === VALOR_PORTAGE.nao) {
            newValue = null;
          } else {
            newValue = VALOR_PORTAGE.sim;
          }

          activities[index].selected = newValue;
        }

        setList(updatedSelection);
        // setSelectedItems((prevSelected) => {
        //   // Adiciona ou remove o item selecionado na lista de selecionados
        //   if (value === null) {
        //     return prevSelected.filter(item => item.id !== itemId);
        //   } else {
        //     const alreadySelected = prevSelected.find(item => item.id === itemId);
        //     if (!alreadySelected) {
        //       return [...prevSelected, activities[index]];
        //     }
        //     return prevSelected.map(item => (item.id === itemId ? activities[index] : item));
        //   }
        // });
      }
    }
  };

  const onSubmit = async () => {
    setLoading(true);

    const payload = {
      pacienteId: paciente,
      portage: list
    }

    try {
      await create('protocolo/portage', payload);
      setExistePortage(true)
      renderToast({
        type: 'success',
        title: 'Sucesso!',
        message: 'Portage Cadastrado.',
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

  const renderedCheckboxesPostage = (portageType: string, faixaEtaria: string, rowData: any) => {
    const value = rowData.selected || null;

    return (
      <CheckboxPortage
        key={rowData.id}
        value={value}
        onChange={(newValue: any) => onCheckboxChange(portageType, faixaEtaria, rowData.id, newValue)} // Atualiza o checkbox
      />
    );
  };

  const renderTable = (type: string) => (
    <div className="mt-8">
      {list?.[type] && (
        <div className="">
          <span className="col-span-12 text-gray-400 font-inter leading-4 mb-2">{type}</span>
          <Accordion>
          {Object.keys(list[type]).map((faixaEtaria: any) => (
            <AccordionTab className="mb-2" key={faixaEtaria} 
            tabIndex={faixaEtaria}
            header={
              <div className="flex items-center  w-full">
                <span>{ faixaEtaria}</span>
              </div>
            }>
              <DataTable
                id="portage-page"
                value={list[type][faixaEtaria]}
                selection={selectedItems}

                responsiveLayout="scroll"
                dataKey="id"
                tableStyle={{ minWidth: 'none' }}
              >
                <Column
                  body={(row: any) => renderedCheckboxesPostage(type, faixaEtaria, row)} // Renderiza o checkbox personalizado
                  bodyStyle={{ padding: '.1rem' }}
                ></Column>
                <Column
                  field="nome"
                  header=""
                  bodyStyle={{ wordBreak: 'break-word', padding: '.1rem' }}
                ></Column>
              </DataTable>
            </AccordionTab>
          ))}
           </Accordion>
        </div>
      )}
    </div>
  );

  const renderExport = () => (
    existePortage &&  <div className="mt-auto">
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
    getPortage();
  }, [paciente]);

  return (
    <div className="mt-8 space-y-6">
      {renderExport()}
      {renderTable(TIPO_PORTAGE.socializacao)}
      {renderTable(TIPO_PORTAGE.cognicao)}
      {renderFooter()}
    </div>
  );
}
