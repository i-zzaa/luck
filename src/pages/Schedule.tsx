// import { CalendarComponent } from "../../components/CalendarComponent";
import { useCallback, useEffect, useMemo, useState } from "react";
import { dropDown, getList } from "../server";
import { useForm } from "react-hook-form";
import moment from "moment";
import { ButtonHeron, Input, Modal } from "../components";
import { CalendarComponent } from "../components/calendar";
import { CalendarForm } from "../foms/CalendarForm";
import { useDropdown } from "../contexts/dropDown";

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
  const [terapeutasList, setTerapeutasList] = useState<any[]>([]);
  const [pacientesList, setPacientesList] = useState<any[]>([]);
  const [statusEventosList, setStatusEventosList] = useState<any[]>([]);

  const [dropDownList, setDropDownList] = useState<any[]>([]);
 
  const { renderDropdownCalendario, renderPacientes, renderStatusEventos, renderTerapeutas } = useDropdown()

  const [event, setEvent] = useState<any[]>();
  const [open, setOpen] = useState<boolean>(false);

  const [evenetsList, setEventsList] = useState<any>([]);
  const {
    control,
    formState: { errors },
  } = useForm<any>();



  const handleTerapeutas = useCallback(async () => {
    const response: any = await renderTerapeutas()
    setTerapeutasList(response);
  }, []);

  const handlePacientes = useCallback(async () => {
    const response: any = await renderPacientes();
    setPacientesList(response);
  }, []);

  const handleStatusEventos = useCallback(async () => {
    const response: any = await renderStatusEventos();
    setStatusEventosList(response);
  }, []);

  const renderEvents = useCallback(async () => {
    const current = new Date();
    const response: any = await getList(`/evento/mes/${current.getMonth() + 1}/${current.getFullYear()}`);

    setEventsList(response);
  }, []);

  const renderAgendar = async()=> {
    const list = await renderDropdownCalendario()
    setDropDownList(list)
    setOpen(true)
  }

  const rendeFiltro = useMemo(() => {
    handlePacientes()
    handleStatusEventos()
    handleTerapeutas()
  }, [])

  const renderModalEdit = ({ event }: any) => {
    renderAgendar()
    setEvent(event._def.extendedProps);
    setOpen(true);
  };
  
  useEffect(() => {
    rendeFiltro
  }, []);

  useEffect(() => {
    renderEvents()
  }, [event]);

  return (
    <>
      <div className="grid grid-cols-4 gap-8 justify-between">
        <div className="col-span-4 sm:col-span-1">
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
              id="terapeuta-calendario"
              type="list"
              errors={errors}
              customCol="my-12"
              control={control}
              options={pacientesList}
            />
          </div>
          <div className="card text-xs">
            <Input
              labelText="Terapeutas"
              id="terapeuta-calendario"
              type="list"
              errors={errors}
              customCol="my-12"
              control={control}
              options={terapeutasList}
            />
          </div>
          <div className="card text-xs">
            <Input
              labelText="Status"
              id="status-calendario"
              type="list"
              errors={errors}
              customCol="my-12"
              control={control}
              options={statusEventosList}
            />
          </div>
        </div>
        <div className="col-span-4 sm:col-span-3">
          <CalendarComponent
            openModalEdit={renderModalEdit}
            events={evenetsList}
          />
        </div>
      </div>

      {open && (
        <Modal title="Agendamento" open={open} onClose={() => setOpen(false)}>
          <CalendarForm
            value={event}
            dropDownList={dropDownList}
            onClose={() => {
              renderEvents();
              setOpen(false);
            }}
          />
        </Modal>
      )}
    </>
  );
}