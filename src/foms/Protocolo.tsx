import { useCallback, useEffect, useMemo, useState } from 'react';

import { useForm } from 'react-hook-form';
import { ButtonHeron, Input } from '../components/index';
import { ProtocoloFields } from '../constants/formFields';
import { useToast } from '../contexts/toast';
import { create, dropDown, update } from '../server';
import { permissionAuth } from '../contexts/permission';
import { Divider, Fieldset, TabPanel, TabView } from 'primereact';
import { useLocation, useNavigate } from 'react-router-dom';
import { CONSTANTES_ROUTERS } from '../routes/OtherRoutes';
import { TIPO_PROTOCOLO } from '../constants/protocolo';
import PORTAGECADASTRO from './Portage';
import PEICADASTRO from './PEI';


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
    <form className="mt-8 space-y-6 " onSubmit={()=> {}} >
          {ProtocoloFields.map((item: any) => (
            <div>
              {
                hasPermition(item.permission) ? (
                  <Input
                    key={item.id}
                    labelText={item.labelText}
                    id={item.id}
                    type={item.type}
                    customCol={item.customCol}
                    control={control}
                    options={
                      item.type === 'select' ? dropDownList[item.name] : undefined
                    }
                    buttonAdd={item.buttonAdd}
                  />
                ) : null
              }
            </div>
          ))}

          { protocoloObj.id === TIPO_PROTOCOLO.portage && <PORTAGECADASTRO paciente={pacienteObj}/>}
          { protocoloObj.id === TIPO_PROTOCOLO.dtt && <PEICADASTRO paciente={pacienteObj} />}
          {/* { protocolo === TIPO_PROTOCOLO.portage && <PORTAGECADASTRO />} */}


   </form>
  );
}
