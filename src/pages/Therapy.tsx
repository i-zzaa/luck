import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { filter, getList, update } from '../server';

import { useToast } from '../contexts/toast';
import {
  COORDENADOR,
  COORDENADOR_TERAPEUTA,
  permissionAuth,
} from '../contexts/permission';
import { Card, Confirm, Filter, Modal, List } from '../components/index';
import { filterTerapyFields } from '../constants/formFields';
import { ScheduleForm } from '../foms/ScheduleForm';
import { CalendarForm } from '../foms/CalendarForm';
import { formtDatePatient } from '../util/util';
import { useDropdown } from '../contexts/dropDown';
import { patientTherapyFields, statusPacienteId } from '../constants/patient';
import { PacientsProps, PatientForm } from '../foms/PatientForm';

const fieldsConst = filterTerapyFields;
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ''));

export default function Therapy() {
  const { hasPermition } = permissionAuth();
  const [fields, setFields] = useState(fieldsConst);

  const [patients, setPatients] = useState<PacientsProps[]>([]);
  const [patient, setPatient] = useState<any>();
  const [patientFormatCalendar, setPatientFormatCalendar] = useState<any>();

  const [open, setOpen] = useState<boolean>(false);
  const [openCalendarForm, setOpenCalendarForm] = useState<boolean>(false);
  const [openSchedule, setOpenSchedule] = useState<boolean>(false);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [dropDownList, setDropDownList] = useState<any>([]);
  const { renderDropdownQueue, renderPacientes } = useDropdown();

  const { renderToast } = useToast();

  const renderPatient = useCallback(async () => {
    setLoading(true)
    setPatients([]);
    const response = await getList(
      `pacientes?statusPacienteId=${statusPacienteId.queue_therapy}`
    );
    setPatients(response);
    setLoading(false)
  }, []);

  const handleDisabledUser = async () => {
    setOpenConfirm(false);
    try {
      const response = await update('paciente/desabilitar', {
        id: patient.id,
        disabled: !patient.disabled,
      });
      handleSubmitFilter({ disabled: patient.disabled });
      renderToast({
        type: 'success',
        title: response.data.message,
        message: response.data.data,
        open: true,
      });
    } catch (error) {
      renderToast({
        type: 'failure',
        title: 'Erro!',
        message: 'Não foi possível excluí-lo',
        open: true,
      });
    }
  };

  const handleSubmitFilter = async (formState: any) => {
    setLoading(true);
    const format: any = {
      naFila: formState.naFila === undefined ? true : !formState.naFila,
      disabled: formState.disabled === undefined ? false : formState.disabled,
      statusPacienteId: statusPacienteId.queue_therapy,
    };
    delete formState.naFila;
    delete formState.disabled;

    await Object.keys(formState).map((key: any) => {
      format[key] = formState[key]?.id || undefined;
    });

    const response = await filter('pacientes', format);
    const lista: PacientsProps[] = response.status === 200 ? response.data : [];
    setPatients(lista);
    setLoading(false);
  };

  const sendUpdate = async (url: string, body: any, filter: any) => {
    try {
      await update(url, body);
      setOpenSchedule(false);
      handleSubmitFilter(filter);
    } catch ({ response }: any) {
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Não foi possível agendá-lo!',
        open: true,
      });
    }
  };

  const handleSchedule = async ({ item, typeButtonFooter }: any) => {
    switch (typeButtonFooter) {
      case 'agendado':
        setPatient(item);
        formatCalendar(item);
        setOpenCalendarForm(true);
        break;
      case 'devolutiva':
        const body: any = {
          id: item.vaga.id,
          devolutiva: !item.vaga.devolutiva,
        };
        sendUpdate('vagas/devolutiva', body, {
          naFila: false,
          devolutiva: item.vaga.devolutiva,
        });
        break;

      default:
        if (item.vaga.especialidades.length === 1) {
          const especialidade = item.vaga.especialidades[0];
          const body: any = {
            pacienteId: item.id,
            vagaId: item.vaga.id,
            id: item.vaga.id,
            agendar: !especialidade.agendado
              ? [especialidade.especialidadeId]
              : [],
            desagendar: especialidade.agendado
              ? [especialidade.especialidadeId]
              : [],
          };
          sendUpdate('vagas/agendar', body, { naFila: !item.vaga.naFila });
        } else {
          setPatient(item);
          formatCalendar(item);
          setOpenSchedule(true);
          setOpenCalendarForm(true);
        }
        break;
    }
  };

  const formatCalendar = (item: any) => {
    const format = {
      paciente: { nome: item.nome, id: item.id },
    };
    setPatient(item);
    setPatientFormatCalendar(format);
  };

  const handleScheduleResponse = (agendar: number[], desagendar: number[]) => {
    const body: any = {
      pacienteId: patient.id,
      vagaId: patient.vaga.id,
      id: patient.vaga.id,
      agendar: agendar,
      desagendar: desagendar,
    };

    setOpenSchedule(false);
    sendUpdate('vagas/agendar', body, { naFila: !patient.vaga.naFila });
  };

  const formtDate = (value: PacientsProps) => {
    const data = formtDatePatient(value);
    setPatient(data);
    setOpen(true);
  };

  const renderDropdown = useCallback(async () => {
    const list = await renderDropdownQueue(statusPacienteId.queue_therapy);
    setDropDownList(list);
  }, []);

  useEffect(() => {
    !hasPermition('FILA_TERAPIA_FILTRO_SELECT_AGENDADOS')
      ? handleSubmitFilter({ naFila: true })
      : renderPatient();
    renderDropdown();
  }, [renderPatient]);

  return (
    <div className="grid gap-8">
      <Filter
        id="form-filter-patient"
        legend="Filtro"
        fields={fields}
        screen="FILA_TERAPIA"
        onSubmit={handleSubmitFilter}
        onReset={renderPatient}
        loading={loading}
        dropdown={dropDownList}
        onInclude={() => {
          setPatient(null);
          setOpen(true);
        }}
      />

      <Card>
        <List
         loading={loading}
          type="complete"
          items={patients}
          screen="FILA_TERAPIA"
          onClick={handleSchedule}
          onClickLink={(pacient_: any) => {
            setPatient(pacient_);
            setOpenSchedule(true);
          }}
          onClickTrash={(pacient_: any) => {
            setPatient(pacient_);
            setOpenConfirm(true);
          }}
          onClickEdit={formtDate}
          onClickReturn={(pacient_: any) => {
            setPatient(pacient_);
            setOpenConfirm(true);
          }}
        />
      </Card>

      <Modal
        title="Cadastro de Paciente"
        open={open}
        onClose={() => setOpen(false)}
      >
        <PatientForm
          onClose={async () => {
            const pacientes = await renderPacientes(
              statusPacienteId.queue_therapy
            );
            setDropDownList({ ...dropDownList, pacientes });
            renderPatient();
            setOpen(false);
          }}
          dropdown={dropDownList}
          value={patient}
          statusPacienteId={statusPacienteId.queue_therapy}
          fieldsCostant={patientTherapyFields}
        />
      </Modal>

      {openCalendarForm && (
        <Modal
          title="Agendamento"
          open={openCalendarForm}
          onClose={() => setOpenCalendarForm(false)}
          width="80vw"
        >
          <CalendarForm
            value={patientFormatCalendar}
            isEdit={false}
            statusPacienteId={statusPacienteId.queue_therapy}
            onClose={async (formValueState: any) => {
              sendUpdate(
                'vagas/agendar/especialidade',
                {
                  vagaId: patient.vaga.id,
                  especialidadeId: formValueState.especialidade.id,
                },
                { naFila: !patient.vaga.naFila }
              );

              renderPatient();
              setOpenCalendarForm(false);
            }}
          />
        </Modal>
      )}

      <Modal
        title="Selecione a(s) especialidade(s) agendada(s)"
        open={openSchedule}
        onClose={() => setOpenSchedule(false)}
      >
        <ScheduleForm
          onSubmit={handleScheduleResponse}
          especialidades={patient?.vaga?.especialidades}
        />
      </Modal>

      <Confirm
        title=""
        onAccept={handleDisabledUser}
        onReject={() => setOpenConfirm(false)}
        onClose={() => setOpenConfirm(false)}
        message={`Deseja realmente ${
          patient?.disabled ? 'ativar' : 'inativar'
        } o paciente ${patient?.nome}?`}
        icon="pi pi-exclamation-triangle"
        open={openConfirm}
      />
    </div>
  );
}
