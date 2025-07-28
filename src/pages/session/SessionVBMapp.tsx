// src/components/session/SessionVBMapp.tsx
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Card } from '../../components/card';
import CheckboxDTT from '../../components/DTT';
import { Fieldset } from 'primereact/fieldset';
import { HeaderPrograma } from '../../components/fielSetHeader/HeaderProgram';

interface Props {
  listVBMapp: any[];
  vbmapp: any[];
  isEdit: boolean;
  setVBMapp: (list: any) => any;
}

export const SessionVBMapp = ({ listVBMapp, vbmapp, isEdit, setVBMapp }: Props) => {
  const renderCheckboxes = (programaId: number, metaId: number, checkKey: number, itemIndex: number, value: any) => (
    <CheckboxDTT
      key={itemIndex}
      value={value}
      disabled={isEdit}
      onChange={(newValue: any) => {
        const current = vbmapp.length ? [...vbmapp] : [...listVBMapp];
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
        setVBMapp([...current]);
      }}
    />
  );

  const renderHeaderPrograma = ({estimuloDiscriminativo = '', resposta = '', estimuloReforcadorPositivo= ''}: any) => {
    return <HeaderPrograma estimuloDiscriminativo={estimuloDiscriminativo}  resposta={resposta} estimuloReforcadorPositivo={estimuloReforcadorPositivo} />
  }

  const renderItems = (items: any, programaId: number, metaId: number, childrenKey?: number): any => {
    const validChildren = items?.children ? items?.children[0]?.label : false;

    if (validChildren) {
      return (
        <div>
          {items?.children.map((itm: any, checkKey: any) => (
            <div key={checkKey} className="flex flex-col ml-2">
              <span>- {itm.label}</span>
              <div className="flex flex-col gap-1">
                {renderItems(itm.children, programaId, metaId, checkKey)}
              </div>
            </div>
          ))}
        </div>
      );
    } else if (items?.label && items?.children?.length === 10) {
      return renderItems(items.children, programaId, metaId);
    } else if (items.length === 10) {
      return (
        <div className="flex gap-1">
          {items.map((_: any, idx: number) =>
            renderCheckboxes(programaId, metaId, childrenKey || 0, idx, items[idx])
          )}
        </div>
      );
    }
    return null;
  };

  return !!listVBMapp.length && (
    <div className="mt-8">
      <div className="text-gray-400 font-inter grid justify-start mx-2 mt-8 leading-4">
        <span className="font-bold">VB Mapp</span>
      </div>
      <Card className="rounded-lg cursor-not-allowed max-w-[100%]">
        <Accordion>
          {listVBMapp.map((nivel: any, key: any) => (
            <AccordionTab
              key={nivel.key}
              tabIndex={key}
              className="w-[100%]"
              header={<div className="flex items-center w-full"><span>{nivel.label}</span></div>}
            >
              <Accordion style={{ padding: "0.25rem !important" }}>
                {nivel.children.map((programa: any, programaKey: any) => (
                  <AccordionTab
                    key={programa.key}
                    tabIndex={programaKey}
                    className="w-[95%] ml-[-1rem]"
                    header={<div className="flex items-center w-full"><span>{programa.label}</span></div>}
                  >
                    <div className='mb-4'>
                      {renderHeaderPrograma(programa)} 
                    </div>
                    {programa.children.map((meta: any, metaKey: any) => (
                      <li key={meta.key} >
                        <span>{meta.label}</span>
                        <div className="flex flex-col gap-1 m-4">
                          {renderItems(meta, key, programaKey, metaKey)}
                        </div>
                      </li>
                    ))}
                  </AccordionTab>
                ))}
              </Accordion>
            </AccordionTab>
          ))}
        </Accordion>
      </Card>
    </div>
  );
};
