import { useCallback, useEffect, useState } from 'react';
import { filter, getList, update } from '../server';

import { useToast } from '../contexts/toast';
import { permissionAuth } from '../contexts/permission';
import { Card, Filter, List } from '../components/index';
import { useDropdown } from '../contexts/dropDown';
import {
  filterCurdPatientFields,
  STATUS_PACIENT_COD,
} from '../constants/patient';
import PaginationComponent from '../components/Pagination';
import { useNavigate } from 'react-router-dom';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';

const fieldsConst = filterCurdPatientFields;
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ''));

export default function Patients() {
  const SCREEN = 'CADASTRO_PACIENTES';
  const { hasPermition } = permissionAuth();
  const navigator = useNavigate()

  const [fields, setFields] = useState(fieldsConst);

  const [patients, setPatients] = useState<any[]>([]);
  const [patient, setPatient] = useState<any>();
  const [filterCurrent, setFilter] = useState<any>({});
  const [pagination, setPagination] = useState<any>({
    pageSize: 10,
    totalPages: 0,
    currentPage: 1
  });
  const [loading, setLoading] = useState<boolean>(false);

  const [dropDownList, setDropDownList] = useState<any>([]);
  const { renderDropdownQueue, renderPacientes } = useDropdown();

  const { renderToast } = useToast();

  const renderPatient = useCallback(async () => {
    try {
      setLoading(true);
      setPatients([]);
      const response = await getList(
        `paciente?statusPacienteCod=${STATUS_PACIENT_COD.crud_therapy}&page=${pagination.currentPage}&pageSize=${pagination.pageSize}`
      );
      setPatients(response.data);
      setPagination(response.pagination)

      setLoading(false);
    } catch (error) {
      setLoading(false);
      renderToast({
        type: 'failure',
        title: 'Erro!',
        message: 'Falha na conexão',
        open: true,
      });
    }
  }, []);

  const handlePagination = async (pag: any) => {
    const currentPage = {
      ...pagination,
      currentPage: pag
    }

    setPagination(currentPage)
    handleSubmitFilter(filterCurrent, currentPage)
  }

  const handleSubmitFilter = async (formState: any = filterCurrent, pag = pagination) => {
    setLoading(true);
    setFilter(formState)
    try {
      const format: any = {
        // naFila: formState.naFila === undefined ? true : !formState.naFila,
        disabled: formState.disabled === undefined ? false : formState.disabled,
        statusPacienteCod: STATUS_PACIENT_COD.crud_therapy,
      };
      // delete formState.naFila;
      delete formState.disabled;

      await Object.keys(formState).map((key: any) => {
        format[key] = formState[key]?.id || undefined;
      });

      const response: any = await filter('paciente', format, `page=${pag.currentPage}&pageSize=${pag.pageSize}`);
      setPatients(response.data.data || response.data);
      setPagination(response.pagination || response.data.pagination)
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

  const handleSchedule = async ({ item, typeButtonFooter }: any) => {
    switch (typeButtonFooter) {
      case 'programa':
        navigator(`/${CONSTANTES_ROUTERS.PATIENT}`, {
          state: {
            patient: item
          }
        });
        break;

      default:

        break;
    }
  };

  const renderDropdown = useCallback(async () => {
    const list = await renderDropdownQueue(STATUS_PACIENT_COD.crud_therapy);
    setDropDownList(list);
  }, []);

  useEffect(() => {
    !hasPermition('CADASTRO_PACIENTES_FILTRO_SELECT_AGENDADOS')
      ? handleSubmitFilter({ naFila: true, disabled: false })
      : renderPatient();
    renderDropdown();
  }, [renderPatient]);

  return (
    <div className="grid">
      <Filter
        id="form-filter-patient"
        legend="Filtro"
        fields={fields}
        screen={SCREEN}
        onSubmit={handleSubmitFilter}
        onReset={renderPatient}
        loading={loading}
        dropdown={dropDownList}
        onInclude={() => {}}
      />

      <Card>
        <List
          loading={loading}
          type="complete"
          items={patients}
          screen={SCREEN}
          onClick={handleSchedule}
          onClickLink={() => {}}
          onClickTrash={() => {}}
          onClickEdit={() => {}}
          onClickReturn={() => {}}
        />
        {pagination.totalPages > 1 && <PaginationComponent totalPages={pagination.totalPages}  currentPage={pagination.currentPage} onChange={handlePagination}/>}
      </Card>

    </div>
  );
}
