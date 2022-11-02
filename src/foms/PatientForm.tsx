import { useEffect, useState } from "react";
import { patientFields } from "../constants/formFields";
import { useToast } from "../contexts/toast";
import { create, update } from "../server";

import { useForm } from "react-hook-form";
import { ButtonHeron, Input } from "../components/index";
import { setColorChips } from "../util/util";
import { useDropdown } from "../contexts/dropDown";
import moment from "moment";

const fieldsCostant = patientFields;
interface OptionProps {
  id: string;
  nome: string;
}

interface Props {
  onClose: () => void;
  dropdown: any,
  value: any;
  screen: string;
}

//userFields
const fieldsState: any = {};
fieldsCostant.forEach((field: any) => (fieldsState[field.id] = ""));

export default function PatientForm({
  onClose,
  dropdown,
  value,
  screen
}: Props) {
  const [loading, setLoaging] = useState<boolean>(false);
  const { renderToast } = useToast();
  const [fields, setFields] = useState(fieldsCostant)
  const [hidden, setHidden] = useState<boolean>(true);

  const isEdit = !!value?.nome

  const defaultValues = value || {
    nome: "",
    dataNascimento: "",
    telefone: "",
    responsavel: "",
    periodoId: "",
    convenioId: "",
    statusId: "",
    dataContato: "",
    especialidades: [],
    tipoSessaoId: "",
    observacao: "",
  };

  const {
    reset,
    handleSubmit,
    setValue,
    formState: { errors },
    control,
  } = useForm({ defaultValues });


  const handleChange = async (e:any, input: string) => {
    switch (true) {
      case input === 'statusId' && e.nome === 'Voltou ABA' && isEdit:
        setHidden(false)

        if (!value?.dataVoltouAba) {
          const date = moment(new Date).format('YYYY-MM-DD')
          setValue('dataVoltouAba', date)
        }
        break;
      default:
        break;
    }
  }

  const onSubmit = async (body: any) => {
    setLoaging(true);
    try {
      let data;
      const formatValues = {
        ...body,
        periodoId: body.periodoId.id,
        convenioId: body.convenioId.id,
        statusId: body.statusId.id,
        tipoSessaoId: body.tipoSessaoId.id,
        especialidades: body.especialidades.map((item: OptionProps) => item.id),
        emAtendimento: screen === 'emAtendimento'
      };

      if (isEdit) {
        formatValues.id = value.id;
        data = await update("pacientes", formatValues);
      } else {
        data = await create("pacientes", formatValues);
      }

      reset();
      setLoaging(false);
      renderToast({
        type: "success",
        title: "",
        message: data?.data.message,
        open: true,
      });

      return onClose();
    } catch (error) {
      setLoaging(false);
      renderToast({
        type: "failure",
        title: "401",
        message: "Não cadastrado!",
        open: true,
      });
    }
  };
  
  useEffect(() => {
    value?.nome &&  setColorChips()
  }, [value])

  useEffect(() => {
    const excludesCrud = ['periodos', 'status', 'dataContato']
    let list = []
    switch (screen) {
      case 'emAtendimento':
        list = fields.filter((item: any) => !excludesCrud.includes(item.name))
        setFields(list)
        break;
    
      default:
        break;
    }
  }, [value])

  useEffect(() => {
    if (isEdit) {
      handleChange( value?.statusId, 'statusId')
    }
  }, [])

  return (
    <form
      action="#"
      onSubmit={handleSubmit(onSubmit)}
      id="form-cadastro-patient"
    >
      <div className="grid grid-cols-6 gap-4 mb-4 min-h-[300px] overflow-y-auto">
        {fields.map((field) => (
          <Input
            key={field.id}
            labelText={field.labelText}
            id={field.id}
            type={field.type}
            customCol={field.customCol}
            errors={errors}
            validate={!!field.validate ? field.validate : !hidden && {required: "Campo obrigatório!"} }
            control={control}
            onChange={(e:any)=> handleChange(e, field.id)}
            hidden={field.hidden && hidden }
            options={
              field.type === "select" || field.type === "multiselect"
                ? dropdown[field.name]
                : undefined
            }
          />
        ))}
      </div>

      <ButtonHeron
        text={isEdit ? "Atualizar" : "Cadastrar"}
        type={isEdit ? "second" : "primary"}
        size="full"
        onClick={handleSubmit(onSubmit)}
        loading={loading}
      /> 
    </form>
  );
}
