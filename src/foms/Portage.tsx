// código completo e final atualizado com fluxo de prioridade ajustado
import { useCallback, useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<any>({});
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const { renderToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const [existePortage, setExistePortage] = useState(false);

  const exportPDF = async () => {
    const { data }: any = await filter('protocolo', {
      pacienteId: paciente.id,
      protocoloId: TIPO_PROTOCOLO.portage,
      type: 'pdf',
    });
    if (data) await gerarPdf(data);
    else {
      setLoading(false);
      renderToast({ type: 'failure', title: 'Erro!', message: 'Não existe Portage cadastrado no momento!', open: true });
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

  const getNextState = (currentValue: any) => {
    if (currentValue === VALOR_PORTAGE.sim) return VALOR_PORTAGE.asVezes;
    if (currentValue === VALOR_PORTAGE.asVezes) return VALOR_PORTAGE.nao;
    if (currentValue === VALOR_PORTAGE.nao) return null;
    return VALOR_PORTAGE.sim;
  };

  const onCheckboxChange = (portageType: string, faixaEtaria: string, itemId: any, value = undefined) => {
    setList((prevList: any) => {
      const updatedSelection = JSON.parse(JSON.stringify(prevList));
      const activities = updatedSelection?.[portageType]?.[faixaEtaria];
      if (!activities) return prevList;
      const isSubItem = itemId.toString().includes('-sub-item-');
      if (isSubItem) {
        const [subItemId] = itemId.split('-sub-item-');
        const [, metaId] = subItemId.split('0-meta-');
        const parentIndex = activities.findIndex((a: any) => a.id === parseInt(metaId) || a.id === subItemId);
        if (parentIndex !== -1) {
          const subItemIndex = activities[parentIndex].subitems.findIndex((s: any) => s.id === itemId);
          if (subItemIndex !== -1) {
            activities[parentIndex].subitems[subItemIndex].selected =
              value !== undefined ? value : getNextState(activities[parentIndex].subitems[subItemIndex].selected);
          }
        }
      } else {
        const index = activities.findIndex((a: any) => a.id === itemId);
        if (index !== -1) {
          activities[index].selected = value !== undefined ? value : getNextState(activities[index].selected);
        }
      }
      return updatedSelection;
    });
  };

  const onSubmit = async () => {
    setLoading(true);
    const payload = { pacienteId: paciente, portage: list };
    try {
      await create('protocolo/portage', payload);
      sessionStorage.removeItem('draftSubitems');
      navigate(location.pathname, { replace: true });
      setExistePortage(true);
      renderToast({ type: 'success', title: 'Sucesso!', message: 'Portage Cadastrado.', open: true });
    } catch (error) {
      console.error('Error saving form data', error);
      renderToast({ type: 'failure', title: 'Erro!', message: 'Falha na conexão', open: true });
    } finally {
      setLoading(false);
    }
  };

  const onClickAddSubItem = (item: any) => {
    const id = item.id.toString().startsWith('0-meta-') ? item.id : `0-meta-${item.id}`;
    const selectedMeta = item?.selected ? { selected: item.selected } : {};
    const meta = {
      ...OBJ_META,
      id,
      value: item.nome,
      faixaEtaria: item.faixaEtaria,
      estimuloDiscriminativo: item?.estimuloDiscriminativo,
      estimuloReforcadorPositivo: item?.estimuloReforcadorPositivo,
      procedimentoEnsino: item?.procedimentoEnsinoId,
      programa: item?.programaId || item?.programa,
      resposta: item?.resposta,
      ...selectedMeta,
      subitems: item?.subitems?.map((sub: any) => ({
        ...OBJ_ITEM,
        id: sub.id,
        value: sub.nome,
        ...(sub.selected && { selected: sub.selected })
      })) || []
    };
    const existingDrafts = JSON.parse(sessionStorage.getItem('draftSubitems') || '[]');
    const metaId = parseInt(meta.id.replace(/^0-meta-/, ''), 10);
    const updatedDrafts = existingDrafts.filter((m: any) => parseInt(m.id.replace(/^0-meta-/, '')) !== metaId);
    updatedDrafts.push(meta);
    sessionStorage.setItem('draftSubitems', JSON.stringify(updatedDrafts));
    sessionStorage.setItem('prePEIList', JSON.stringify(list));
    navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
      state: { edit: true, item: { metas: [meta], paciente }, tipoProtocolo: TIPO_PROTOCOLO.portage },
    });
  };

  const renderedCheckboxesPostage = (portageType: string, faixaEtaria: string, rowData: any) => {
    const value = rowData.selected || null;
    return (
      <div>
        <div className="flex items-center gap-2">
          <CheckboxPortage key={rowData.id} value={value} onChange={(val: any) => onCheckboxChange(portageType, faixaEtaria, rowData.id, val)} />
          {rowData.nome}
          {rowData?.permiteSubitens && <i className="pi pi-pencil" onClick={() => onClickAddSubItem(rowData)} />}
        </div>
        <div className="grid ml-8 mt-2">
          {rowData?.subitems?.map((sub: any) => renderedCheckboxesPostage(portageType, faixaEtaria, sub))}
        </div>
      </div>
    );
  };

  const renderTable = (type: string) => (
    <div className="mt-8">
      {list?.[type] && (
        <>
          <div className='text-gray-400 my-4 text-start'> { type } </div>
          <Accordion>
            {Object.keys(list[type]).map((faixaEtaria: any) => (
              <AccordionTab tabIndex={faixaEtaria} key={faixaEtaria} header={<div>{faixaEtaria}</div>}>
                <DataTable className="custom-data-table" value={list[type][faixaEtaria]} selection={selectedItems} responsiveLayout="scroll" dataKey="id">
                  <Column body={(row: any) => renderedCheckboxesPostage(type, faixaEtaria, row)} bodyStyle={{ padding: '.1rem' }} />
                </DataTable>
              </AccordionTab>
            ))}
          </Accordion>
        </>
      )}
    </div>
  );

  const renderExport = () => (
    existePortage && (
      <div className="mt-auto">
        <ButtonHeron text="Gerar Relatório" type="primary" size="full" icon="pi pi-file-pdf" onClick={exportPDF} loading={loading} typeButton="button" />
      </div>
    )
  );

  const renderFooter = () => (
    <div className="mt-auto">
      <ButtonHeron text="Salvar" type="primary" size="full" onClick={onSubmit} loading={loading} />
    </div>
  );

  useEffect(() => {
    if (state?.metaEdit) {
      const drafts = JSON.parse(sessionStorage.getItem('draftSubitems') || '[]');
      const id = state.metaEdit.id;
      const index = drafts.findIndex((m: any) => m.id === id);
      if (index !== -1) drafts[index] = { ...state.metaEdit };
      else drafts.push(state.metaEdit);
      sessionStorage.setItem('draftSubitems', JSON.stringify(drafts));
    }

    const init = async () => {
      let listAtual;
      const { data }: any = await filter('protocolo', {
        pacienteId: paciente.id,
        protocoloId: TIPO_PROTOCOLO.portage,
        type: 'local',
      });

      if (data?.portage) {
        setExistePortage(true);
        listAtual = JSON.parse(JSON.stringify(data.portage));
      } else {
        setExistePortage(false);
        const atividade = await dropDown('protocolo/portage');
        listAtual = JSON.parse(JSON.stringify(atividade));
      }

      const prePEIList = JSON.parse(sessionStorage.getItem('prePEIList') || '{}');

      const mergeSelected = (newItems: any[], oldItems: any[]) => {
        return newItems.map((newItem: any) => {
          const oldItem = oldItems.find((o: any) => o.id === newItem.id);
          const merged = { ...newItem };
          if (oldItem) {
            if (oldItem.selected !== undefined) merged.selected = oldItem.selected;
            if (newItem.subitems?.length && oldItem.subitems?.length) {
              merged.subitems = mergeSelected(newItem.subitems, oldItem.subitems);
            }
          }
          return merged;
        });
      };

      for (const programa in listAtual) {
        for (const faixa in listAtual[programa]) {
          const newItems = listAtual[programa][faixa];
          const oldItems = prePEIList?.[programa]?.[faixa] || [];
          listAtual[programa][faixa] = mergeSelected(newItems, oldItems);
        }
      }

      if (state?.metaEdit) {
        const idMetaEdit = parseInt(state.metaEdit.id.replace(/^0-meta-/, ""), 10);
        const programa = state.metaEdit.programa;
        const faixaEtaria = state.metaEdit.faixaEtaria;

        if (!listAtual[programa]) listAtual[programa] = {};
        if (!listAtual[programa][faixaEtaria]) listAtual[programa][faixaEtaria] = [];

        const metaIndex = listAtual[programa][faixaEtaria].findIndex(
          (m: any) => parseInt(m.id.toString().replace(/^0-meta-/, ""), 10) === idMetaEdit
        );

        const preMeta = prePEIList?.[programa]?.[faixaEtaria]?.find(
          (m: any) => parseInt(m.id.toString().replace(/^0-meta-/, ""), 10) === idMetaEdit
        );

        const mergeSubitems = (newSubs: any[], preSubs: any[]) => {
          return newSubs.map((sub: any) => {
            const preSub = preSubs.find((s: any) => s.id === sub.id);
            return {
              ...sub,
              selected: preSub?.selected ?? sub.selected ?? null,
            };
          });
        };

        const updatedMeta = {
          ...state.metaEdit,
          selected: preMeta?.selected ?? state.metaEdit.selected ?? null,
          subitems: mergeSubitems(state.metaEdit.subitems ?? [], preMeta?.subitems ?? []),
        };

        if (metaIndex !== -1) listAtual[programa][faixaEtaria][metaIndex] = updatedMeta;
        else listAtual[programa][faixaEtaria].push(updatedMeta);
      }

      const drafts = JSON.parse(sessionStorage.getItem('draftSubitems') || '[]');
      if (drafts.length > 0) {
        for (const meta of drafts) {
          const programa = meta.programa;
          const faixaEtaria = meta.faixaEtaria;
          const metaId = parseInt(meta.id.replace(/^0-meta-/, ''), 10);
          if (!listAtual[programa]) listAtual[programa] = {};
          if (!listAtual[programa][faixaEtaria]) listAtual[programa][faixaEtaria] = [];
          const metas = listAtual[programa][faixaEtaria];
          const index = metas.findIndex((m: any) => m.id === metaId || m.id === meta.id);
          if (index !== -1) {
            const oldSubitems = metas[index].subitems || [];
            const newSubitems = meta.subitems || [];
            const updatedSubitems = newSubitems.map((draftSub: any) => {
              const selected = draftSub.selected !== undefined ? draftSub.selected : oldSubitems.find((s: any) => s.id === draftSub.id)?.selected;
              return { ...draftSub, selected };
            });
            metas[index] = {
              ...metas[index],
              ...meta,
              subitems: updatedSubitems
            };
          } else {
            metas.push(meta);
          }
        }
      }

      setList(listAtual);
    };

    init();
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
