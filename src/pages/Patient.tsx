import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  dropDown,
  filter,
  getList,
  update,
} from "../server";

import { useToast } from "../contexts/toast";
import { COORDENADOR, permissionAuth } from "../contexts/permission";
import { Card, Confirm, Filter, Modal, List } from "../components/index";
import { filterPatientFields } from "../constants/formFields";
import PatientForm from "../foms/PatientForm";
import { ScheduleForm } from "../foms/ScheduleForm";
import { useDropdown } from "../contexts/dropDown";

const fieldsConst = filterPatientFields;

//userFields
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ""));

export interface PacientsProps {
  id: string;
  nome: string;
  responsavel: string;
  telefone: string;
  dataNascimento: string;
  convenio: string;
  vaga: any;
}

interface OptionProps {
  id: string;
  nome: string;
}

export default function Patient() {
  const { perfil } = permissionAuth();
  const [fields, setFields] = useState(fieldsConst);

  const [patients, setPatients] = useState<PacientsProps[]>([]);
  const [patient, setPatient] = useState<any>();

  const [open, setOpen] = useState<boolean>(false);
  const [openSchedule, setOpenSchedule] = useState<boolean>(false);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [dropDownList, setDropDownList] = useState<any>([]);
  const { renderToast } = useToast();

  const { renderPacientes, renderDropdownPatientCrud } = useDropdown()

  const renderPatient = useMemo(async () => {
    setPatients([]);
    const pacientes = await getList("pacientes?emAtendimento=true");
    setPatients(pacientes);
  }, []);

  const handleDisabledUser = async () => {
    setOpenConfirm(false);
    try {
      const response = await update("paciente/desabilitar", {
        id: patient.id,
        disabled: !patient.disabled,
      });
      handleSubmitFilter({ disabled: patient.disabled });
      renderToast({
        type: "success",
        title: response.data.message,
        message: response.data.data,
        open: true,
      });
    } catch (error) {
      renderToast({
        type: "failure",
        title: "Erro!",
        message: "Não foi possível excluí-lo",
        open: true,
      });
    }
  };

  const handleSubmitFilter = async (formState: any) => {
    setLoading(true)
    const format: any = {
      naFila: formState.naFila === undefined ? true : !formState.naFila,
      disabled:  formState.disabled === undefined ? false : formState.disabled,
      devolutiva:  formState.devolutiva === undefined ? false : formState.devolutiva,
      emAtendimento: true
    };
    delete formState.naFila;
    delete formState.disabled;
    delete formState.devolutiva;

    await Object.keys(formState).map((key: any) => {
      format[key] = formState[key]?.id || undefined;
    });

    const response = await filter("pacientes", format);
    const lista: PacientsProps[] = response.status === 200 ? response.data : [];
    setPatients(lista);
    setLoading(false)
  };

  const sendUpdate = async (url: string, body: any, filter: any) => {
    try {
      await update(url, body);
      setOpenSchedule(false)
      handleSubmitFilter(filter);
    } catch ({ response }: any) {
      renderToast({
        type: "failure",
        title: "401",
        message: "Não foi possível agendá-lo!",
        open: true,
      });
    }
  };

  const handleSchedule = async ({item, typeButtonFooter}: any) => {
    if (typeButtonFooter === 'agendado') {
      if (item.vaga.especialidades.length === 1) {
        const especialidade = item.vaga.especialidades[0];
        const body: any = {
          pacienteId: item.id,
          vagaId: item.vaga.id,
          id: item.vaga.id,
          agendar: !especialidade.agendado ? [especialidade.especialidadeId] : [],
          desagendar: especialidade.agendado
            ? [especialidade.especialidadeId]
            : [],
        };
        sendUpdate("vagas/agendar", body, { naFila: !item.vaga.naFila });
      } else {
        setPatient(item)
        setOpenSchedule(true);
      }
    }else {
      const body: any = {
        id: item.vaga.id,
        devolutiva: !item.vaga.devolutiva,
      };
      sendUpdate("vagas/devolutiva", body, { naFila: false, devolutiva: item.vaga.devolutiva });
    }
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
    sendUpdate("vagas/agendar", body, { naFila: !patient.vaga.naFila });
  };


  const formtDate = (value: PacientsProps) => {
    const data = {
      id: value.id,
      nome: value.nome,
      dataNascimento: value.dataNascimento,
      telefone: value.telefone,
      responsavel: value.responsavel,
      periodoId: value.vaga.periodo,
      convenioId: value.convenio,
      statusId: value.vaga.status,
      dataContato: value.vaga.dataContato,
      especialidades: value.vaga.especialidades.map(
        (item: any) => {
          return {
            nome: item.especialidade.nome,
            id:item.especialidade.id
          }
        }
      ),
      tipoSessaoId: value.vaga.tipoSessao,
      observacao: value.vaga.observacao,
    };
    setPatient(data);
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (perfil === COORDENADOR) {
      const filterInput = fieldsConst.filter(
        (field) => field.id !== "disabled"
      );
      setFields(filterInput);
    }
  }, [perfil]);

  const renderAgendar =useCallback(async()=> {
    const list = await renderDropdownPatientCrud(true)
    setDropDownList(list)
  },[])

  useEffect(() => {
    perfil === COORDENADOR
      ? handleSubmitFilter({ naFila: true })
      : renderPatient;
      renderAgendar()
  }, [
    renderAgendar,
    renderPatient,
    perfil
  ]);

  return (
    <div className="grid gap-8">

      <Filter
        id="form-filter-patient"
        legend="Filtro"
        fields={fields}
        rule={perfil === COORDENADOR}
        onSubmit={handleSubmitFilter}
        onReset={()=> renderPatient}
        loading={loading}
        dropdown={dropDownList}
        onInclude={()=> {
          setPatient(null);
          setOpen(true)
        }}
      />
    
      <Card>
        <List  
          type="complete"
          items={patients}
          rule={perfil === COORDENADOR}
          onClick={handleSchedule}
          onClickLink={(pacient_: any)=> {
            setPatient(pacient_);
            setOpenSchedule(true)
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
          onClose={async() => {
            const pacientes = await renderPacientes(true)
            setDropDownList({...dropDownList, pacientes })

            renderPatient;
            setOpen(false);
          }}
          dropdown={dropDownList}
          value={patient}
          screen="emAtendimento"
        />
      </Modal>
      
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
        message={
          `Deseja realmente ${patient?.disabled ? "ativar" : "inativar"} o paciente ${patient?.nome}?`
        }
        icon="pi pi-exclamation-triangle"
        open={openConfirm}
      />	
    </div>
  );
}
