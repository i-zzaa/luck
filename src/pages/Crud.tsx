import { TabView, TabPanel } from 'primereact/tabview';

import { permissionAuth } from '../contexts/permission';
import CrudSimples from '../templates/crudSimples';

export const Crud = () => {
  const { hasPermition } = permissionAuth();


  return (
    <div className="card">
      <TabView className="tabview-custom">
        {hasPermition('CADASTRO_PROGRAMA') ? (
          <TabPanel header="Programa" leftIcon="pi pi-palette">
          <CrudSimples
              screen="CADASTRO_PROGRAMA"
              namelist="programa"
              onClick={()=> {}}
            />
          </TabPanel>
     ) : ( 
        <></> 
      )} 
      </TabView>
    </div>
  );
};
