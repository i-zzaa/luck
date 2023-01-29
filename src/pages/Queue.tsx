import { TabPanel, TabView } from 'primereact';
import React from 'react';
import { permissionAuth } from '../contexts/permission';

const Therapy = React.lazy(() => import('./Therapy'));
const Avaliation = React.lazy(() => import('./Avaliation'));


export default function Queue() {
  const { hasPermition } = permissionAuth();

  const renderTabPanel = () => {
    if (!hasPermition('FILA_TERAPIA')) {
      return <Avaliation />;
    } else {
      return (
        <TabView className="tabview-custom">
          <TabPanel header="Avaliacão" leftIcon="pi pi-user">
            <Avaliation />
          </TabPanel>
          <TabPanel header="Terapia" leftIcon="pi pi-user">
            <Therapy />
          </TabPanel>
        </TabView>
      );
    }
  };

  return <div className="card">{renderTabPanel()}</div>;
}
