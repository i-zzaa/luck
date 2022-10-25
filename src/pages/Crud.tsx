import React, { useCallback, useLayoutEffect, useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';

import Patient from './Patient';
import CrudSimples from '../templates/crudSimples';
import { dropDown, getList } from '../server';
import { useToast } from '../contexts/toast';


interface OptionProps {
  id: string;
  nome: string;
}

export const Crud = () => {
  const [especialidade, setListEspecialidade] = useState([] as OptionProps[]);
  const [perfil, setPerfies] = useState<OptionProps[]>([]);
  const { renderToast } = useToast();

  const renderDropDownEspecialidade = useCallback(async () => {
    const especialidadeState: OptionProps[] = await dropDown("especialidade");
    setListEspecialidade(especialidadeState);
  }, []);

  const renderPerfil = useCallback(async () => {
    const perfilState: OptionProps[] = await dropDown("perfil");
    setPerfies(perfilState);
  }, []);

  const handleResetSenha = async (userId: number) => {
    try {
      const { message }: any = await getList(`/usuarios/reset-senha/${userId}`);
      renderToast({
        type: "success",
        title: "",
        message,
        open: true,
      });
    } catch ({ message }: any) {
      renderToast({
        type: "failure",
        title: "401",
        message: `${message}`,
        open: true,
      });
      return;
    }
  };

  useLayoutEffect(() => {
    renderDropDownEspecialidade()
    renderPerfil()
  }, [renderDropDownEspecialidade, renderPerfil]);

  return (
    <div className="card">
      <TabView className="tabview-custom">
        <TabPanel header="Lista de espera" leftIcon="pi pi-user">
          <Patient />
        </TabPanel>
        <TabPanel header="Usuários" leftIcon="pi pi-user">
          <CrudSimples 
            namelist="usuarios" 
            onClick={handleResetSenha} 
            iconButtonFooter="pi pi-sync"
            textButtonFooter="Reset de senha"
            dropDown={{ perfil }}
          />
        </TabPanel>
       <TabPanel header="Função" leftIcon="pi pi-slack" >
          <CrudSimples 
            namelist="funcao" 
            onClick={()=>{}} 
            dropDown={{ especialidade }}
          />
        </TabPanel>
        <TabPanel header="Localidade" leftIcon="pi pi-map">
         <CrudSimples 
          namelist="localidade" 
          onClick={()=>{}} 
         />
        </TabPanel>
      </TabView>
    </div>
  );
}