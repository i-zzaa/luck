import React, { useCallback, useLayoutEffect, useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';

// import Patient from './Queue';
import CrudSimples from '../templates/crudSimples';
import { dropDown, getList } from '../server';
import { useToast } from '../contexts/toast';
import { useDropdown } from '../contexts/dropDown';
import Patient from './Patient';


interface OptionProps {
  id: string;
  nome: string;
}

export const Crud = () => {
  const { renderToast } = useToast();


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

  return (
    <div className="card">
      <TabView className="tabview-custom">
        <TabPanel header="Pacientes" leftIcon="pi pi-user">
          <Patient />
        </TabPanel>
        <TabPanel header="Usuários" leftIcon="pi pi-user">
          <CrudSimples 
            namelist="usuarios" 
            onClick={handleResetSenha} 
            iconButtonFooter="pi pi-sync"
            textButtonFooter="Reset de senha"
          />
        </TabPanel>
        <TabPanel header="Modalidade" leftIcon="pi pi-sitemap">
          <CrudSimples 
            namelist="modalidade" 
            onClick={()=>{}} 
          />
        </TabPanel>
        <TabPanel header="Status eventos" leftIcon="pi pi-calendar-plus">
          <CrudSimples 
            namelist="statusEventos" 
            onClick={()=>{}} 
          />
        </TabPanel>
        <TabPanel header="Frequência" leftIcon="pi pi-table">
          <CrudSimples 
            namelist="frequencia" 
            onClick={()=>{}} 
          />
        </TabPanel>
       <TabPanel header="Função" leftIcon="pi pi-slack" >
          <CrudSimples 
            namelist="funcao" 
            onClick={()=>{}} 
          />
        </TabPanel>
        <TabPanel header="Localidade" leftIcon="pi pi-map-marker">
         <CrudSimples 
          namelist="localidade" 
          onClick={()=>{}} 
         />
        </TabPanel>
      </TabView>
    </div>
  );
}