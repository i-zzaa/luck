import { useEffect, useMemo, useState } from "react"
import { ButtonHeron, Card, Input } from "../components"
import { useLocation, useNavigate } from "react-router-dom"
import { sessionResumoFields } from "../constants/session";
import { useToast } from "../contexts/toast";
import { CONSTANTES_ROUTERS } from "../routes/OtherRoutes";
import { Controller, useForm } from "react-hook-form";
import { create, getList } from "../server";
import { formatdate } from "../util/util";
import { MultiStateCheckbox } from "primereact/multistatecheckbox";

const fields = sessionResumoFields;
const fieldsState: any = {};
fields.forEach((field: any) => (fieldsState[field.id] = ''));

export const Sessao = () => {
  const navigator = useNavigate()
  const [dropDownProgram, setDropDownProgram] = useState([])
  const options = [
    { value: true, icon: 'pi pi-check' },
    { value: false, icon: 'pi pi-times' }
];


  const { renderToast } = useToast();
  const location = useLocation();
  const { event } = location.state;

  
  const {
    handleSubmit,
    formState: { errors },
    control,
    setValue
  } = useForm<any>({ 
   });


  const renderProgram = useMemo(async () => {
    const data = await getList(`sessao/atividade/${event.paciente.id}`)
    setDropDownProgram(data.atividadeSessao)
  }, [])


  const onSubmitResumo = async (formValue: any) => {
    try {
      const payload: any =  {
        resumo          : formValue.resumo,
        calendarioId    : event.id,
        pacienteId    : event.paciente.id,
        sessao: JSON.stringify(dropDownProgram)
      }

      await create('sessao', payload)


      // navigator(`/${CONSTANTES_ROUTERS.CALENDAR}`);
      renderToast({
        type: 'success',
        title: 'Sucesso!',
        message: 'Resumo da sessão enviado!',
        open: true,
      })
    } catch (error) {
      renderToast({
        type: 'failure',
        title: 'Erro!',
        message: 'Falha ao enviar o resumo',
        open: true,
      });
    }
  };

  const renderHeader =  useMemo(() => {
    return  (
      <div className="text-primary font-base grid justify-start m-4 p-2 leading-4"> 
      <span className="font-base"> Sessão </span>
      <span className="font-bold">   { event.paciente.nome }  </span>
      
        <span className="text-gray-400 font-light text-sm font-inter"> { formatdate(event.dataInicio) }  </span>
      </div>
    )
  }, [])

  const renderContent = () => {
    return (
      <div className="p-4">
      {
        dropDownProgram.map((program: any, programKey: number) => (
          <>
          <span className="text-md text-gray-400" key={programKey}>{ program.label }</span>
            <div>
              {
                program.children.map((task: any, index: number) => (
                  <Card key={index}>
                    <span className="text-base text-primary">{ task.label }</span>
                    <div className="flex gap-2 p-2">
                       {
                        task.loop.map((value: any, key: number)=> {
                          const loop =  program.children[index].loop
                          const disabled = key >= 3 &&  loop[key - 1] && loop[key - 2] && loop[ key - 3]

                          return (
                            <Controller  key={key} name="atividade"  control={control} render={({ field }) => (
                              <div  key={field.name}  className="grid justify-center text-center text-sm text-gray-400">
                                <label htmlFor={field.name} > { key } </label>
                                <MultiStateCheckbox  disabled={disabled} value={value} onChange={() => {
                                  const program: any = [...dropDownProgram]
                                  let current =  loop[key]

                                  switch (current) {
                                    case true:
                                      current = false
                                      break;
                                    case false:
                                      current = 'no value'
                                      break;
                                    default:
                                      current = true
                                      break;
                                  }
                                  program[programKey].children[index].loop[key] = current

                                  setDropDownProgram(program)

                                }} ref={field.ref} options={options} optionValue="value"  />
                              </div>
                            )}
                          />
                          )
                        })
                       }
                    </div>
                  </Card>
                ))
              }
            </div>
          </>
        ))
      }

      {fields.map((item: any) => (
        <Input
          key={item.id}
          id={item.id}
          type={item.type}
          labelText={item.labelText}
          control={control}
          validate={item.validate}
          errors={errors}
        />
      ))}
    </div>
    )
  }
  
  const renderFooter = () => {
    return (
      <div className="fixed bottom-0 w-[104vw] ml-[-0.5rem]">
        <ButtonHeron
          text="Salvar sessão"
          icon="pi pi-check"
          type="primary"
          color="white"
          size="full"
          onClick={handleSubmit(onSubmitResumo)}
        />
      </div>
    )
  }

  useEffect(() => {
    renderProgram
  }, [])

  return (
    <>
      {renderHeader}
      {renderContent()}
      {renderFooter()}
    </>
  )
}