import { ButtonHeron, Input } from '../components/index';
import { useForm } from 'react-hook-form';

interface EspecialidadeProps {
  id: number;
  nome: string;
}
interface EspecialidadesInfoProps {
  agendado: boolean;
  especialidadeId: number;
  vagaId: number;
  especialidade: EspecialidadeProps;
}

interface Props {
  onSubmit: (agendar: number[], desagendar: number[]) => void;
  especialidades: EspecialidadesInfoProps[];
}

export const ScheduleForm = ({ especialidades, onSubmit }: Props) => {
  const {
    handleSubmit,
    formState: { errors },
    control,
    setValue,
  } = useForm();

  const handleProvSubmit = (checkEspecialidades: any) => {
    const agendar: Array<number> = [];
    const desagendar: Array<number> = [];
    Object.keys(checkEspecialidades).map((item: any) => {
      if (checkEspecialidades[item]) {
        agendar.push(parseInt(item));
      } else {
        desagendar.push(parseInt(item));
      }
    });
    return onSubmit(agendar, desagendar);
  };

  return (
    <form
      action="#"
      onSubmit={handleSubmit(handleProvSubmit)}
      id="form-cadastro-patient"
    >
      <div className="grid  justify-evenly">
        <div className=" mb-10">
          {especialidades.map((field: EspecialidadesInfoProps) => {
            setValue(`${field.especialidade.id}`, field.agendado);

            return (
              <Input
                key={field.especialidade.id}
                labelText={field.especialidade.nome}
                id={`${field.especialidade.id}`}
                type="switch"
                errors={errors}
                control={control}
                // value={field.agendado}
                customCol="teste "
              />
            );
          })}
        </div>
      </div>

      <ButtonHeron
        text="Agendado"
        type="primary"
        size="full"
        onClick={handleSubmit(handleProvSubmit)}
      />
    </form>
  );
};
