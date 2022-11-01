import { useEffect, useState } from "react";
import { patientFields } from "../constants/formFields";
import { useToast } from "../contexts/toast";
import { create, update } from "../server";

import { useForm } from "react-hook-form";
import { ButtonHeron, Input } from "../components/index";
import { setColorChips } from "../util/util";
import { useDropdown } from "../contexts/dropDown";

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
    formState: { errors },
    control,
  } = useForm({ defaultValues });
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

      if (value?.nome) {
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
    const excludes = ['periodos', 'status']
    switch (screen) {
      case 'emAtendimento':
        const list = fields.filter((item: any) => !excludes.includes(item.name))
        setFields(list)
        break;
    
      default:
        break;
    }
  }, [value])


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
            validate={field.validate}
            control={control}
            options={
              field.type === "select" || field.type === "multiselect"
                ? dropdown[field.name]
                : undefined
            }
          />
        ))}
      </div>

      <ButtonHeron
        text={value?.nome ? "Atualizar" : "Cadastrar"}
        type={value?.nome ? "second" : "primary"}
        size="full"
        onClick={handleSubmit(onSubmit)}
        loading={loading}
      /> 
    </form>
  );
}
