import { useCallback, useEffect, useState } from 'react';
import { getList } from '../server';

import { useToast } from '../contexts/toast';
import { ButtonHeron, Filter } from '../components/index';
import {  formatDateHours, getPrimeiroDoMes, getUltimoDoMes } from '../util/util';
import { useDropdown } from '../contexts/dropDown';
import {
  filterCurdPatientFields,
  STATUS_PACIENT_COD,
} from '../constants/patient';
import { PacientsProps } from '../foms/PatientForm';
import { useAuth } from '../contexts/auth';
import { Card } from 'primereact/card';
import { Timeline } from 'primereact/timeline';
import { useNavigate } from 'react-router-dom';

const fieldsConst = filterCurdPatientFields;
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ''));

export default function Schedule() {
  const SCREEN = 'AGENDA';

  const navigator = useNavigate()

  const { user } = useAuth()

  const [fields, setFields] = useState(fieldsConst);
  const [list, setList] = useState<PacientsProps[]>([]);
  
  const [filterCurrent, setFilter] = useState<any>({});
  const [pagination, setPagination] = useState<any>({
    pageSize: 10,
    totalPages: 0,
    currentPage: 1
  });

  const current = new Date();
  const [currentDate, setCurrentDate] = useState<any>({
    start: getPrimeiroDoMes(current.getFullYear(), current.getMonth() + 1),
    end: getUltimoDoMes(current.getFullYear(), current.getMonth() + 1),
  });
  
  const [openCalendarForm, setOpenCalendarForm] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);

  const [dropDownList, setDropDownList] = useState<any>([]);
  const { renderDropdownQueue } = useDropdown();

  const { renderToast } = useToast();

  const renderPatient = useCallback(async () => {
    handleSubmitFilter({
      terapeutaId: {
        id:  user.id,
      },
    });
  }, []);

  const handleSubmitFilter = async (formState: any = filterCurrent) => {
    setLoading(true);
    setFilter(formState)
    try {
      const filter: string[] = [];
      Object.keys(formState).map((key: string) => {
        if (formState[key]?.id) {
          filter.push(`${key}=${formState[key].id}`);
        }
      });
      
      const data:  any = await getList(`/evento/filtro/${currentDate.start}/${currentDate.end}?${filter.join('&')}`);
      setList(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Erro na conexão!',
        open: true,
      });
    }
  };


  const customizedMarker = (item: any) => {
    return (
      <span className="flex w-8 h-8 items-center justify-center text-white rounded-full	 z-1 shadow-1" style={{ backgroundColor: item.color }}>
          <i className={item.icon}></i>
      </span>
    );
};

const customizedContent = (item: any) => {
  return (
    <Card title={item.paciente.nome} subTitle={`${formatDateHours(item.startTime, item.data)} - ${item.endTime}` } className='mb-4 font-inter ' footer={
      <>
      {
        item.id !== 0 && (<ButtonHeron
          text="Iniciar Atendimento"
          icon="pi pi-play"
          type="primary"
          color="white"
          size="full"
          onClick={() => navigator('/protocolo')}
        />
      )}
      </>
    }>
      {
        item.id !== 0 && (<>
         <p className="flex gap-4 items-center">
        <i className="pi pi-map-marker"></i>
          {item.localidade.nome}
          {item.isExterno && (
            <span className="font-bold font-inter mb-8"> {`- ${item.km}km`} </span>
          )}
        </p>

      </> )
      }

    </Card>
  );
};


  const renderDropdown = useCallback(async () => {
    const list = await renderDropdownQueue(STATUS_PACIENT_COD.crud_therapy);
    setDropDownList(list);
  }, []);

  useEffect(() => {
    renderPatient();
    renderDropdown();
  },[]);

  return (
    <div className="grid p-8 mt-8">
      <Filter
        id="form-filter-patient"
        legend="Filtro"
        fields={fields}
        screen={SCREEN}
        onSubmit={renderPatient}
        onReset={renderPatient}
        loading={loading}
        dropdown={dropDownList}
        onInclude={() => {
          setList([]);
        }}
      />
      <Timeline value={list} align="left" className="mt-8" marker={customizedMarker} content={customizedContent} />

    </div>
  );
}
