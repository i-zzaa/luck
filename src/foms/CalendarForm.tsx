//userFields
import moment from 'moment';
moment.locale('pt-br');
import {  useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ButtonHeron, Confirm, Input, Title } from "../components";
import { SelectButtonComponent } from "../components/selectButton";
import { useDropdown } from "../contexts/dropDown";
import { COORDENADOR, COORDENADOR_TERAPEUTA, permissionAuth, TERAPEUTA } from "../contexts/permission";
import { useToast } from "../contexts/toast";
import { create, update } from "../server";
import { confirmPopup } from 'primereact/confirmpopup';

export const CalendarForm = ({ value, onClose, isEdit,  statusPacienteId}: any) => {
  const { perfil } = permissionAuth();

  const isDisabled = perfil === COORDENADOR || perfil === COORDENADOR_TERAPEUTA || perfil === TERAPEUTA

  const [loading, setLoading] = useState<boolean>(false);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);

  const [hasFrequencia, setHasFrequencia] = useState<boolean>(false);
  const [isAvaliacao, setIsAvalicao] = useState<boolean>(false);
  const [isDevolutiva, setIsDevolutiva] = useState<boolean>(false);
  const { renderToast } = useToast();

  const [dropDownList, setDropDownList] = useState<any>([]);
  const [event, setEvent] = useState<any>([]);
 
  const { 
    renderDropdownQueueCalendar, 
    renderDropdownCalendario, 
    renderEspecialidadeTerapeuta, 
    renderTerapeutaFuncao, 
    renderPacienteEspecialidade 
  } = useDropdown()
  
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
    unregister ,
    handleSubmit,
    formState: { errors },
    control,
    trigger
  } = useForm({ defaultValues });


  const onSubmit = async (formValueState: any, changeAll: boolean | null) => {
    setOpenConfirm(false)
    try {
      if (value == defaultValues) {
        renderToast({
          type: "warning",
          title: "401",
          message: 'Não houve alteração no evento!',
          open: true,
        });
        return
      }

      setLoading(true)

      let data;
      if (isEdit) {
        formValueState.id = value.id;
        formValueState.changeAll = changeAll
        data = await update('evento', formValueState);
      } else {
        data = await create('evento', formValueState);
      }

      onClose(formValueState)
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

  const handleConfirm = (_event:any) => {
    if (isEdit && _event.frequencia.nome === 'Recorrente') {
      _event.dataAtual = value.dataAtual
      setEvent(_event)
      setOpenConfirm(true)
    } else {
      onSubmit(_event, null)
    }
  }

  const filtrarDropDown = async(_value: any, type: string) => {
    let list: any = []
    switch (type) {
      case 'paciente-especialidade':
        list = await renderPacienteEspecialidade(_value, statusPacienteId)
        setDropDownList({ ...dropDownList, especialidades: list })
        setValue('funcao', [])
        break;
      case 'especialidade-terapeuta':
        list = await renderEspecialidadeTerapeuta(_value)
        setDropDownList({ ...dropDownList, terapeutas: list })
        setValue('funcao', [])
        break;
      case 'terapeuta-funcao':
        list = await renderTerapeutaFuncao(_value)
        setDropDownList({ ...dropDownList, funcoes: list })
        break;
    
      default:
        break;
    }
  }

  const rendeFiltro = useCallback(async() => {
    let list = []
    switch (statusPacienteId) {
      case 3:
        list = await renderDropdownCalendario(statusPacienteId)
        break;
      default:
        list = await renderDropdownQueueCalendar(statusPacienteId, value.paciente.id)
        break;
    }
    setDropDownList(list)
  }, [])

  
  useEffect(() => {
    rendeFiltro()
  }, []);


  useEffect(() => {
    if (isEdit && value?.frequencia?.nome === 'Recorrente') {
      setHasFrequencia(true)
      setValue('dataInicio', value.dataAtual)
    }

    if (isEdit && value?.mododalidade?.nome === 'Avaliação') {
      setIsAvalicao(true)
    }
  }, []);

    
  return (
    <>
    <form
      action="#"
      onSubmit={handleSubmit(handleConfirm)}
      id="form-cadastro-agendamento"
    >
      <div className="grid grid-cols-6 gap-4 mb-8 overflow-y-auto">
        <Input
          labelText="Modalidade"
          id="modalidade"
          type="select"
          customCol={`col-span-6 ${(isAvaliacao || isEdit) ? 'sm:col-span-2' : 'sm:col-span-3'}`}
          errors={errors}
          control={control}
          options={dropDownList?.modalidades}
          onChange={(e: any)=> {

            trigger('dataFim',  { shouldFocus: true })
            setIsAvalicao(e.nome === 'Avaliação')
            setIsDevolutiva(e.nome === 'Devolutiva')

            if (e.nome === 'Avaliação') {
              setValue('frequencia', {id: 2, nome: 'Recorrente'})
              setValue('intervalo', {id: 1, nome: 'Todas Semanas'})
              setHasFrequencia(true)
            }

            if (e.nome === 'Devolutiva') {
              setHasFrequencia(false)
              unregister(['frequencia', 'intervalo'], {keepDirtyValues: true})
            }

          }}
          validate={{
            required: true,
          }}
          disabled={isDisabled}
        />
        <Input
          labelText="Data"
          id="dataInicio"
          type="date"
          customCol={`col-span-6 ${(isAvaliacao || isEdit) ? 'sm:col-span-2' : 'sm:col-span-3'}`}
          errors={errors}
          control={control}
          onChange={()=> {
            const frequencia = getValues('frequencia')
            if (frequencia.nome === 'Recorrente') {
              const dataInicio = getValues('dataInicio')
              const date = moment(dataInicio); // Thursday Feb 2015
              const dow = Number(date.day());
              
              setValue('diasFrequencia', [dow])
            }
          }}
          validate={{
            required: true,
          }}
          disabled={isDisabled}
        />

        {(isAvaliacao || isEdit) && (<Input
            labelText="Data Final"
            id="dataFim"
            type="date"
            customCol="col-span-6 sm:col-span-2"
            errors={errors}
            control={control}
            // validate={{
            //   required: true,
            // }}
            disabled={isDisabled}
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
            disabled={isDisabled}
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
            disabled={isDisabled}
          />

        {!isDevolutiva && (<Input
          labelText="Frequência"
          id="frequencia"
          type="select"
          customCol={`col-span-6 ${hasFrequencia ? 'sm:col-span-2' : 'sm:col-span-2'}`}

          errors={errors}
          control={control}
          options={dropDownList?.frequencias}
          onChange={(e: any)=> {
            setHasFrequencia(e.nome === 'Recorrente')
            if (e.nome === 'Recorrente') {
              const dataInicio = getValues('dataInicio')
              const date = moment(dataInicio); // Thursday Feb 2015
              const dow = Number(date.day());
              
              setValue('diasFrequencia', [dow])
            }
          }}
          validate={{
            required: true,
          }}
          disabled={isDisabled || isEdit}
        /> )} 

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
            disabled={isDisabled || isEdit}
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
            disabled={isDisabled || isEdit}
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
          onChange={(e: any)=>filtrarDropDown(e.id, 'paciente-especialidade')}

          validate={{
            required: true,
          }}
          disabled={isDisabled}
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
          disabled={isDisabled}
        />  
        <Input
          labelText="Terapeuta"
          id="terapeuta"
          type="select"
          customCol="col-span-6 sm:col-span-2"
          errors={errors}
          control={control}
          options={dropDownList?.terapeutas}
          onChange={(e: any)=>filtrarDropDown(e.id, 'terapeuta-funcao')}
          validate={{
            required: true,
          }}
          disabled={isDisabled}
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
          disabled={isDisabled}
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
          disabled={isDisabled}
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
        text={isEdit ? "Atualizar" : "Cadastrar"}
        type={isEdit ? "second" : "primary"}
        size="full"
        onClick={handleSubmit(handleConfirm)}
        loading={loading}
      /> 
    </form>


      <Confirm
        onAccept={()=> onSubmit(event, true)}
        onReject={() => onSubmit(event, false)}
        onClose={() => setOpenConfirm(false)}
        title="Evento(s)"
        message="Alterar eventos futuros ou apenas o atual?"
        icon="pi pi-exclamation-triangle"
        open={openConfirm}
        acceptLabel="Eventos Futuros"
        rejectLabel="Atual"
      />	
    </>
    
  );
};