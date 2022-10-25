//userFields
import moment from "moment";
moment.locale('pt-br')
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ButtonHeron, Input } from "../components";
import { SelectButtonComponent } from "../components/selectButton";
import { calendarFields } from "../constants/formFields";
import { dropDown, getList } from "../server";

const fields = calendarFields;
const fieldsState: any = {};
fields.forEach((field: any) => (fieldsState[field.id] = ""));

interface OptionProps {
  id: string;
  nome: string;
}

export const CalendarForm = ({ value, onClose }: any) => {
  const [dropDownList, setDropdow] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);


  const defaultValues = {
    data: "",
    start:"",
    end: "",
    repeticao: "",
    repetDays: [],
    pacienteId: "",
    especialidadeId: "",
    modalidadeId: "",
    terapeutaId: "",
    funcaoId: "",
    localidadeId: "",
    frequenciaId: "",
    statusEventoId: "",
    observacao: "",
  };

  const weekOption = [
    {nome: 'S', value: 1},
    {nome: 'T', value: 2},
    {nome: 'Q', value: 3},
    {nome: 'Q', value: 4},
    {nome: 'S', value: 5},
];

  const {
    getValues,
    setValue,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm({ defaultValues });

  const onSubmit = async (body: any) => {
    setLoading(true)
    console.log(body);
    setLoading(false)

  };

  const renderTerapeutas = async () => {
    const response: any = await getList("/usuarios/terapeutas");
    const arr = Object.values(response).map((values: any) => values);
    setDropdow({...dropDownList, terapeutas: arr});
  };

  const renderDropDownEspecialidade = async () => {
    const arr: OptionProps[] = await dropDown("especialidade");
    setDropdow({...dropDownList, especialidades: arr});
  };

  const renderDropDownFuncao = async () => {
    const arr: OptionProps[] = await dropDown("funcao");
    setDropdow({...dropDownList, funcoes: arr});
  };

  const renderDropDownLocalidade = async () => {
    const arr: OptionProps[] = await dropDown("localidade");
    setDropdow({...dropDownList, localidades: arr});
  };

  const renderDropDownPaciente = async () => {
    const arr: OptionProps[] = await dropDown("paciente");
    setDropdow({...dropDownList, pacientes: arr});
  };

  useEffect(() => {
    renderDropDownEspecialidade();
    renderDropDownPaciente();
    renderTerapeutas();
  }, []);

  return (
    <form
      action="#"
      onSubmit={handleSubmit(onSubmit)}
      id="form-cadastro-agendamento"
    >
      <div className="grid grid-cols-6 gap-4 mb-8 min-h-[300px] overflow-y-auto">
          <Input
            labelText="Data"
            id="data"
            type="date"
            customCol="col-span-6 sm:col-span-2"
            errors={errors}
            control={control}
            validate={{
              required: true,
            }}
          />
          <Input
            labelText="Horario Inincial"
            id="start"
            type="time"
            customCol="col-span-6 sm:col-span-2"
            errors={errors}
            control={control}
            onChange={(value: any)=> {
              const start = getValues('start')
              const time = moment.duration(start);
              const startCalc: any = time.add(1, 'hours');

              const hours = (startCalc?._data?.hours).toLocaleString('pt-Br', {
                minimumIntegerDigits: 2, 
                useGrouping: false
              })

              const end = `${hours}:${startCalc?._data?.minutes}:00`;
              setValue('end', end)
            }}
            validate={{
              required: true,
            }}
          />
          <Input
            labelText="Horario Final"
            id="end"
            type="time"
            customCol="col-span-6 sm:col-span-2"
            errors={errors}
            control={control}
            validate={{
              required: true,
            }}
          />

        <Input
            labelText="Paciente"
            id="paciente"
            type="select"
            customCol="col-span-6 sm:col-span-6"
            errors={errors}
            control={control}
            validate={{
              required: true,
            }}
          />

        <Input
          labelText="Modalidade"
          id="modalidadade"
          type="select"
          customCol="col-span-6 sm:col-span-3"
          errors={errors}
          control={control}
          validate={{
            required: true,
          }}
        />

        <Input
          labelText="Especialidade"
          id="especialidade"
          type="select"
          customCol="col-span-6 sm:col-span-3"
          errors={errors}
          control={control}
          validate={{
            required: true,
          }}
        />  

        <Input
          labelText="Terapeuta"
          id="terapeuta"
          type="select"
          customCol="col-span-6 sm:col-span-3"
          errors={errors}
          control={control}
          validate={{
            required: true,
          }}
        />  

        <Input
          labelText="Função"
          id="funcao"
          type="select"
          customCol="col-span-6 sm:col-span-3"
          errors={errors}
          control={control}
          validate={{
            required: true,
          }}
        />  


        <Input
          labelText="Local"
          id="localidade"
          type="select"
          customCol="col-span-6 sm:col-span-3"
          errors={errors}
          control={control}
          validate={{
            required: true,
          }}
        />  

        <Input
          labelText="Status"
          id="staus_evento"
          type="select"
          customCol="col-span-6 sm:col-span-3"
          errors={errors}
          control={control}
          validate={{
            required: true,
          }}
        />

        <Input
          labelText="Frequência"
          id="tipoRepeticao"
          type="select"
          customCol="col-span-6 sm:col-span-3"
          errors={errors}
          control={control}
          validate={{
            required: true,
          }}
        />  

      <div className="col-span-6 sm:col-span-3">
        <SelectButtonComponent id="calendar" title="Dias da semana" options={weekOption} control={control} />
      </div>


      <Input
          labelText="Observação"
          id="obeservacao"
          type="textarea"
          customCol="col-span-6 sm:col-span-6"
          errors={errors}
          control={control}
          validate={{
            required: true,
          }}
        />  
  
      </div>




      <ButtonHeron
        text="Agendar"
        type="primary"
        size="full"
        onClick={handleSubmit(onSubmit)}
        loading={loading}
      /> 
    </form>
  );
};