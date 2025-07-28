import { Accordion, AccordionTab } from 'primereact/accordion';
import { Card } from '../../components/card';
import CheckboxDTT from '../../components/DTT';
import { HeaderPrograma } from '../../components/fielSetHeader/HeaderProgram';

interface Props {
  listPortage: any[];
  portage: any[];
  isEdit: boolean;
  setPortage: (list: any) => any;
}

interface HeaderProgramaProps {
  estimuloDiscriminativo?: string;
  resposta?: string;
  estimuloReforcadorPositivo?: string;
}

export const SessionPortage = ({ listPortage, portage, isEdit, setPortage }: Props) => {
  const renderCheckboxes = (programaId: number, metaId: number, checkKey: number, itemIndex: number, value: any) => (
    <CheckboxDTT
      key={itemIndex}
      value={value}
      disabled={isEdit}
      onChange={(newValue: any) => {
        const current = portage.length ? [...portage] : [...listPortage];
        const programa = { ...current[programaId] };
        const meta = { ...programa.children[metaId] };

        if (meta.children[checkKey]?.children) {
          const subItem = { ...meta.children[checkKey] };
          const updatedChildren = [...subItem.children];
          updatedChildren[itemIndex] = newValue;
          subItem.children = updatedChildren;
          meta.children[checkKey] = subItem;
        } else {
          const updatedChildren = [...meta.children];
          updatedChildren[itemIndex] = newValue;
          meta.children = updatedChildren;
        }

        programa.children[metaId] = meta;
        current[programaId] = programa;
        setPortage([...current]);
      }}
    />
  );

  const renderHeaderPrograma = ({estimuloDiscriminativo = '', resposta = '', estimuloReforcadorPositivo= ''}: any) => {
    return <HeaderPrograma estimuloDiscriminativo={estimuloDiscriminativo}  resposta={resposta} estimuloReforcadorPositivo={estimuloReforcadorPositivo} />
  }

  const renderItems = (meta: any, programaId: number, metaId: number) => {
    if (!meta?.children) return null;

    return meta.children.map((item: any, checkKey: number) => {
      if (item?.label && item.children) {
        return (
          <div key={checkKey} className="flex flex-col ml-2">
            <span>- {item.label}</span>
            <div className="flex gap-1">
              {item.children.map((_: any, itemIndex: number) =>
                renderCheckboxes(programaId, metaId, checkKey, itemIndex, item.children[itemIndex])
              )}
            </div>
          </div>
        );
      }
      if (Array.isArray(item)) {
        return (
          <div key={checkKey} className="flex gap-1">
            {item.map((val: any, idx: number) =>
              renderCheckboxes(programaId, metaId, checkKey, idx, val)
            )}
          </div>
        );
      }
      return null;
    });
  };

  return !!listPortage.length ? (
    <div className="mt-8">
      <div className="text-gray-400 font-inter grid justify-start mx-2 mt-8 leading-4">
        <span className="font-bold">Portage</span>
      </div>
      <Card className="rounded-lg cursor-not-allowed max-w-[100%]">
        <Accordion>
          {listPortage.map((programa: any, key: number) => (
            <AccordionTab
              key={programa.key}
              tabIndex={key}
              header={<div className="flex items-center w-full"><span>{programa.label}</span></div>}
            >
              {programa.children.map((meta: any, metaKey: number) => (
                <li className="my-2 grid gap-2 items-center" key={meta.key}>
                  <span>{meta.label}</span>
                  <div className="flex flex-col gap-1">
                    {renderHeaderPrograma(meta)}  

                    {renderItems(meta, key, metaKey)}
                  </div>
                </li>
              ))}
            </AccordionTab>
          ))}
        </Accordion>
      </Card>
    </div>
  ): <></>
};