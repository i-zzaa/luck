import { useCallback, useEffect, useMemo, useState } from "react";
import {  getList } from "../server";
import {  Card, Filter, Modal } from "../components";
import { CalendarComponent } from "../components/calendar";
import { ViewEvento } from "../components/view-evento";
import { CalendarForm } from "../foms/CalendarForm";
import { useDropdown } from "../contexts/dropDown";
import { filterCalendarFields } from "../constants/formFields";
import {  getDateFormat } from "../util/util";

const fieldsConst = filterCalendarFields;

//userFields
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ""));

interface UserProps {
  id: string;
  nome: string;
  login: string;
  ativo: boolean;
  perfil: {
    id: string;
    nome: string;
  };
}

export default function Schedule() {
  const [terapeutas, setTerapeutasList] = useState<any[]>([]);
  const [pacientes, setPacientesList] = useState<any>([]);
  const [statusEventos, setStatusEventosList] = useState<any[]>([]);
  const [modalidades, setModalidadeList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { renderPacientes, renderStatusEventos, renderTerapeutas, renderModalidade } = useDropdown()

  const [event, setEvent] = useState<any>();
  const [open, setOpen] = useState<boolean>(false);
  const [openView, setOpenView] = useState<boolean>(false);

  const [evenetsList, setEventsList] = useState<any>([]);

  const handleTerapeutas = useCallback(async () => {
    const response: any = await renderTerapeutas()
    setTerapeutasList(response);
  }, []);

  const handlePacientes = useCallback(async () => {
    const response: any = await renderPacientes(true);
    setPacientesList(response);
  }, []);

  const handleStatusEventos = useCallback(async () => {
    const response: any = await renderStatusEventos();
    setStatusEventosList(response);
  }, []);

  const handleModalidade = useCallback(async () => {
    const response: any = await renderModalidade();
    setModalidadeList(response);
  }, []);

  const renderEvents = useCallback(async () => {
    const current = new Date();
    const response: any = await getList(`/evento/mes/${current.getMonth() + 1}/${current.getFullYear()}`);

    setEventsList(response);
  }, []);

  const handleSubmitFilter = useCallback(async (formvalue: any) => {
    try {
      setLoading(true)

      const filter: string[] = []
      Object.keys(formvalue).map((key: string) => {
        if (formvalue[key]?.id) {
          filter.push(`${key}=${formvalue[key].id}`)
        }
      })
      
      const current = new Date();
      const response: any = await getList(`/evento/filter/${current.getMonth() + 1}/${current.getFullYear()}?${filter.join('&')}`);
  
      setEventsList(response);
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }, []);

  const rendeFiltro = useMemo(() => {
    handlePacientes()
    handleStatusEventos()
    handleTerapeutas()
    handleModalidade()
  }, [])

  const renderModalView = ({ event }: any) => {
    const evento = {
      id: Number(event.id),
      ...event._def.extendedProps,
      ...event._def.extendedProps.data,
      date: getDateFormat(event._instance.range.start)
    }
    setEvent(evento);
    setOpenView(true);
  };

  const renderModalEdit = () => {
    setOpenView(false);
    setOpen(true);
  };
  
  useEffect(() => {
    rendeFiltro
  }, []);

  useEffect(() => {
    renderEvents()
  }, [event]);

  return (
    <div className="h-max-screen">
      {/* <div className="grid grid-cols-4 gap-8 justify-between"> */}
      <Filter
        id="form-filter-patient"
        legend="Filtro"
        nameButton="Agendar"
        fields={fieldsConst}
        onSubmit={handleSubmitFilter}
        onReset={renderEvents}
        rule={true}
        loading={loading}
        dropdown={{ pacientes, terapeutas, statusEventos, modalidades }}
        onInclude={()=> {
          setEvent(null);
          setOpen(true)
        }}
      />
      <Card >
        {/* <div className="col-span-4 sm:col-span-1">
          <div className="col-span-1 flex items-end justify-end">
            <ButtonHeron
              text="Agendar"
              type="primary"
              size="full"
              icon="pi pi-calendar-plus"
              onClick={renderAgendar}
            /> 
          </div>

          <div className="card text-xs">
            <Input
              labelText="Pacientes"
              id="pacientes"
              type="multiselect"
              errors={errors}
              customCol="my-12"
              control={control}
              options={pacientesList}
            />
          </div>
          <div className="card text-xs">
            <Input
              labelText="Terapeutas"
              id="terapeutas"
              type="multiselect"
              errors={errors}
              customCol="my-12"
              control={control}
              options={terapeutasList}
            />
          </div>
          <div className="card text-xs">
            <Input
              labelText="Status"
              id="statusEventos"
              type="multiselect"
              errors={errors}
              customCol="my-12"
              control={control}
              options={statusEventosList}
            />
          </div>
        </div> */}
        <div className="flex-1">
          <CalendarComponent
            openModalEdit={renderModalView}
            events={evenetsList}
          />
        </div>
      </Card>

      {openView && (<ViewEvento 
        evento={event}
        open={openView}
        onEdit={renderModalEdit}
        onClose={()=> setOpenView(false)}
      />)}

      {open && (
        <Modal title="Agendamento" open={open} onClose={() => setOpen(false)} width="80vw">
          <CalendarForm
            value={event}
            isEdit={!!event}
            onClose={() => {
              setEvent(null)
              renderEvents();
              setOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}