import { TabView, TabPanel } from 'primereact/tabview';

import { permissionAuth } from '../contexts/permission';
import CrudSimples from '../templates/crudSimples';
import Patients from './Patients';

export const Crud = () => {
  const { hasPermition } = permissionAuth();


  return (
    <div className="card">
      <TabView className="tabview-custom">
        {hasPermition('CADASTRO_PROGRAMA') ? (
          <TabPanel header="Programas" leftIcon="pi pi-palette">
            <CrudSimples
              screen="CADASTRO_PROGRAMA"
              namelist="programa"
              onClick={()=> {}}
            />
          </TabPanel>
     ) : ( 
        <></> 
      )} 

      {hasPermition('CADASTRO_PACIENTES') ? (
          <TabPanel header="Pacientes" leftIcon="pi pi-user">
            <Patients />
          </TabPanel>
     ) : ( 
        <></> 
      )} 
      </TabView>
    </div>
  );
};
