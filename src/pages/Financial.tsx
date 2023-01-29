import { useCallback, useEffect, useState } from 'react';

import { filter, getList } from '../server';
import { Card, Filter, TextSubtext, Title } from '../components/index';
import { permissionAuth } from '../contexts/permission';
import {
  filterFinancialFields,
  filterFinancialPacienteFields,
} from '../constants/financial';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { useDropdown } from '../contexts/dropDown';
import { statusPacienteId } from '../constants/patient';
import { NotFound } from '../components/notFound';
import { TabPanel, TabView } from 'primereact/tabview';
import moment from 'moment';
import { bgData, formaTime, moneyFormat } from '../util/util';
import { LoadingHeron } from '../components/loading';

const fieldsConstTerapeuta = filterFinancialFields;
const fieldsState1: any = {};
fieldsConstTerapeuta.forEach((field: any) => (fieldsState1[field.id] = ''));

const fieldsConstPaciente = filterFinancialPacienteFields;
const fieldsState2: any = {};
fieldsConstPaciente.forEach((field: any) => (fieldsState2[field.id] = ''));

export default function Financial() {
  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>([]);

  const { hasPermition } = permissionAuth();
  const { renderDropdownFinancial } = useDropdown();

  const [list, setList] = useState<any>([]);
  const [geral, setGeral] = useState<any>({});

  const [expandedRows, setExpandedRows] = useState([]);

  const resetList = (e: any) => {
    setList([]);
    setGeral({});

    return e;
  };

  const handleSubmitFilter = async (formState: any, modulo: string) => {
    setLoading(true);
    const format: any = {};

    await Object.keys(formState).map((key: any) => {
      if (key.indexOf('Id') !== -1) {
        format[key] = formState[key]?.id || undefined;
      } else {
        format[key] = formState[key];
      }
    });

    const response = await filter(`financeiro/${modulo}`, format);
    const lista: any =
      response.status === 200 && response?.data ? response.data : [];
    setGeral(lista.geral);
    setList(lista.data);
    setLoading(false);
  };

  const renderDropdown = useCallback(async () => {
    const list = await renderDropdownFinancial(statusPacienteId.crud_therapy);
    setDropDownList(list);
  }, []);

  const onRowGroupExpand = (event: any) => {};

  const onRowGroupCollapse = (event: any) => {};

  const reducerValorTotal = (nome: string, modulo: string) => {
    const result = list
      .filter((items: any) => items[modulo] === nome)
      .map((item: any) => item.valorTotal)
      .reduce((total: number, current: any) => (total += current));

    return moneyFormat.format(result);
  };

  const reducerHorasTotal = (nome: string, modulo: string) => {
    const reduce = list
      .filter((items: any) => items[modulo] === nome)
      .map((item: any) => item.horas)
      .reduce((total: number, current: any) => {
        const tt = moment.duration(total);
        tt.add(moment.duration(current));
        return tt;
      });

    return formaTime(reduce);
  };

  const headerTemplate = (data: any, modulo: string) => {
    return (
      <span className="">
        <span className="image-text mr-8">{data[modulo]} </span>
        <span className="image-text mr-8">
          Valor total:
          <span className="font-sans-serif">
            {reducerValorTotal(data[modulo], modulo)}
          </span>
        </span>
        <span className="image-text">
          Total de Horas:{' '}
          <span className="font-sans-serif">
            {reducerHorasTotal(data[modulo], modulo)}
          </span>
        </span>
      </span>
    );
  };

  const paginationTemplate = {
    layout: 'RowsPerPageDropdown CurrentPageReport PrevPageLink NextPageLink',
    RowsPerPageDropdown: (options: any) => {
      const dropdownOptions = [
        { label: 10, value: 10 },
        { label: 20, value: 20 },
        { label: 50, value: 50 },
      ];

      return (
        <>
          <span
            className="mx-1"
            style={{ color: 'var(--text-color)', userSelect: 'none' }}
          >
            Items per page:{' '}
          </span>
          <Dropdown
            value={options.value || 10}
            options={dropdownOptions}
            onChange={options.onChange}
          />
        </>
      );
    },
    CurrentPageReport: (options: any) => {
      return (
        <span
          style={{
            color: 'var(--text-color)',
            userSelect: 'none',
            width: '120px',
            textAlign: 'center',
          }}
        >
          {options.first} - {options.last} of {options.totalRecords}
        </span>
      );
    },
  };

  const pacienteBodyTemplate = (rowData: any) => {
    return !rowData.devolutiva ? (
      <div className="flex gap-2">
        <i className="pi pi-tag text-violet-600" />
        {rowData.paciente}
      </div>
    ) : (
      rowData.paciente
    );
  };

  const renderScreenTerapeuta = () => {
    return (
      <>
        <Filter
          id="form-filter-patient"
          legend="Filtro"
          fields={fieldsConstTerapeuta}
          screen="FINANCEIRO"
          onSubmit={(e: any) => handleSubmitFilter(e, 'terapeuta')}
          onReset={() => {}}
          loading={loading}
          dropdown={dropDownList}
        />

        {!loading && list.length ? (
          <div className="grid sm:grid-cols-3 sm:gap-2">
            <Card>
              <div className="flex gap-4 items-center">
                <i className="pi pi-users" />
                <div className="grid">
                  <span className="text-gray-600 text-sm">
                    {geral.especialidade}
                  </span>
                  <span className="font-sans-serif">{geral.nome}</span>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex gap-2 justify-around">
                <div className="flex gap-4 items-center">
                  <i className="pi pi-stopwatch" />
                  <div className="grid">
                    <span className="text-gray-600 text-sm">Horas</span>
                    <span className="font-sans-serif">{geral.horas}</span>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <i className="pi pi-car" />
                  <div className="grid">
                    <span className="text-gray-600 text-sm">km</span>
                    <span className="font-sans-serif">{geral.valorKm}</span>
                  </div>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex gap-4 items-center">
                <i className="pi pi-money-bill" />
                <div className="grid">
                  <span className="text-gray-600 text-sm">Total total</span>
                  <span className="font-sans-serif">
                    {moneyFormat.format(geral.valorTotal)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        ) : null}
        <Card>
          <div className="flex justify-center">
            {loading ? (
              <LoadingHeron />
            ) : list.length ? (
              <div className="w-full text-md ">
                <DataTable
                  value={list}
                  rowGroupMode="subheader"
                  groupRowsBy="paciente"
                  sortMode="single"
                  responsiveLayout="scroll"
                  expandableRowGroups
                  expandedRows={expandedRows}
                  onRowToggle={(e: any) => setExpandedRows(e.data)}
                  onRowExpand={onRowGroupExpand}
                  onRowCollapse={onRowGroupCollapse}
                  rowGroupHeaderTemplate={(e: any) =>
                    headerTemplate(e, 'paciente')
                  }
                >
                  <Column
                    field="paciente"
                    header="Paciente"
                    body={pacienteBodyTemplate}
                  ></Column>
                  <Column
                    field="data"
                    header="Data"
                    // body={countryBodyTemplate}
                  ></Column>
                  <Column field="status" header="Status"></Column>
                  <Column
                    field="km"
                    header="km"
                    body={(rowData: any) =>
                      rowData.km == 0 ? '-' : rowData.km
                    }
                  ></Column>
                  <Column
                    field="valorKm"
                    header="ValorKm km"
                    body={(rowData: any) =>
                      rowData.valorKm == 0
                        ? '-'
                        : moneyFormat.format(rowData.valorKm)
                    }
                  ></Column>
                  <Column
                    field="sessao"
                    header="Valor da Sessão"
                    body={({ sessao }: any) => (
                      <span className="font-sans-serif">
                        {moneyFormat.format(sessao)}
                      </span>
                    )}
                  ></Column>
                  <Column
                    field="valorSessao"
                    header="Comissão"
                    body={({ valorSessao }: any) => (
                      <span className="font-sans-serif">
                        {moneyFormat.format(valorSessao)}
                      </span>
                    )}
                  ></Column>
                  <Column
                    field="valorTotal"
                    header="Valor Total"
                    body={({ valorTotal }: any) => (
                      <span className="font-sans-serif">
                        {moneyFormat.format(valorTotal)}
                      </span>
                    )}
                  ></Column>
                </DataTable>{' '}
              </div>
            ) : (
              <div className="w-full flex items-center  justify-center">
                <NotFound />
              </div>
            )}
          </div>
        </Card>
      </>
    );
  };

  const renderScreenPaciente = () => {
    return (
      <>
        <Filter
          id="form-filter-patient"
          legend="Filtro"
          fields={fieldsConstPaciente}
          screen="FINANCEIRO"
          onSubmit={(e: any) => handleSubmitFilter(e, 'paciente')}
          onReset={() => {}}
          loading={loading}
          dropdown={dropDownList}
        />

        {!loading && list.length ? (
          <>
            <div className="grid sm:grid-cols-2 sm:gap-2">
              <Card>
                <div className="flex gap-2 justify-around">
                  <div className="flex gap-4 items-center">
                    <i className="pi pi-stopwatch" />
                    <div className="grid">
                      <span className="text-gray-600 text-sm">Horas</span>
                      <span className="font-sans-serif">{geral.horas}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <i className="pi pi-car" />
                    <div className="grid">
                      <span className="text-gray-600 text-sm">km</span>
                      <span className="font-sans-serif">{geral.valorKm}</span>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <i className="pi pi-money-bill" />
                    <div className="grid">
                      <span className="text-gray-600 text-sm">Total total</span>
                      <span className="font-sans-serif">
                        {moneyFormat.format(geral.valorTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex flex-wrap gap-2 items-left">
                  {geral.especialidadeSessoes &&
                    Object.keys(geral.especialidadeSessoes).map(
                      (item: string) => (
                        <>
                          <div className="flex gap-2 items-center">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                bgData[item.toUpperCase()]
                              }`}
                            ></div>
                            <div className="grid">
                              <span> {item} </span>
                              <span className="font-sans-serif">
                                {' '}
                                {geral.especialidadeSessoes[item]}{' '}
                              </span>
                            </div>
                          </div>
                        </>
                      )
                    )}
                </div>
              </Card>
            </div>
          </>
        ) : null}

        <Card>
          {loading ? (
            <LoadingHeron />
          ) : list.length ? (
            <div className="w-full ">
              {' '}
              <DataTable
                value={list}
                rowGroupMode="subheader"
                groupRowsBy="terapeuta"
                sortMode="single"
                sortField="terapeuta"
                sortOrder={1}
                responsiveLayout="scroll"
                expandableRowGroups
                expandedRows={expandedRows}
                onRowToggle={(e: any) => setExpandedRows(e.data)}
                onRowExpand={onRowGroupExpand}
                onRowCollapse={onRowGroupCollapse}
                rowGroupHeaderTemplate={(e: any) =>
                  headerTemplate(e, 'terapeuta')
                }
              >
                <Column field="terapeuta" header="Terapeuta" sortable></Column>
                <Column
                  field="data"
                  header="Data"
                  body={({ data }: any) => (
                    <span className="font-sans-serif">{data}</span>
                  )}
                  sortable
                ></Column>
                <Column field="status" header="Status" sortable></Column>
                <Column field="km" header="km" sortable></Column>
                <Column
                  field="especialidade"
                  header="especialidade"
                  sortable
                  body={({ especialidade }: any) => (
                    <div className="flex gap-2 items-center">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          bgData[especialidade.toUpperCase()]
                        }`}
                      ></div>
                      <span> {especialidade} </span>
                    </div>
                  )}
                ></Column>
                <Column
                  field="sessao"
                  header="Valor da Sessão"
                  sortable
                  body={({ sessao }: any) => (
                    <span className="font-sans-serif">
                      {moneyFormat.format(sessao)}
                    </span>
                  )}
                ></Column>
              </DataTable>{' '}
            </div>
          ) : (
            <div className="w-full flex items-center  justify-center">
              <NotFound />
            </div>
          )}
        </Card>
      </>
    );
  };

  useEffect(() => {
    renderDropdown();
  }, []);

  return (
    <div className="grid gap-8">
      <TabView
        className="tabview-custom"
        onBeforeTabChange={(e) => resetList(e)}
      >
        <TabPanel header="Terapeuta" leftIcon="pi pi-user">
          {renderScreenTerapeuta()}
        </TabPanel>
        <TabPanel header="Paciente" leftIcon="pi pi-user">
          {renderScreenPaciente()}
        </TabPanel>
      </TabView>
    </div>
  );
}
