import { useCallback, useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';
import { Input } from '../components/index';
import { ProtocoloFields } from '../constants/formFields';
import { dropDown } from '../server';
import { permissionAuth } from '../contexts/permission';
import { TIPO_PROTOCOLO } from '../constants/protocolo';
import PORTAGECADASTRO from './Portage';
import PEICADASTRO from './PEI';
import VBMapp from './VBMapp';


const fields = ProtocoloFields;
const fieldsState: any = {};
fields.forEach((field: any) => (fieldsState[field.id] = ''));


const OBJ = {id: '', nome: ''}

export default function Protocolo() {
  const { hasPermition } = permissionAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>([]);

  const {
    handleSubmit,
    control,
    watch
  } = useForm<any>({ 
    defaultValues: {
      protocoloId: OBJ,
      pacienteId: OBJ,
    }
  });

  const protocoloObj = watch('protocoloId')
  const pacienteObj = watch('pacienteId')

  const renderDropdown = useCallback(async () => {
    const [paciente, protocolo]: any = await Promise.all([
      dropDown('paciente'),
      dropDown('protocolo'),
    ])

    setDropDownList({
      paciente,
      protocolo
    })
  }, []);

  useEffect(() => {
    renderDropdown()
  }, []);

  return (
    <form className="mt-8" onSubmit={()=> {}} >
      {
        hasPermition('PEI_FILTRO_BOTAO_CADASTRAR') ? (
          <Input
            key="pacienteId"
            labelText='Paciente'
            id='pacienteId'
            type='select'
            customCol='col-span-6 sm:col-span-6'
            control={control}
            options={dropDownList.paciente}
           
          />
        ) : null
      }
      {
        hasPermition('PEI_FILTRO_BOTAO_CADASTRAR') ? (
          <Input
            key="protocoloId"
            labelText='Protocolo'
            id='protocoloId'
            type='select'
            customCol='col-span-6 sm:col-span-6'
            control={control}
            options={dropDownList.protocolo }
            disabled={!pacienteObj?.nome.length}
            // onChange={(e)=> getProtocolo(e.id)}
          />
        ) : null
      }

      { protocoloObj.id === TIPO_PROTOCOLO.portage && <PORTAGECADASTRO paciente={pacienteObj}/>}
      { protocoloObj.id === TIPO_PROTOCOLO.pei && <PEICADASTRO paciente={pacienteObj} />}
      { protocoloObj.id === TIPO_PROTOCOLO.vbMapp && <VBMapp  paciente={pacienteObj}/>}
   </form>
  );
}
