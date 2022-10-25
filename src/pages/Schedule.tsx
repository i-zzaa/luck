// import { CalendarComponent } from "../../components/CalendarComponent";
import { useCallback, useEffect, useState } from "react";
import { getList } from "../server";
import { useForm } from "react-hook-form";
import moment from "moment";
import { ButtonHeron, Input, Modal } from "../components";
import { CalendarComponent } from "../components/calendar";
import { CalendarForm } from "../foms/CalendarForm";

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
  const [event, setEvent] = useState<any[]>();
  const [open, setOpen] = useState<boolean>(false);

  const [terapeutas, setTerapeutas] = useState<UserProps>();
  const [pacientes, setPacientes] = useState<any>();
  const [evenetsList, setEventsList] = useState<any>([]);
  const {
    control,
    formState: { errors },
  } = useForm<any>();

  const renderModalEdit = (value: any) => {
    setEvent(value);
    setOpen(true);
  };

  const renderTerapeutas = useCallback(async () => {
    const response: any = await getList("/usuarios/terapeutas");
    const arr = Object.values(response).map((values: any) => values);
    setTerapeutasList(arr);
  }, []);

  const renderPacientes = useCallback(async () => {
    const response: any = await getList("/dropdrown/paciente");
    setPacientesList(response);
  }, []);

  const renderEvents = useCallback(async () => {
    const current = new Date();
    const format = moment(current).format("YYYY-MM-DD");
    const response: any = await getList(`/agenda/mes/${format}`);

    setEventsList(response);
  }, []);

  useEffect(() => {
    renderTerapeutas();
    renderPacientes();
    renderEvents();
  }, []);

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
              onClick={() => setOpen(true)}
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
              options={terapeutasList}
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