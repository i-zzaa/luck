import { useCallback, useEffect, useState } from 'react';
import { Accordion, AccordionTab, Column, DataTable, TabPanel, TabView } from 'primereact';
import CheckboxPortage from '../components/checkboxPortage';
import { create, dropDown, filter } from '../server';
import { TIPO_PROTOCOLO, VBMAPP } from '../constants/protocolo';
import { ButtonHeron } from '../components';

import { useToast } from '../contexts/toast';
import gerarPdf from '../constants/pdfVBMAPP';
import { NotFound } from '../components/notFound';
import { OBJ_ITEM, OBJ_META } from '../util/util';
import { useLocation, useNavigate } from 'react-router-dom';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';

export default function VBMapp({ paciente }: any) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState({} as any);
  const [selectedItems, setSelectedItems] = useState([]);
  const { renderToast } = useToast();

  const [nivel, setNivel] = useState(VBMAPP.um);
  const [nivelIndex, setNivelIndex] = useState(VBMAPP.um - 1);
  const [existe, setExiste] = useState(false);

  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();

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
      // setList(data.data);

      getMetaEdit(data.data)
      setExiste(data.existeResposta);
    },
    [nivel, paciente.id]
  );

 const pegarNumeroDepoisDeMeta = (str: string) => {
    const match = str.match(/-meta-(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
}

const getMetaEdit = (currentList: any) => {
    if (!state?.metaEdit || state.pacienteId.id !== paciente.id) {
      setList(currentList);
      return;
    }
  
    // Criando uma cópia profunda do objeto para evitar mutação direta
    const copyList = JSON.parse(JSON.stringify(currentList));
  
    // Obtendo o programa que está sendo editado
    const programa = state.metaEdit.programa;
  
    if (!copyList[programa]) {
      console.error("Programa não encontrado em copyList:", programa);
      return;
    }
  
    // Atualizando as metas dentro do programa
    copyList[programa] = copyList[programa].map((meta: any) => {
      // Encontrar a meta editada no state
      const metaEditada = state.metaEdit.metas.find((metaEdit: any) => {
        return pegarNumeroDepoisDeMeta(metaEdit.id) === meta.id;
      });
  
      if (metaEditada) {
        let updatedSubitems = meta.subitems || [];

        // Atualizar os subitems com a resposta correta se existir
        if (Array.isArray(updatedSubitems) && Array.isArray(metaEditada.subitems)) {
          if (updatedSubitems.length) {
            updatedSubitems = updatedSubitems.map((subitem) => {
              const subitemEditado = metaEditada.subitems.find((edit: any) => edit.id === subitem.id);
              return subitemEditado 
                ? { ...subitem, selected: subitemEditado.selected || subitem.selected } // Garante que selected sempre tenha valor booleano
                : subitem;
            });
          } else {
            updatedSubitems = metaEditada.subitems
          }
        }

        return {
          ...meta,
          ...metaEditada,
          subitems: updatedSubitems, // Atualiza os subitems corretamente
          selected: metaEditada.selected !== undefined ? metaEditada.selected : meta.selected, // Atualiza a meta principal também
          id: meta.id
        };
      }
  
      return meta;
    });
  
    // Atualiza o estado com a lista modificada
    setList(copyList);
};



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

  const onCheckboxChange = (programa: string, itemId: string, newValue: boolean) => {
    setList((prevList: any) => {
      const updatedList = { ...prevList };
  
      // Percorre os itens dentro do programa para encontrar o item pelo ID
      updatedList[programa] = updatedList[programa].map((item: any) => {
        if (item.id === itemId) {
          return { ...item, selected: newValue };
        }
        
        // Se houver subitems, percorre e atualiza o estado do checkbox neles
        if (item.subitems) {
          const updatedSubitems = item.subitems.map((subitem: any) =>
            subitem.id === itemId ? { ...subitem, selected: newValue } : subitem
          );
          return { ...item, subitems: updatedSubitems };
        }
  
        return item;
      });
  
      return updatedList;
    });
  }

  const validItensPermiteSubitens= (programaList: any) => {
    const itensPermiteSubitens = programaList.filter((item: any) => item.permiteSubitens)

    return !!itensPermiteSubitens.length
  }


 const onClickAddSubItem = async (programaList: any, index: number, programa: string) => {
  const itensPermiteSubitens = programaList.filter((item: any) => item.permiteSubitens)
    

  const {
    estimuloDiscriminativo, 
    estimuloReforcadorPositivo, 
    procedimentoEnsinoId, 
    resposta
   } = itensPermiteSubitens[0]
    


    const meta = itensPermiteSubitens.map((item: any, key: any) => {
  const id = `${index}-meta-${item.id}`

      const objeto = {
        ...OBJ_META,
        value: item.nome,
        ...item,
        
        respostaSessao: item?.respostaSessao,
        
        id,

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
  
        objeto.subitems = subitems
      }

      return objeto
    })



    navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, { state: { edit: true, item: { 
      metas: meta, paciente, 
      estimuloDiscriminativo,
      estimuloReforcadorPositivo,
      procedimentoEnsinoId,
      programa, resposta
    },  tipoProtocolo: TIPO_PROTOCOLO.vbMapp } })
  }

  const renderedCheckboxes = useCallback((rowData: any, programa: any) => {
    const value = rowData.selected || null;
    return (
      // <CheckboxPortage
      //   key={rowData.id}
      //   value={value}
      //   onChange={(newValue: any) => {
      //     rowData.selected = newValue;
      //   }}
      // />

      <div >
        <div  className='flex items-center gap-2'>
          <div className='w-8 h-8'>
          <CheckboxPortage
            key={rowData.id}
            value={value}
            onChange={(newValue: any) => onCheckboxChange(programa, rowData.id, newValue)}
          />
          </div>
          { rowData.nome }
        </div>
        <div className='grid ml-8 mt-2'>
        {
          rowData?.subitems && (
            rowData.subitems.map((subItem: any)=> renderedCheckboxes(subItem, programa))
          )
        }
        </div>
      </div>
    );
  }, []);

  const renderTable = useCallback(() => (
    <div className="mt-8">
      {Object.keys(list).length > 0 ? (
        <Accordion>
          {Object.keys(list).map((programa, keys) => (
            <AccordionTab className="mb-2" key={keys} tabIndex={keys} header={
            <div className="flex items-center w-full gap-2">
              <span>{programa.toLocaleUpperCase()}</span>
              { validItensPermiteSubitens(list[programa]) && <i className="pi pi-pencil" onClick={()=> onClickAddSubItem(list[programa], keys, programa)} /> }
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
                <Column body={(row: any) => renderedCheckboxes(row, programa)} bodyStyle={{ padding: '.1rem' }} />
                {/* <Column field="nome" header="" bodyStyle={{ wordBreak: 'break-word', padding: '.1rem' }} /> */}
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
