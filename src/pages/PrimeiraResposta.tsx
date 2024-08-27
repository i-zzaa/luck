import { useCallback, useEffect, useState } from 'react';
import { dropDown, filter, getList } from '../server';

import { Card } from '../components/card';
import { useToast } from '../contexts/toast';
import { Filter } from '../components';
import { PEIFields } from '../constants/formFields';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { useNavigate } from 'react-router-dom';
import { NotFound } from '../components/notFound';
import { LoadingHeron } from '../components/loading';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import clsx from 'clsx';
import { Accordion, AccordionTab } from 'primereact/accordion';


const fieldsConst = PEIFields;
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ''));

export default function PrimeiraResposta() {
  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>([]);
  const [list, setList] = useState({}) as any;
  const [children, setChildren] = useState(0) as any;

  const { renderToast } = useToast();
  const navigate = useNavigate();

  
  const onSubmitFilter = async ({ pacienteId }: any) => {
    
    setLoading(true)
    try {
      const result: any = await getList(`sessao/atividade/${pacienteId.id}`);

      setList(result);
    } catch (error) {
      setList([]);
      renderToast({
        type: 'failure',
        title: '401',
        message: 'PEI não encontrado!',
        open: true,
      });
    }
    setLoading(false)
  }

  const renderFilter = () => {
    return (
      <Filter
        id="form-filter-pei"
        legend="Filtro"
        nameButton="Cadastrar"
        fields={fieldsConst}
        dropdown={dropDownList}
        onSubmit={(value)=>  onSubmitFilter(value)}
        onReset={()=> setList([])}
        screen="PEI"
        loading={loading}
      />
    )
  }

  const renderBodyTemplate = (item: any, index: number) => {
    return  item.dias[index] ? ( <div className='grid grid-rows-3 justify-center'>
        <div className='flex justify-center'>
         { item.dias[index].data }
        </div>

        <div className='flex gap-2 justify-center'>
          <div className={clsx('flex justify-center items-center font-inter font-light rounded-full w-4 h-4', {
            'bg-green-400  text-white': item.dias[index].primeiraResposta
          })}>S</div>
          <div className={clsx('flex justify-center items-center font-inter font-light rounded-full w-4 h-4', {
            'bg-red-400  text-white': !item.dias[index].primeiraResposta
          })}>N</div>
        </div>
        <div className='flex justify-center'>
         { item.dias[index].porcentagem }%
        </div>
      </div>
    ) : '-'
  }

  const renderContent = () => {
    if (!loading) {

      return list.length ? (
        <Card >
           <Accordion >
            {
              list.map((item: any, key: number) => {
                return (
                  <AccordionTab  key={key}  tabIndex={key} header={
                    <div className="flex items-center  w-full">
                      <span>{ item.programa}</span>
                    </div>
                  }>

                    <DataTable value={item.children} scrollable >
                      <Column field="programa" header="Programa" style={{ width: '25%' }} ></Column>
                      { Array.from({ length: item.qtdColumns }).map((dia: any, index) =><Column body={(row)=> renderBodyTemplate(row, index)} ></Column>) }
                    </DataTable>
                  
                  </AccordionTab>
                )
              })
            }
           </Accordion>
        </Card>
      ):  <Card> <NotFound /> </Card>
    } else {
      return <LoadingHeron />;
    }
  }

  const renderPrograma = useCallback(async () => {
    const [paciente]: any = await Promise.all([
      dropDown('paciente'),
    ])

    setDropDownList({
      paciente,
    })
  }, []);

  useEffect(() => {
    renderPrograma();
  }, []);
  
  return (
    <div>
      { renderFilter() }
      { renderContent() }
    </div>
  );
};
