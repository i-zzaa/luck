import { TabPanel, TabView } from "primereact";
import Avaliation from "./Avaliation";
import Therapy from "./Therapy";

export default function Queue() {
  return (
    <div className="card">
      <TabView className="tabview-custom">
        <TabPanel header="Avaliacão" leftIcon="pi pi-user" >
          <Avaliation />
        </TabPanel>
        <TabPanel header="Terapia" leftIcon="pi pi-user">
          <Therapy />
        </TabPanel>
      </TabView>
    </div>
  );
}
