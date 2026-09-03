import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { TabPanel, TabView } from 'primereact/tabview';
import CheckboxPortage from '../components/CheckboxPortage';
import { create, filter } from '../server';
import { TIPO_PROTOCOLO, VBMAPP } from '../constants/protocolo';
import { ButtonHeron } from '../components';
import { useToast } from '../contexts/toast';
import gerarPdf from '../constants/pdfVBMAPP';
import { NotFound } from '../components/notFound';
import { OBJ_ITEM, OBJ_META } from '../util/util';
import { useLocation, useNavigate } from 'react-router-dom';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { useIsTabRoute } from '../components/Nav/useIsTabRoute';
import { ABOVE_TAB_BAR } from '../components/Nav/bottomTabBarLayout';

export default function VBMapp({ paciente }: any) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState({} as any);
  const [selectedItems, setSelectedItems] = useState([]);
  const { renderToast } = useToast();

  const [nivel, setNivel] = useState(VBMAPP.um);
  const [nivelIndex, setNivelIndex] = useState(VBMAPP.um - 1);
  const [existe, setExiste] = useState(false);
  const isTabRoute = useIsTabRoute();

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

      getMetaEdit(data.data);
      setExiste(data.existeResposta);
    },
    [nivel, paciente.id]
  );

  // Recupera o id original do item a partir do id composto que
  // onClickAddSubItem monta (`${index}-meta-${item.id}`). Antes exigia
  // que o trecho depois de "-meta-" fosse só dígitos (regex \d+) — o id
  // de um item do VB-MAPP nem sempre é puramente numérico (pode vir
  // como código, ex. "M1"), e nesse caso a extração falhava (retornava
  // null) SILENCIOSAMENTE pra TODOS os itens editáveis do programa.
  // Resultado: metasEditadasMap.has(...) nunca batia, o filtro abaixo
  // removia a lista inteira do programa, e o lápis (que só aparece se
  // sobrar algum item com permiteSubitens) sumia — exatamente o bug
  // relatado em Mando/Tato/Ouvinte. Captura tudo depois do último
  // "-meta-", não só dígitos.
  const pegarIdDepoisDeMeta = (str: string) => {
    const match = String(str).match(/-meta-(.+)$/);
    return match ? match[1] : null;
  };

  // Um item só entra no fluxo de edição do PEI se tiver subitens ou
  // permiteSubitens (mesmo critério de onClickAddSubItem) — os demais
  // itens do programa nunca são enviados pro formulário, então não tem
  // como vir de volta em state.metaEdit.metas. Precisa desse mesmo
  // critério aqui pra não confundir "não editável, nem deveria estar
  // na resposta" com "editável e removido de propósito no PEI".
  const itemEEditavel = (item: any) =>
    (item.subitems && item.subitems.length) || item.permiteSubitens;

  const getMetaEdit = (currentList: any) => {
    if (
      !state?.metaEdit ||
      state.pacienteId.id !== paciente.id ||
      state.protocoloId !== TIPO_PROTOCOLO.vbMapp
    ) {
      setList(currentList);
      return;
    }

    const savedList = sessionStorage.getItem('prePEIListVBMapp');
    const previousList = savedList ? JSON.parse(savedList) : currentList;

    const copyList = JSON.parse(JSON.stringify(previousList));
    const programa = state.metaEdit.programa;

    if (!copyList[programa]) {
      console.error('Programa não encontrado em copyList:', programa);
      return;
    }

    // Chave sempre em string (tanto aqui quanto nos .get/.has abaixo) —
    // meta.id no dado vindo do backend pode ser number, e o id extraído
    // do composto por pegarIdDepoisDeMeta é sempre string; comparar sem
    // normalizar os dois lados pro mesmo tipo faz o Map nunca bater.
    const metasEditadasMap = new Map(
      state.metaEdit.metas.map((meta: any) => [
        pegarIdDepoisDeMeta(meta.id),
        meta,
      ])
    );

    // Só mexe nos itens que passaram pelo formulário do PEI (editáveis).
    // Um editável que sumiu do retorno foi removido de propósito lá
    // dentro — esse sim é excluído daqui. Os não-editáveis (nunca
    // enviados, então nunca estariam no Map) ficam intactos, preservando
    // a ordem original do programa.
    copyList[programa] = copyList[programa]
      .filter(
        (meta: any) =>
          !itemEEditavel(meta) || metasEditadasMap.has(String(meta.id))
      )
      .map((meta: any) => {
        if (!itemEEditavel(meta)) return meta;

        const metaEditada: any = metasEditadasMap.get(String(meta.id));
        if (!metaEditada) return meta;

        const updatedSubitems = (metaEditada?.subitems || []).map((edit: any) => {
          const backendSub = (meta.subitems || []).find(
            (s: any) => s.id === edit.id
          );

          return {
            ...OBJ_ITEM,
            ...backendSub,
            ...edit,
            selected:
              edit.selected !== undefined
                ? edit.selected
                : (backendSub?.selected ?? false),
          };
        });

        return {
          ...meta,
          ...metaEditada,
          subitems: updatedSubitems,
          selected: metaEditada?.selected ?? meta.selected,
          id: meta.id,
        };
      });

    setList(copyList);
  };

  const clearMetaEdit = () => {
    // --- limpa somente state.metaEdit ---
    const st = (state as any) || {};
    if ('metaEdit' in st) {
      const { metaEdit, ...rest } = st; // remove metaEdit
      navigate(location.pathname + location.search + location.hash, {
        replace: true,
        state: Object.keys(rest).length ? rest : null, // mantém eventuais outras chaves
      });
    }
  };

  const onSubmit = useCallback(async () => {
    setLoading(true);
    const payload = { pacienteId: paciente.id, vbmapp: list };

    try {
      await create('protocolo/vbmapp', payload);
      setExiste(true);
      clearMetaEdit();
      renderToast({
        type: 'success',
        title: 'Sucesso!',
        message: 'VB Mapp Cadastrado.',
        open: true,
      });

      navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
        replace: true, // evita empilhar
        state: {
          pacienteId: paciente, // mantém paciente
          // resetProtocolo: true, // flag para o pai limpar protocolo
        },
      });

      sessionStorage.setItem('removeProtocolo', 'true');
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

  // Antes isso achava o item por `.id`, procurando em TODO item de topo e,
  // se não batesse, em TODOS os subitems dele também. Se um subitem
  // compartilhar `.id` com algum item de topo (comum quando vêm de
  // tabelas/sequências diferentes no backend), o clique podia acabar
  // resolvendo pro item errado — mesma causa do bug em Portage.tsx.
  // metaIndex/subItemIndex vêm direto de onde o item está sendo
  // renderizado (posição real na árvore), não dependem do `.id`.
  const onCheckboxChange = (
    programa: string,
    metaIndex: number,
    subItemIndex: number | undefined,
    newValue: boolean
  ) => {
    setList((prevList: any) => {
      const updatedList = { ...prevList };
      const items = [...(updatedList[programa] || [])];
      const item = items[metaIndex];
      if (!item) return prevList;

      if (subItemIndex !== undefined && subItemIndex !== null) {
        const subitems = [...(item.subitems || [])];
        if (!subitems[subItemIndex]) return prevList;
        subitems[subItemIndex] = {
          ...subitems[subItemIndex],
          selected: newValue,
        };
        items[metaIndex] = { ...item, subitems };
      } else {
        items[metaIndex] = { ...item, selected: newValue };
      }

      updatedList[programa] = items;
      return updatedList;
    });
  };

  const validItensPermiteSubitens = (programaList: any) => {
    const itensPermiteSubitens = programaList.filter(
      (item: any) => item.permiteSubitens
    );
    return !!itensPermiteSubitens.length;
  };

  const onClickAddSubItem = async (
    programaList: any,
    index: number,
    programa: string
  ) => {
    const itensPermiteSubitens = programaList.filter((item: any) => {
      return (item.subitems && item.subitems.length) || item.permiteSubitens;
    });

    const {
      estimuloDiscriminativo,
      estimuloReforcadorPositivo,
      procedimentoEnsinoId,
      resposta,
    } = itensPermiteSubitens[0];

    const meta = itensPermiteSubitens.map((item: any, key: any) => {
      const id = `${index}-meta-${item.id}`;

      const objeto: any = {
        ...OBJ_META,
        value: item.nome,
        ...item,
        respostaSessao: item?.respostaSessao,
        id,
      };

      if (item?.subitems) {
        const subitems = item?.subitems.map((subitem: any) => {
          const selected = subitem?.selected
            ? { selected: subitem.selected }
            : {};
          return {
            ...OBJ_ITEM,
            id: subitem.id,
            value: subitem.nome,
            ...selected,
          };
        });

        objeto.subitems = subitems;
      }

      return objeto;
    });

    sessionStorage.setItem('prePEIListVBMapp', JSON.stringify(list));

    navigate(`/${CONSTANTES_ROUTERS.PROTOCOLO}`, {
      state: {
        edit: true,
        item: {
          metas: meta,
          paciente,
          estimuloDiscriminativo,
          estimuloReforcadorPositivo,
          procedimentoEnsinoId,
          programa,
          resposta,
        },
        programa,
        tipoProtocolo: TIPO_PROTOCOLO.vbMapp,
      },
    });
  };

  // metaIndex vem sempre preenchido (posição do item de topo em
  // list[programa]); subItemIndex só existe quando rowData é um subitem.
  const renderedCheckboxes = useCallback(
    (
      rowData: any,
      programa: any,
      metaIndex: number,
      subItemIndex?: number
    ) => {
      const value = rowData.selected || null;
      return (
        <div key={rowData.id ?? `${metaIndex}-${subItemIndex}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8">
              <CheckboxPortage
                value={value}
                onChange={(newValue: any) =>
                  onCheckboxChange(
                    programa,
                    metaIndex,
                    subItemIndex,
                    newValue
                  )
                }
              />
            </div>
            {rowData.nome}
          </div>
          <div className="grid ml-8 mt-2">
            {rowData?.subitems &&
              rowData.subitems.map((subItem: any, subIndex: number) =>
                renderedCheckboxes(subItem, programa, metaIndex, subIndex)
              )}
          </div>
        </div>
      );
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const renderTable = useCallback(
    () => (
      <div className="mt-8">
        {Object.keys(list).length > 0 ? (
          <Accordion>
            {Object.keys(list).map((programa, keys) => (
              <AccordionTab
                className="mb-2"
                key={keys}
                tabIndex={keys}
                header={
                  <div className="flex items-center w-full gap-2">
                    <span>{programa.toLocaleUpperCase()}</span>
                    {validItensPermiteSubitens(list[programa]) && (
                      <i
                        className="pi pi-pencil"
                        onClick={() =>
                          onClickAddSubItem(list[programa], keys, programa)
                        }
                      />
                    )}
                  </div>
                }
              >
                <DataTable
                  id="vbmapp-page"
                  className="custom-data-table"
                  value={list[programa]}
                  selection={selectedItems}
                  responsiveLayout="scroll"
                  dataKey="id"
                  tableStyle={{ minWidth: 'none' }}
                >
                  <Column
                    body={(row: any, options: any) =>
                      renderedCheckboxes(row, programa, options.rowIndex)
                    }
                    bodyStyle={{ padding: '.1rem' }}
                  />
                </DataTable>
              </AccordionTab>
            ))}
          </Accordion>
        ) : (
          <NotFound />
        )}
      </div>
    ),
    [list, renderedCheckboxes, selectedItems]
  );

  const renderExport = useCallback(
    () =>
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
      ),
    [existe, exportPDF, loading]
  );

  const renderFooter = useCallback(
    () => (
      <div
        className={clsx(
          'fixed inset-x-0 z-10 px-4 pt-3 bg-background border-t border-gray-300 pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
          // acima da tab bar flutuante quando ela está visível na mesma
          // tela (rota /protocolo-av) — ver Nav/bottomTabBarLayout.ts
          isTabRoute ? ABOVE_TAB_BAR : 'bottom-0'
        )}
      >
        <ButtonHeron
          text="Salvar"
          type="primary"
          size="full"
          onClick={onSubmit}
          loading={loading}
        />
      </div>
    ),
    [onSubmit, loading, isTabRoute]
  );

  // getVBMapp já é memoizado a partir de [nivel, paciente.id] — depender
  // também do objeto `paciente` aqui era redundante e perigoso: o
  // componente pai (Protocolo.tsx) usa watch() no topo do form e
  // re-renderiza a cada campo alterado, o que pode entregar uma referência
  // nova de `paciente` mesmo sendo o mesmo paciente.id, refazendo o
  // POST /protocolo/filtro à toa a cada re-render.
  useEffect(() => {
    getVBMapp();
  }, [getVBMapp]);

  return (
    <div className="mt-8 space-y-6 pb-24">
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
