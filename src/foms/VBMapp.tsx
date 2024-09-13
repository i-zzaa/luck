import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ButtonHeron, Input } from '../components/index';
import { create, dropDown, update } from '../server';
import { Fieldset } from 'primereact';

interface FormProps {
  atividadeId: any;
  pacienteId: any;
  tipoId: any;
  faixaEtariaId: any;
}

export default function VBMapp( { paciente }: { paciente: { id: number, nome: string}}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>({
    atividade: [],
    tipoPortage: [],
    faixaEtaria: [],
  });
  const [list, setList] = useState<any[]>([]);

  const { handleSubmit, watch, control, reset } = useForm<FormProps>({
    defaultValues: {
      atividadeId: '',
      pacienteId: paciente,
      tipoId: '',
      faixaEtariaId: ''
    }
  });

  const faixaEtariaId = watch('faixaEtariaId');
  const tipoId = watch('tipoId');
  const atividadeId = watch('atividadeId');

  const renderDropdown = useCallback(async () => {
    try {
      const [atividade, tipoPortage, faixaEtaria] = await Promise.all([
        dropDown('protocolo/portage'),
        dropDown('protocolo/tipo-portage'),
        dropDown('protocolo/faixa-etaria'),
      ]);

      setDropDownList({ atividade, tipoPortage, faixaEtaria });
    } catch (error) {
      console.error("Error fetching dropdown data", error);
    }
  }, []);

  const addMeta = () => {
    setList((prevList) => [
      ...prevList,
      {
        tipoId,
        faixaEtariaId,
        atividades: [],
        pacienteId: paciente
      }
    ]);
  };

  const removeMeta = (index: number) =>   setList((prevList) => prevList.filter((_, i) => i !== index));

  const addSubitem = (index: number) => {
    setList((prevList) => {
      const updatedList = [...prevList];
      updatedList[index].atividades.push(atividadeId);
      return updatedList;
    });
  };

  const removeSubitem = (metaIndex: number, subitemIndex: number) => {
    setList((prevList) => {
      const updatedList = [...prevList];
      updatedList[metaIndex].atividades.splice(subitemIndex, 1);
      return updatedList;
    });
  };

  const onSubmit = async (formData: FormProps) => {
    setLoading(true);
    try {
      await create('protocolo/portage', list);
      reset();
    } catch (error) {
      console.error("Error saving form data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateHeader = (item: any, index: number) => {
    return (
      <div className='flex gap-2 items-center'>
        {item.tipoId?.nome || ''} {item.faixaEtariaId?.nome || ''}
        <ButtonHeron
          text="Remover"
          icon="pi pi-trash"
          type="transparent"
          color="red"
          size="icon"
          onClick={() => removeMeta(index)}
          typeButton="button"
        />
      </div>
    )
  }

  useEffect(() => {
    renderDropdown();
  }, [renderDropdown]);

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      
    </form>
  );
}
