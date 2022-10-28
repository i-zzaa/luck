//userFields
import moment from "moment";
moment.locale('pt-br')
import {  useState } from "react";
import { useForm } from "react-hook-form";
import { ButtonHeron, Input } from "../components";
import { SelectButtonComponent } from "../components/selectButton";
import { create, update } from "../server";

export const CalendarForm = ({ value, onClose, dropDownList }: any) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [hasFrequencia, setHasFrequencia] = useState<boolean>(false);

  const defaultValues = value || {
    dataInicio: "",
    dataFim: "",
    start:"",
    end: "",
    paciente: "",
    especialidade: "",
    modalidade: "",
    terapeuta: "",
    funcao: "",
    localidade: "",
    frequencia: "",
    statusEventos: "",
    diasFrequencia: [],
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


  const onSubmit = async (formValueState: any) => {
    try {
      setLoading(true)

      let data;
      if (value?.id) {
        formValueState.id = value.id;
        data = await update('evento', formValueState);
      } else {
        data = await create('evento', formValueState);
      }

      onClose()
      renderToast({
        type: "success",
        title: "",
        message: data.data.message,
        open: true,
      });
      setLoading(false)
    } catch ({ message }: any) {
      renderToast({
        type: "failure",
        title: "401",
        message: `${message}`,
        open: true,
      });
      setLoading(false)
      return;
    }
  };

  return (
    <form
      action="#"
      onSubmit={handleSubmit(onSubmit)}
      id="form-cadastro-agendamento"
    >
      <div className="grid grid-cols-6 gap-4 mb-8 min-h-[300px] overflow-y-auto">
          <Input
            labelText="Data"
            id="dataInicio"
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

              const minutes = (startCalc?._data?.minutes).toLocaleString('pt-Br', {
                minimumIntegerDigits: 2, 
                useGrouping: false
              })

              const end = `${hours}:${minutes}`;
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
            options={dropDownList?.pacientes}
            validate={{
              required: true,
            }}
          />

        <Input
          labelText="Modalidade"
          id="modalidade"
          type="select"
          customCol="col-span-6 sm:col-span-3"
          errors={errors}
          control={control}
          options={dropDownList?.modalidades}
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
          options={dropDownList?.especialidades}
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
          options={dropDownList?.terapeutas}
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
          options={dropDownList?.funcoes}
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
          options={dropDownList?.localidades}
          validate={{
            required: true,
          }}
        />  

        <Input
          labelText="Status Eventos"
          id="statusEventos"
          type="select"
          customCol="col-span-6 sm:col-span-3"
          errors={errors}
          control={control}
          options={dropDownList?.statusEventos}
          validate={{
            required: true,
          }}
        />

        <Input
          labelText="Frequência"
          id="frequencia"
          type="select"
          customCol="col-span-6 sm:col-span-3"
          errors={errors}
          control={control}
          options={dropDownList?.frequencias}
          onChange={(e: any)=> setHasFrequencia(e.nome === 'Semanal')}
          validate={{
            required: true,
          }}
        />  

      {hasFrequencia && (<div className="col-span-6 sm:col-span-3">
        <SelectButtonComponent 
        id="diasFrequencia" 
        title="Dias da semana" 
        options={weekOption} 
        control={control}
        rules={{
          required: !!getValues('frequencias'),
        }} 
        />
      </div>)}

      <Input
          labelText="Observação"
          id="observacao"
          type="textarea"
          customCol="col-span-6 sm:col-span-6"
          errors={errors}
          control={control}
          validate={{
            required: false,
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

function renderToast(arg0: { type: string; title: string; message: any; open: boolean; }) {
  throw new Error("Function not implemented.");
}
