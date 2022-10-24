import { useCallback, useEffect, useState } from "react";
import { userFields } from "../constants/formFields";
import { create, dropDown, update } from "../server";
import { useToast } from "../contexts/toast";
import { useForm } from "react-hook-form";
import { ButtonHeron, Input } from "../components/index";

const _fields = userFields;
interface OptionProps {
  id: string;
  nome: string;
}

interface Props {
  onClose: () => void;
  value: any;
}

//userFields
const fieldsState: any = {};
_fields.forEach((field: any) => (fieldsState[field.id] = ""));

export default function UsuarioForm({ onClose, value }: Props) {
  const [loading, setLoaging] = useState<boolean>(false);
  const [fields, setFields] = useState(_fields)

  const [perfies, setPerfies] = useState<OptionProps[]>([]);
  const { renderToast } = useToast();
  const defaultValues = value || {
    nome: "",
    login: "",
    senha: "",
    perfilId: "",
  };

  const {
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm({ defaultValues });


  const onSubmit = async (userState: any) => {
    try {
      setLoaging(true)

      let data;
      const formatValues = {
        ...userState,
        perfilId: userState.perfilId.id,
      };

      if (value?.nome) {
        formatValues.id = value.id;
        data = await update("usuarios", formatValues);
      } else {
        data = await create("usuarios", formatValues);
      }

      reset();
      renderToast({
        type: "success",
        title: "",
        message: data.data.message,
        open: true,
      });
      setLoaging(false)
      return onClose();
    } catch ({ message }: any) {
      renderToast({
        type: "failure",
        title: "401",
        message: `${message}`,
        open: true,
      });
      setLoaging(false)
      return;
    }
  };

  const renderPerfil = useCallback(async () => {
    const perfilState: OptionProps[] = await dropDown("perfil");
    setPerfies(perfilState);
  }, []);

  useEffect(() => {
    if (value?.nome) {
      const filter = fields.filter((item:any) => item.id !== 'senha')
      setFields(filter)
    }
    renderPerfil();
  }, [renderPerfil]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} action="#">
      <div>
        {fields.map((field) => (
          <Input
            key={field.id}
            labelText={field.labelText}
            id={field.id}
            type={field.type}
            options={field.type === "select" && perfies}
            validate={field.validate}
            errors={errors}
            control={control}
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
