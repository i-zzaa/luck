import { TabPanel, TabView } from 'primereact';
import { permissionAuth } from '../contexts/permission';
import Avaliation from './Avaliation';
import Devolutiva from './Devolutiva';
import Therapy from './Therapy';

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
          <TabPanel header="Devolutiva" leftIcon="pi pi-user">
            <Devolutiva />
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
