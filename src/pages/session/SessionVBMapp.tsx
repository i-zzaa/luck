import { Accordion, AccordionTab } from 'primereact/accordion';
import { Card } from '../../components/card';
import CheckboxDTT from '../../components/DTT';
import { HeaderPrograma } from '../../components/fielSetHeader/HeaderProgram';

interface Props {
  listVBMapp: any[];
  vbmapp: any[];
  isEdit: boolean;
  setVBMapp: (list: any) => any;
}

export const SessionVBMapp = ({ listVBMapp, vbmapp, isEdit, setVBMapp }: Props) => {
  const renderCheckboxes = (
    programaId: number,
    metaId: number,
    checkKey: number,
    itemIndex: number
  ) => {
    const meta = vbmapp[programaId]?.children?.[metaId];
    const node = meta?.children?.[checkKey];

    const value = node?.children
      ? node.children[itemIndex]         // subitem (children: [...])
      : node;                            // item direto (string/null)

    return (
      <CheckboxDTT
        key={itemIndex}
        value={value}
        disabled={isEdit}
        onChange={(newValue: any) => {
          const current = [...vbmapp];
          const programa = { ...current[programaId] };
          const meta = { ...programa.children[metaId] };

        if (meta.children[checkKey]?.children) {
          const subItem = { ...meta.children[checkKey] };
          const childrenArray = Array.isArray(subItem.children) && subItem.children.length === 10
            ? [...subItem.children]
            : Array(10).fill(null);

          childrenArray[itemIndex] = newValue;
          subItem.children = childrenArray;

          meta.children[checkKey] = { ...subItem };
        } else {
          const node = meta.children[checkKey];

          // Se for um valor direto (string/null), não mexa na estrutura de metas
          if (typeof node === 'string' || node === null) {
            const updatedChildren = [...meta.children];
            updatedChildren[checkKey] = newValue;
            meta.children = updatedChildren;
          }

          // Senão, trate como valor direto de 10 itens (sem subitem)
          else if (Array.isArray(meta.children)) {
            const item = meta.children[checkKey];
            if (typeof item !== 'object') {
              meta.children[checkKey] = newValue;
            }
          }
        }


          programa.children[metaId] = { ...meta };
          current[programaId] = { ...programa };
          setVBMapp([...current]);
        }}
      />
    );
  };

  const renderHeaderPrograma = ({
    estimuloDiscriminativo = '',
    resposta = '',
    estimuloReforcadorPositivo = '',
  }: any) => (
    <HeaderPrograma
      estimuloDiscriminativo={estimuloDiscriminativo}
      resposta={resposta}
      estimuloReforcadorPositivo={estimuloReforcadorPositivo}
    />
  );

  const renderItems = (
    items: any,
    programaId: number,
    metaId: number,
    childrenKey?: number
  ): any => {
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
          {items.map((itm: any, idx: number) => {
            const isSubItem = !!childrenKey && typeof items[0] !== 'string';
            const checkKey = isSubItem ? childrenKey! : idx;
            const itemIndex = isSubItem ? idx : 0;

            return renderCheckboxes(programaId, metaId, checkKey, itemIndex);
          })}
        </div>
      );
    }

    return null;
  };

  return !!vbmapp.length ? (
    <div className="mt-8">
      <div className="text-gray-400 font-inter grid justify-start mx-2 mt-8 leading-4">
        <span className="font-bold">VB Mapp</span>
      </div>
      <Card className="rounded-lg cursor-not-allowed max-w-[100%]">
        <Accordion>
          {vbmapp.map((nivel: any, key: any) => (
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
                    <div className="mb-4">
                      {renderHeaderPrograma(programa)}
                    </div>
                    {programa.children.map((meta: any, metaKey: any) => (
                      <li key={meta.key}>
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
  ): <></>
};
