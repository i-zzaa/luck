import { Accordion, AccordionTab } from 'primereact/accordion';
import { Card } from '../../components/card';
import CheckboxDTT from '../../components/DTT';

interface Props {
  list: any[];
  dtt: any[];
  isEdit: boolean;
  setDTT: (list: any) => any;
}

export const SessionActivity = ({ list, dtt, isEdit, setDTT }: Props) => {
  const renderedCheckboxes = (programaId: number, metaId: number, activityId: number, checkKey: number, value?: any) => {
    return (
      <CheckboxDTT
        key={checkKey}
        value={value}
        disabled={list[programaId].children[metaId].children[activityId].disabled || isEdit}
        onChange={(newValue: any) => {
          const current = [...list];
          const previousValue = list[programaId].children[metaId].children[activityId].children[checkKey];
          if (previousValue !== newValue) {
            current[programaId].children[metaId].children[activityId].children[checkKey] = newValue;
            setDTT(current);
          }
        }}
      />
    );
  };

  return !!list.length && (
    <div className="mt-8">
      <div className="text-gray-400 font-inter grid justify-start mx-2  mt-8 leading-4">
        <span className="font-bold"> Manual </span>
      </div>
      <div className="text-red-400 font-inter grid justify-start mx-2 leading-4 mt-2">
        <span className="text-md">Interrompa o treino da atividade ao atingir 4 tentativas corretas consecutivas.</span>
      </div>
      <Card className="rounded-lg cursor-not-allowed max-w-[100%]">
        <Accordion>
          {list.map((programa: any, key: number) => (
            <AccordionTab key={key} tabIndex={key} header={<div className="flex items-center  w-full"><span>{programa.label}</span></div>}>
              {programa.children.map((meta: any, metaKey: number) => (
                <div key={metaKey} className="my-8">
                  <span className="font-bold font-inter">Meta {metaKey + 1}: </span>
                  <span className="font-base font-inter">{meta.label}</span>
                  <ul className="list-disc mt-2 font-inter ml-4">
                    {meta.children.map((act: any, actKey: number) => (
                      <li className="my-2" key={actKey}>
                        <span>{act.label}</span>
                        <div className="flex gap-1 -ml-4">
                          {act.children.map((itm: any, checkKey: number) =>
                            renderedCheckboxes(key, metaKey, actKey, checkKey, itm)
                          )}
                        </div>
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