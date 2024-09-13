import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ButtonHeron, Input } from '../components/index';
import { create, dropDown, filter, update } from '../server';
import { Fieldset } from 'primereact';
import { TIPO_PROTOCOLO } from '../constants/protocolo';

interface FormProps {
  atividadeId: any;
  pacienteId: any;
  tipoId: any;
  faixaEtariaId: any;
}

export default function PortageCadastro( { paciente}: { paciente: { id: number, nome: string}}) {
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

  const getProtocolo = async() => {
    const { data }: any = await filter('protocolo', {
      pacienteId: paciente.id,
      protocoloId: TIPO_PROTOCOLO.portage
    })

    setList(data);
  }

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

  useEffect(() => {
    getProtocolo()
  }, [paciente])

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="h-[90vh] flex flex-col overflow-y-auto">
        <div className="mt-4">
          <div className="grid grid-cols-12 gap-2 m-4 mb-8 items-center">
            <span className="col-span-12 text-gray-400 font-inter leading-4">
              Inclua os Grupos
            </span>
            <Input
              key="portage-tipo"
              labelText="Tipo Portage"
              id="tipoId"
              type="select"
              customCol="col-span-6"
              control={control}
              options={dropDownList.tipoPortage}
            />
            <Input
              key="portage-faixa-etaria"
              labelText="Faixa Etária"
              id="faixaEtariaId"
              type="select"
              customCol="col-span-6"
              control={control}
              options={dropDownList.faixaEtaria}
            />
            <div className="col-span-12">
              <ButtonHeron
                text="Adicionar"
                icon="pi pi-plus"
                type="primary"
                size="full"
                onClick={addMeta}
                typeButton="button"
              />
            </div>
          </div>

          {list.map((item, index) => (
            <Fieldset
              key={index}
              legend={handleTemplateHeader(item, index)}
              className="mb-2"
              toggleable
            >
              
              <Input
                key={`atividade-${index}`}
                labelText="Atividade"
                id="atividadeId"
                type="select-add"
                control={control}
                options={dropDownList.atividade}
                buttonAdd
                onClick={() => addSubitem(index)}
              />
              <ul>
                {item.atividades.map((subitem: any, subIndex: number) => (
                  <li key={subIndex} className="flex font-inter text-sm items-center">
                    <ButtonHeron
                      text="Remover"
                      icon="pi pi-trash"
                      type="transparent"
                      color="red"
                      size="icon"
                      onClick={() => removeSubitem(index, subIndex)}
                      typeButton="button"
                    />
                    <span>{subitem?.nome || 'Atividade'}</span>
                  </li>
                ))}
              </ul>
            </Fieldset>
          ))}
        </div>

        <div className="mt-auto">
          <ButtonHeron
            text="Salvar"
            type="primary"
            size="full"
            onClick={handleSubmit(onSubmit)}
            loading={loading}
            disabled={!list.length}
          />
        </div>
      </div>
    </form>
  );
}
