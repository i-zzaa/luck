import { TabView, TabPanel } from 'primereact/tabview';

import Patient from './Patient';
import { permissionAuth } from '../contexts/permission';

export const Crud = () => {
  const { hasPermition } = permissionAuth();

  return (
    <div className="card">
      <TabView className="tabview-custom">
        {hasPermition('CADASTRO_PACIENTES') ? (
          <TabPanel header="Programas" leftIcon="pi pi-user">
            <Patient />
          </TabPanel>
        ) : (
          <></>
        )}
      </TabView>
    </div>
  );
};
