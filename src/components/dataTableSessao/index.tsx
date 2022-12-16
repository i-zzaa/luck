import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useEffect, useState } from 'react';
import { InputNumber } from 'primereact/inputnumber';

interface DataTableHeronProps {
  value: any[];
  onChange: (data: any) => void;
}

export const DataTableSessaoHeron = ({value,  onChange}: DataTableHeronProps) => {
  const [sessoes, setSessoes] = useState(value);
  const [sessao, setSessao] = useState('');
  const columns = [
    { field: 'especialidade', header: 'Especialidade' },
    { field: 'valor', header: 'Valor' },
    { field: 'km', header: 'KM' }
  ];
  
  const cellEditor = (options: any) => {
    switch (options.field) {
      case 'valor':
        return <InputNumber onValueChange={(e: any) => setSessao(e.target.value)} mode="currency" currency="USD" locale="en-US" />
      case 'km':
        return <input type="number" onInput={(e: any)=> setSessao(e.target.value)} />
      default:
        return options.value
      }
    }

    const onCellEditComplete = (valueForm: any) => {
      if (valueForm.field === 'especialidade') return

      let { rowIndex, field } = valueForm;
       
      const list = [ ...sessoes ]
      list[rowIndex][field] = sessao;
  
      setSessoes(list)
      onChange(sessoes)
    }

    useEffect(()=> {
      setSessoes(value)
    }, [value])

  return (
    <div className="card p-fluid">
      <h5 className="text-md my-2 text-gray-800 font-bold ">Infomações das sessões</h5>
        <DataTable value={sessoes} editMode="cell" className="editable-cells-table font-sans-serif" responsiveLayout="scroll">
        {
          columns.map(({ field, header }) => {
            return (
              <Column 
                key={field} 
                field={field} 
                header={header} 
                style={{ width: '25%' }}  
                onCellEditComplete={onCellEditComplete} 
                editor={(options) =>  cellEditor(options)}
              />
          )})
        }
      </DataTable>
    </div>
  )
}