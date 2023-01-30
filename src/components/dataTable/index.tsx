import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useEffect, useState } from 'react';

interface DataTableHeronProps {
  value: any[];
  onChange: (data: any) => void;
}

export const DataTableHeron = ({ value, onChange }: DataTableHeronProps) => {
  const list = [
    {
      dias: 'Segunda',
      entrada: '08:00',
      almoco: '12:00',
      retorno: '13:00',
      saida: '17:00',
    },
    {
      dias: 'Terça',
      entrada: '08:00',
      almoco: '12:00',
      retorno: '13:00',
      saida: '17:00',
    },
    {
      dias: 'Quarta',
      entrada: '08:00',
      almoco: '12:00',
      retorno: '13:00',
      saida: '17:00',
    },
    {
      dias: 'Quinta',
      entrada: '08:00',
      almoco: '12:00',
      retorno: '13:00',
      saida: '17:00',
    },
    {
      dias: 'Sexta',
      entrada: '08:00',
      almoco: '12:00',
      retorno: '13:00',
      saida: '17:00',
    },
  ];

  const [cargaHoraria, setCargaHoraria] = useState<any[]>(list);
  const [hours, sethours] = useState('');

  const columns = [
    { field: 'dias', header: 'Dias' },
    { field: 'entrada', header: 'Entrada' },
    { field: 'almoco', header: 'Almoço' },
    { field: 'retorno', header: 'Retorno' },
    { field: 'saida', header: 'Saida' },
  ];

  const onCellEditComplete = (valueForm: any) => {
    let { rowIndex, field } = valueForm;

    const horarios = [...cargaHoraria];
    horarios[rowIndex][field] = hours;

    setCargaHoraria(horarios);
    onChange(horarios);
  };

  useEffect(() => {
    if (value.length) {
      setCargaHoraria(value);
    }else {
      onChange(list);
    }
  }, []);

  return (
    <div className="card p-fluid">
      <h5 className="text-md my-2 text-gray-800 font-bold ">
        Horário de trabalho da terapeuta
      </h5>
      <DataTable
        value={cargaHoraria}
        editMode="cell"
        className="editable-cells-table font-sans-serif"
        responsiveLayout="scroll"
      >
        {columns.map(({ field, header }) => {
          return (
            <Column
              key={field}
              field={field}
              header={header}
              style={{ width: '25%' }}
              onCellEditComplete={onCellEditComplete}
              editor={(options) =>
                options.field !== 'dias' ? (
                  <input
                    type="time"
                    onInput={(e: any) => sethours(e.target.value)}
                  />
                ) : (
                  options.value
                )
              }
            />
          );
        })}
      </DataTable>
    </div>
  );
};
