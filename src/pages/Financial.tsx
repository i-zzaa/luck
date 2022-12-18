import { useCallback, useEffect, useState } from 'react';

import { filter, getList } from '../server';
import { Card, Filter, TextSubtext, Title } from '../components/index';
import { permissionAuth } from '../contexts/permission';
import { filterFinancialFields } from '../constants/financial';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { useDropdown } from '../contexts/dropDown';
import { statusPacienteId } from '../constants/patient';
import { NotFound } from '../components/notFound';

const fieldsConst = filterFinancialFields;
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ''));

export default function Financial() {
  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>([]);

  const { hasPermition } = permissionAuth();
  const { renderDropdownFinancial } = useDropdown();

  const [list, setList] = useState<any>([]);

  const [expandedRows, setExpandedRows] = useState([]);

  const handleSubmitFilter = async (formState: any) => {
    setLoading(true);
    const format: any = {};

    await Object.keys(formState).map((key: any) => {
      if (key.indexOf('Id') !== -1) {
        format[key] = formState[key]?.id || undefined;
      } else {
        format[key] = formState[key];
      }
    });

    const response = await filter('financeiro/terapeuta', format);
    const lista: any[] = response.status === 200 && response?.data ? response.data.data : [];
    setList(lista);
    setLoading(false);
  };

  const renderDropdown = useCallback(async () => {
    const list = await renderDropdownFinancial(statusPacienteId.crud_therapy);
    setDropDownList(list);
  }, []);

  const onRowGroupExpand = (event: any) => {};

  const onRowGroupCollapse = (event: any) => {};

  const reducerValorTotal = (paciente: string) => {
    return list.filter((items: any) => items.paciente === paciente)
    .map((item: any) => item.valorTotal)
    .reduce((total: number, current: any) => total += current)
  }

  const headerTemplate = (data: any) => {
    return (
        <span  className=''>
        <span className="image-text mr-8">{data.paciente}   </span>
        <span className="image-text">valor total: R$ {reducerValorTotal(data.paciente)}</span>
       
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

  useEffect(() => {
    renderDropdown();
  }, []);

  return (
    <div className="grid gap-8">
      <Filter
        id="form-filter-patient"
        legend="Filtro"
        fields={fieldsConst}
        screen="FINANCEIRO"
        onSubmit={handleSubmitFilter}
        onReset={() => {}}
        loading={loading}
        dropdown={dropDownList}
      />

      <Card>
       
          {list.length ?  <div className="w-full "> <DataTable
            value={list}
            rowGroupMode="subheader"
            groupRowsBy="paciente"
            sortMode="single"
            sortField="paciente"
            sortOrder={1}
            responsiveLayout="scroll"
            expandableRowGroups
            expandedRows={expandedRows}
            onRowToggle={(e: any) => setExpandedRows(e.data)}
            onRowExpand={onRowGroupExpand}
            onRowCollapse={onRowGroupCollapse}
            rowGroupHeaderTemplate={headerTemplate}
          >
            <Column field="paciente" header="Paciente" sortable></Column>
            <Column
              field="data"
              header="Data"
              // body={countryBodyTemplate}
              sortable
            ></Column>
            <Column field="status" header="Status" sortable></Column>
            <Column field="km" header="km" sortable></Column>
            <Column field="valorKm" header="ValorKm km" sortable></Column>
            <Column field="sessao" header="Valor da Sessão" sortable></Column>
            <Column field="valorSessao" header="Comissão" sortable></Column>
            <Column field="devolutiva" header="Devolutiva" sortable></Column>
            <Column field="valorTotal" header="Valor Total" sortable></Column>
          </DataTable> </div> : <div className='w-full flex items-center  justify-center'><NotFound /></div>}
        
      </Card>
    </div>
  );
}
