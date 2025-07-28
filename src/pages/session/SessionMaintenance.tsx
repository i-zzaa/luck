// src/components/session/SessionMaintenance.tsx
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Card } from '../../components/card';
import CheckboxSN from '../../components/checkboxSN';

interface Props {
  listMaintenance: any[];
  maintenance: any[];
  isEdit: boolean;
  setMaintenance: (list: any) => void;
}

export const SessionMaintenance = ({ listMaintenance, maintenance, isEdit, setMaintenance }: Props) => {
  const renderCheckboxes = (programaId: number, metaId: number, activityId: number, value?: any) => (
    <CheckboxSN
      key={0}
      value={value}
      disabled={listMaintenance[programaId].children[metaId].children[activityId].disabled || isEdit}
      onChange={(newValue: any) => {
        const current = [...listMaintenance];
        const previousValue = current[programaId].children[metaId].children[activityId].children[0];

        if (previousValue !== newValue) {
          current[programaId].children[metaId].children[activityId].children[0] = newValue;
          setMaintenance(current);
        }
      }}
    />
  );

  return !!listMaintenance.length && (
    <div className="mt-8">
      <div className="text-gray-400 font-inter grid justify-start mx-2 mt-8 leading-4">
        <span className="font-bold">Manutenção</span>
      </div>
      <Card className="rounded-lg cursor-not-allowed max-w-[100%]">
        <Accordion>
          {listMaintenance.map((programa: any, key: number) => (
            <AccordionTab
              key={key}
              tabIndex={key}
              header={<div className="flex items-center w-full"><span>{programa.label}</span></div>}
            >
              {programa.children.map((meta: any, metaKey: number) => (
                <div key={metaKey} className="my-8">
                  <span className="font-bold font-inter">Meta {metaKey + 1}:</span>
                  <span className="font-base font-inter"> {meta.label}</span>
                  <ul className="list-disc mt-2 font-inter ml-4">
                    {meta.children.map((act: any, actKey: number) => (
                      <li className="my-2 flex gap-2 -ml-4 items-center" key={actKey}>
                        {renderCheckboxes(key, metaKey, actKey, act.children[0])}
                        <span>{act.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </AccordionTab>
          ))}
        </Accordion>
      </Card>
    </div>
  );
};