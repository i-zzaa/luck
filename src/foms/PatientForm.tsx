import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useToast } from "../contexts/toast";
import { create, update } from "../server";
import { ButtonHeron, Input } from "../components/index";
import { setColorChips } from "../util/util";

export interface OptionProps {
  id: string;
  nome: string;
}

interface Props {
  onClose: () => void;
  dropdown: any,
  value: any;
  statusPacienteId: number;
  fieldsCostant: any;
}

export interface PacientsProps {
  id: string;
  nome: string;
  responsavel: string;
  telefone: string;
  dataNascimento: string;
  convenio: string;
  vaga: any;
  status: OptionProps;
  tipoSessao: OptionProps;
}

export const PatientForm = ({
  onClose,
  dropdown,
  value,
  statusPacienteId,
  fieldsCostant
}: Props) => {
  const [loading, setLoaging] = useState<boolean>(false);
  const { renderToast } = useToast();
  const [fields, setFields] = useState(fieldsCostant);

  const isEdit = !!value?.nome
  const defaultValues = value || {};

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
      const formatValues = statusPacienteId === 1 ? 
      {
        ...body,
        periodoId: body.periodoId.id,
        convenioId: body.convenioId.id,
        statusId: body.statusId.id,
        tipoSessaoId: body.tipoSessaoId.id,
        especialidades: body.especialidades.map((item: OptionProps) => item.id),
        statusPacienteId: statusPacienteId
      } : 
      {
        ...body,
        periodoId: body?.periodoId ? body?.periodoId.id : 3, // padrao 3 de integral
        convenioId: body.convenioId.id,
        statusId: body?.statusId ? body?.statusId.id : 1, // padrao 1 de padrao
        tipoSessaoId: 2,
        especialidades: body.especialidades.map((item: OptionProps) => item.id),
        statusPacienteId: statusPacienteId
      }

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
    const fieldsFormat = fieldsCostant;
    const fieldsState: any = {};
    fieldsFormat.forEach((field: any) => (fieldsState[field.id] = ""));
    setFields(fieldsFormat)
  }, [])

  return (
    <form
      action="#"
      onSubmit={handleSubmit(onSubmit)}
      id="form-cadastro-patient"
    >
      <div className="grid grid-cols-6 gap-4 mb-4 min-h-[300px] overflow-y-auto">
        {fields.map((field: any) => (
          <Input
            key={field.id}
            labelText={field.labelText}
            id={field.id}
            type={field.type}
            customCol={field.customCol}
            errors={errors}
            validate={field.validate }
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
        text={isEdit ? "Atualizar" : "Cadastrar"}
        type={isEdit ? "second" : "primary"}
        size="full"
        onClick={handleSubmit(onSubmit)}
        loading={loading}
      /> 
    </form>
  );
}