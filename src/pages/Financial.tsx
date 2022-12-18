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

const fieldsConst = filterFinancialFields;
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ''));

export default function Financial() {
  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>([]);

  const { hasPermition } = permissionAuth();
  const { renderDropdownFinancial } = useDropdown();

  const [list, setList] = useState([
    {
      id: 1000,
      name: 'James Butt',
      country: {
        name: 'Algeria',
        code: 'dz',
      },
      company: 'Benton, John B Jr',
      date: '2015-09-13',
      status: 'unqualified',
      verified: true,
      activity: 17,
      representative: {
        name: 'Ioni Bowcher',
        image: 'ionibowcher.png',
      },
      balance: 70663,
    },
  ]);
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

    const response = await filter('financial', format);
    const lista: any[] = response.status === 200 && response?.data? response.data : [];
    setList(lista);
    setLoading(false);
  };

  const renderDropdown = useCallback(async () => {
    const list = await renderDropdownFinancial(statusPacienteId.crud_therapy);
    setDropDownList(list);
  }, []);

  const onRowGroupExpand = (event: any) => {};

  const onRowGroupCollapse = (event: any) => {};

  const headerTemplate = (data: any) => {
    return (
      <>
        <span className="image-text">{data.representative.name}</span>
      </>
    );
  };

  const footerTemplate = (data: any) => {
    return (
      <>
        <td style={{ textAlign: 'right' }}>Total Customers</td>
        <td>{data.representative.name}</td>
      </>
    );
  };

  const countryBodyTemplate = (rowData: any) => {
    return (
      <>
        <img
          alt={rowData.country.name}
          src="/images/flag/flag_placeholder.png"
          onError={(e: any) =>
            (e.target.src =
              'https://www.primefaces.org/wp-content/uploads/2020/05/placeholder.png')
          }
          className={`flag flag-${rowData.country.code}`}
          width="30"
        />
        <span className="image-text">{rowData.country.name}</span>
      </>
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
        <div className="w-full">
          <DataTable
            value={list}
            rowGroupMode="subheader"
            groupRowsBy="representative.name"
            sortMode="single"
            sortField="representative.name"
            sortOrder={1}
            responsiveLayout="scroll"
            expandableRowGroups
            expandedRows={expandedRows}
            onRowToggle={(e: any) => setExpandedRows(e.data)}
            onRowExpand={onRowGroupExpand}
            onRowCollapse={onRowGroupCollapse}
            rowGroupHeaderTemplate={headerTemplate}
            rowGroupFooterTemplate={footerTemplate}
            paginator={!!list.length}
            paginatorTemplate={paginationTemplate}
          >
            <Column field="name" header="Name" sortable></Column>
            <Column
              field="country"
              header="Country"
              body={countryBodyTemplate}
              sortable
            ></Column>
            <Column field="company" header="Company" sortable></Column>
            <Column field="date" header="Date" sortable></Column>
          </DataTable>
        </div>
      </Card>
    </div>
  );
}
