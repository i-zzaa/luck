//userFields
import moment from "moment";
moment.locale('pt-br')
import {  useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ButtonHeron, Input, Title } from "../components";
import { SelectButtonComponent } from "../components/selectButton";
import { useDropdown } from "../contexts/dropDown";
import { useToast } from "../contexts/toast";
import { create, update } from "../server";

export const CalendarForm = ({ value, onClose }: any) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [hasFrequencia, setHasFrequencia] = useState<boolean>(false);
  const [isAvaliacao, setIsAvalicao] = useState<boolean>(false);
  const { renderToast } = useToast();


  const [dropDownList, setDropDownList] = useState<any>([]);
 
  const { renderDropdownCalendario, renderEspecialidadeTerapeuta, renderTerapeutaFuncao } = useDropdown()
  
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


  const {
    getValues,
    setValue,
    handleSubmit,
    formState: { errors },
    control,
    trigger
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

  const filtrarDropDown = async(value: any, type: string) => {
    let list: any = []
    switch (type) {
      case 'especialidade-terapeuta':
        list = await renderEspecialidadeTerapeuta(value)
        setDropDownList({ ...dropDownList, terapeutas: list })
        break;
      case 'terapeuta-funcao':
        list = await renderTerapeutaFuncao(value)
        setDropDownList({ ...dropDownList, funcoes: list })
        break;
    
      default:
        break;
    }
  }

  const rendeFiltro = useMemo(async() => {
    const list = await renderDropdownCalendario()
    setDropDownList(list)
  }, [])

  
  useEffect(() => {
    rendeFiltro
  }, []);

  return (
    <form
      action="#"
      onSubmit={handleSubmit(onSubmit)}
      id="form-cadastro-agendamento"
    >
      <div className="grid grid-cols-6 gap-4 mb-8 overflow-y-auto">
        <Input
          labelText="Modalidade"
          id="modalidade"
          type="select"
          customCol={`col-span-6 ${isAvaliacao ? 'sm:col-span-2' : 'sm:col-span-3'}`}
          errors={errors}
          control={control}
          options={dropDownList?.modalidades}
          onChange={(e: any)=> {

            trigger('dataFim',  { shouldFocus: true })
            setIsAvalicao(e.nome === 'Avaliação')
          }}
          validate={{
            required: true,
          }}
        />
        <Input
          labelText="Data"
          id="dataInicio"
          type="date"
          customCol={`col-span-6 ${isAvaliacao ? 'sm:col-span-2' : 'sm:col-span-3'}`}
          errors={errors}
          control={control}
          validate={{
            required: true,
          }}
        />

        {isAvaliacao && (<Input
            labelText="Data Final"
            id="dataFim"
            type="date"
            customCol="col-span-6 sm:col-span-2"
            errors={errors}
            control={control}
            validate={{
              required: true,
            }}
          />)}

          <Input
            labelText="Horario Inicial"
            id="start"
            type="time"
            customCol={`col-span-6 ${hasFrequencia ? 'sm:col-span-3' : 'sm:col-span-2'}`}
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
            customCol={`col-span-6 ${hasFrequencia ? 'sm:col-span-3' : 'sm:col-span-2'}`}
            errors={errors}
            control={control}
            validate={{
              required: true,
            }}
          />

        <Input
          labelText="Frequência"
          id="frequencia"
          type="select"
          customCol={`col-span-6 ${hasFrequencia ? 'sm:col-span-2' : 'sm:col-span-2'}`}

          errors={errors}
          control={control}
          options={dropDownList?.frequencias}
          onChange={(e: any)=> setHasFrequencia(e.nome === 'Semanal')}
          validate={{
            required: true,
          }}
        />  

        {hasFrequencia && (
          <Input
            labelText="Intervalo"
            id="intervalo"
            type="select"
            customCol="col-span-6 sm:col-span-2"
            errors={errors}
            control={control}
            options={dropDownList?.intervalos}
            // onChange={(e: any)=> setHasFrequencia(e.nome === 'Semanal')}
            validate={{
              required: true,
            }}
          />  
        )}

        {hasFrequencia && (
          <div className="col-span-6 sm:col-span-2">
            <SelectButtonComponent 
            id="diasFrequencia" 
            title="Dias da semana" 
            options={dropDownList?.diasFrequencia} 
            control={control}
            rules={{
              required: !!getValues('frequencias'),
            }} 
            />
          </div>
        )}

        <div className="col-span-6"></div>
        <div className="col-span-6">
          <Title size="md" color="violet"> Informações Para Consulta</Title>
        </div>

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
          labelText="Especialidade"
          id="especialidade"
          type="select"
          customCol="col-span-6 sm:col-span-2"
          errors={errors}
          control={control}
          options={dropDownList?.especialidades}
          onChange={(e: any)=>filtrarDropDown(e.nome, 'especialidade-terapeuta')}
          validate={{
            required: true,
          }}
        />  
        <Input
          labelText="Terapeuta"
          id="terapeuta"
          type="select"
          customCol="col-span-6 sm:col-span-2"
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
          customCol="col-span-6 sm:col-span-2"
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