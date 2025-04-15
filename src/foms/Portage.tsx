import { useCallback, useEffect, useRef, useState } from 'react';
import { Accordion, AccordionTab, Column, DataTable } from 'primereact';
import CheckboxPortage from '../components/checkboxPortage';
import { create, dropDown, filter } from '../server';
import { TIPO_PORTAGE, TIPO_PROTOCOLO, VALOR_PORTAGE } from '../constants/protocolo';
import { ButtonHeron } from '../components';

import { useToast } from '../contexts/toast';
import gerarPdf from '../constants/pdfPortage';
import { useLocation, useNavigate } from 'react-router-dom';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { OBJ_ITEM, OBJ_META } from '../util/util';

export default function PortageCadastro({ paciente }: { paciente: { id: number; nome: string } }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [list, setList] = useState<any>({});
  const [selectedItems, setSelectedItems] = useState<any[]>([]); // Controlar itens selecionados
  const { renderToast } = useToast();
  const navigate = useNavigate();

    const location = useLocation();
    const { state } = location;
    
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

      getMetaEdit(data.portage)
    }else {
      setExistePortage(false)
      renderList()
    }
  };

  const getMetaEdit = (currentList: any) => {
    if (state?.metaEdit) {
      const idMetaEdit = parseInt(state?.metaEdit.id.replace(/^0-meta-/, ""), 10);
  
      // Criando uma cópia do objeto atual
      const editList = { ...currentList };
  
      // Criando uma cópia do array para evitar mutação direta
      editList[state?.metaEdit.portage][state?.metaEdit.faixaEtaria] = 
        editList[state?.metaEdit.portage][state?.metaEdit.faixaEtaria].map((item: any) => 
          item.id === idMetaEdit ? { ...state?.metaEdit } : item
        );
  
      // Atualizando o estado com a nova lista editada
      setList(editList);
    }
  }

  const renderList = useCallback(async () => {
    try {
      const atividade = await dropDown('protocolo/portage');
      setList(atividade);
      getMetaEdit(atividade);
    } catch (error) {
      console.error('Error fetching dropdown data', error);
    }
  }, []);

  // Função auxiliar para alternar os estados
const getNextState = (currentValue: any) => {
  if (currentValue === VALOR_PORTAGE.sim) {
      return VALOR_PORTAGE.asVezes;
  } else if (currentValue === VALOR_PORTAGE.asVezes) {
      return VALOR_PORTAGE.nao;
  } else if (currentValue === VALOR_PORTAGE.nao) {
      return null;
  } else {
      return VALOR_PORTAGE.sim;
  }
};

  const onCheckboxChange = (portageType: string, faixaEtaria: string, itemId: any, value = undefined) => {
    setList((prevList: any) => {
      // Criando uma cópia profunda para garantir a atualização do React
      const updatedSelection = JSON.parse(JSON.stringify(prevList));

      if (updatedSelection[portageType] && updatedSelection[portageType][faixaEtaria]) {
          const activities = updatedSelection[portageType][faixaEtaria];

          // Verifica se o item é um subitem
          const isSubItem = itemId.toString().includes('-sub-item-');

          if (isSubItem) {
              // Atualizando apenas o subitem
              const [subItemId] = itemId.split('-sub-item-'); // Obtém o ID da meta principal
              const [,metaId] = subItemId.split('0-meta-');

              const parentIndex = activities.findIndex((activity: any) => activity.id === parseInt(metaId));

              if (parentIndex !== -1) {
                  const subItemIndex = activities[parentIndex].subitems.findIndex((sub: any) => sub.id === itemId);
                  if (subItemIndex !== -1) {
                      if (value !== undefined) {
                          activities[parentIndex].subitems[subItemIndex].selected = value;
                      } else {
                          activities[parentIndex].subitems[subItemIndex].selected = getNextState(activities[parentIndex].subitems[subItemIndex].selected);
                      }
                  }
              }
          } else {
              // Atualizando apenas o item pai (meta), sem alterar subitens
              const index = activities.findIndex((activity: any) => activity.id === itemId);

              if (index !== -1) {
                  let newValue = value !== undefined ? value : getNextState(activities[index].selected);
                  activities[index].selected = newValue;
              }
          }
      }

      return updatedSelection;
  });
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

  const onClickAddSubItem = async (item: any) => {
    const id = `0-meta-${item.id}`
    const selectedMeta = item?.selected ? {selected: item.selected} : {}


    const meta = {
      ...OBJ_META,
      id,
      value: item.nome,
      portage: item.portage,
      faixaEtaria: item.faixaEtaria,

        estimuloDiscriminativo: item?.estimuloDiscriminativo,
        estimuloReforcadorPositivo: item?.estimuloReforcadorPositivo,
        procedimentoEnsino: item?.procedimentoEnsinoId,
        programa: item?.programaId,
        resposta: item?.resposta,
        ...selectedMeta
    }

    if (item?.subitems) {
      const subitems = item?.subitems.map((subitem: any) => {
        const selected = subitem?.selected ? {selected: subitem.selected} : {}
        return {
          ...OBJ_ITEM,
          id: subitem.id,
          value: subitem.nome,
          ...selected
        }
      })

      meta.subitems = subitems
    }


    navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, { state: { edit: true, item: { metas: [meta], paciente },  tipoProtocolo: TIPO_PROTOCOLO.portage } })
  }

  const renderedCheckboxesPostage = (portageType: string, faixaEtaria: string, rowData: any) => {
    const value = rowData.selected || null;

    return (
    //   <CheckboxPortage
    //   key={rowData.id}
    //   value={value}
    //   onChange={(newValue: any) => onCheckboxChange(portageType, faixaEtaria, rowData.id, newValue)} // Atualiza o checkbox
    // />
      <div >
        <div  className='flex items-center gap-2'>
          <CheckboxPortage
            key={rowData.id}
            value={value}
            onChange={(newValue: any) => onCheckboxChange(portageType, faixaEtaria, rowData.id, newValue)} Atualiza o checkbox
          />
          { rowData.nome }
          { rowData?.permiteSubitens  && <i className="pi pi-pencil" onClick={()=> onClickAddSubItem(rowData)} /> }
        </div>
        <div className='grid ml-8 mt-2'>
        {
          rowData?.subitems && (
            rowData.subitems.map((subItem: any)=> renderedCheckboxesPostage(portageType, faixaEtaria, subItem))
          )
        }
        </div>
      </div>
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
                {/* <Column
                  field="nome"
                  header=""
                  bodyStyle={{ wordBreak: 'break-word', padding: '.1rem' }}
                ></Column> */}
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
