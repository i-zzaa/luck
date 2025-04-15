import { useCallback, useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';
import { Input } from '../components/index';
import { ProtocoloFields } from '../constants/formFields';
import { dropDown } from '../server';
import { permissionAuth } from '../contexts/permission';
import { TIPO_PROTOCOLO } from '../constants/protocolo';
import PORTAGECADASTRO from './Portage';
import VBMapp from './VBMapp';
import { useLocation } from 'react-router-dom';
import PEICADASTRO from './pei';


const fields = ProtocoloFields;
const fieldsState: any = {};
fields.forEach((field: any) => (fieldsState[field.id] = ''));


const OBJ = {id: '', nome: ''}

export default function Protocolo() {
  const { hasPermition } = permissionAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>([]);

  const location = useLocation();
  const { state } = location;
  
  const {
    handleSubmit,
    control,
    watch,
    setValue
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

    if (state.tipoProtocolo) {
      const currentProtocolo = protocolo.filter((item: any) => item.id === state.tipoProtocolo)[0]
      setValue('protocoloId', currentProtocolo)
    }

    if (state.pacienteId) {
      setValue('pacienteId', state.pacienteId)
    }

    if (state.item) {
      const currentPaciente = paciente.filter((item: any) => state.item.paciente.id === item.id)[0]
      setValue('pacienteId', currentPaciente)
    }

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

      {  !state?.edit && protocoloObj?.id && protocoloObj.id === TIPO_PROTOCOLO.portage && pacienteObj?.id &&  <PORTAGECADASTRO paciente={pacienteObj}/>}
      {  !state?.edit && protocoloObj?.id && protocoloObj.id === TIPO_PROTOCOLO.vbMapp && pacienteObj?.id && <VBMapp  paciente={pacienteObj}/>}
      {  !state?.edit && protocoloObj?.id && protocoloObj.id === TIPO_PROTOCOLO.pei && pacienteObj?.id && <PEICADASTRO  paciente={pacienteObj}/>}
      {  state?.edit && <PEICADASTRO paciente={pacienteObj} param={state} />}
   </form>
  );
}
