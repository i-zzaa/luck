import { useCallback, useEffect, useMemo, useState } from 'react';
import { getList } from '../server';
import { Card, Filter, Modal } from '../components';
import { CalendarComponent } from '../components/calendar';
import { ViewEvento } from '../components/view-evento';
import { CalendarForm } from '../foms/CalendarForm';
import { useDropdown } from '../contexts/dropDown';
import { filterCalendarFields } from '../constants/formFields';
import {
  formatdateeua,
  getDateFormat,
  getPrimeiroDoMes,
  getUltimoDoMes,
} from '../util/util';
import { statusPacienteId } from '../constants/patient';
import { permissionAuth } from '../contexts/permission';
import { NotFound } from '../components/notFound';

const fieldsConst = filterCalendarFields;
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ''));

export default function Schedule() {
  const current = new Date();

  const { hasPermition } = permissionAuth();

  const [loading, setLoading] = useState<boolean>(false);

  const [dropDownList, setDropDownList] = useState<any>([]);
  const { renderDropdownCalendar, renderPacientes } = useDropdown();

  const [event, setEvent] = useState<any>();
  const [open, setOpen] = useState<boolean>(false);
  const [openView, setOpenView] = useState<boolean>(false);

  const [evenetsList, setEventsList] = useState<any>([]);
  const currentDate = {
    start: getPrimeiroDoMes(current.getFullYear(), current.getMonth() + 1),
    end: getUltimoDoMes(current.getFullYear(), current.getMonth() + 1),
  };

  const renderEvents = useCallback(async (moment: any = currentDate) => {
    // debugger
    if (!hasPermition('AGENDA_EVENTO_TODOS_EVENTOS')) {
      const auth: any = await sessionStorage.getItem('auth');
      const user = JSON.parse(auth);
      handleSubmitFilter({
        terapeutaId: {
          id: user.id,
        },
      });
    } else {
      const response: any = await getList(
        `/evento/${moment.start}/${moment.end}`
      );
      setEventsList(response);
    }
  }, []);

  const handleSubmitFilter = useCallback(async (formvalue: any) => {
    try {
      setLoading(true);

      const filter: string[] = [];
      Object.keys(formvalue).map((key: string) => {
        if (formvalue[key]?.id) {
          filter.push(`${key}=${formvalue[key].id}`);
        }
      });

      const current = new Date();
      const response: any = await getList(
        `/evento/filter/${currentDate.start}/${currentDate.end}?${filter.join(
          '&'
        )}`
      );

      setEventsList(response);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }, []);

  const rendeFiltro = useMemo(async () => {
    const list = await renderDropdownCalendar(statusPacienteId.therapy);
    setDropDownList(list);
  }, []);

  const renderModalView = ({ event }: any) => {
    const evento = {
      id: Number(event.id),
      ...event._def.extendedProps,
      ...event._def.extendedProps.data,
      dataAtual: formatdateeua(event._instance.range.start),
      // dataInicio: formatdateeua(event._instance.range.start),
      date: getDateFormat(event._instance.range.start),
    };
    setEvent(evento);
    setOpenView(true);
  };

  const renderModalEdit = () => {
    setOpenView(false);
    setOpen(true);
  };

  useEffect(() => {
    rendeFiltro;
  }, []);

  useEffect(() => {
    renderEvents();
  }, []);

  return (
    <div className="h-max-screen">
      <Filter
        id="form-filter-patient"
        legend="Filtro"
        nameButton="Agendar"
        fields={fieldsConst}
        onSubmit={handleSubmitFilter}
        onReset={renderEvents}
        screen="AGENDA"
        loading={loading}
        dropdown={dropDownList}
        onInclude={() => {
          setEvent(null);
          setOpen(true);
        }}
      />
      <Card>
        {evenetsList.length ? (
          <div className="flex-1">
            <CalendarComponent
              openModalEdit={renderModalView}
              events={evenetsList}
              onNext={(moment: any) => renderEvents(moment)}
              onPrev={(moment: any) => renderEvents(moment)}
            />
          </div>
        ) : (
          <NotFound />
        )}
      </Card>

      {openView && (
        <ViewEvento
          evento={event}
          open={openView}
          onEdit={renderModalEdit}
          onClose={() => setOpenView(false)}
        />
      )}

      {open && hasPermition('AGENDA_FILTRO_BOTAO_CADASTRAR') ? (
        <Modal
          title="Agendamento"
          open={open}
          onClose={() => setOpen(false)}
          width="80vw"
        >
          <CalendarForm
            value={event}
            isEdit={!!event}
            screen="calendar"
            statusPacienteId={statusPacienteId.therapy}
            onClose={() => {
              setEvent(null);
              renderEvents();
              setOpen(false);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
