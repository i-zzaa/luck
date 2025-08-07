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
  const renderCheckbox = (
    path: number[],   // [programaId, metaId, subItemId?]
    slot: number,
    value: any
  ) => {
      const [programaId, metaId, checkKey = 0] = path;
    return (
      <CheckboxDTT
        key={`${checkKey}-${slot}`}
        value={value}
        disabled={isEdit}
        onChange={(newValue: any) => {
          // mesma lógica de update que você já tem
          const src = portage.length ? portage : listPortage;
          const updated = [...src];
          const programa = { ...updated[programaId] };
          const meta = { ...programa.children[metaId] };

          // alcançou leaf: array de slots
          if (Array.isArray(meta.children[checkKey]?.children)) {
            const sub = { ...meta.children[checkKey] };
            sub.children = sub.children.map((v: any, i: number) =>
              i === slot ? newValue : v
            );
            meta.children[checkKey] = sub;
          } else {
            meta.children = meta.children.map((v: any, i: number) =>
              i === slot ? newValue : v
            );
          }

          programa.children[metaId] = meta;
          updated[programaId] = programa;
          setPortage(updated);
        }}
      />
    );
  };

  // path acumula índices [programaIdx, metaIdx, subItemIdx?]
  const renderItems = (
    node: any,
    path: number[] = []
  ): JSX.Element | null => {
    if (!Array.isArray(node.children)) {
      return null;
    }

    // detecta último nível: primeiro filho NÃO tem label
    const firstChild = node.children[0];
    const isLeaf = firstChild == null || typeof firstChild !== 'object' || !('label' in firstChild);

    // se leaf, renderiza checkboxes direto
    if (isLeaf) {
      return (
        <div key={node.key} >
          <span className="block font-medium mb-1">{node.label}</span>
          <div className="flex gap-1 my-2">
            {node.children.map((v: any, slot: number) =>
              renderCheckbox(path, slot, v)
            )}
          </div>
        </div>
      );
    }

    // senão, desce mais um nível (interno)
    return (
      <div key={node.key} className="my-2">
        <span>- {node.label}</span>
        {node.children.map((child: any, idx: number) =>
          renderItems(child, [...path, idx])
        )}
      </div>
    );
  };

  const renderHeaderPrograma = ({estimuloDiscriminativo = '', resposta = '', estimuloReforcadorPositivo= ''}: any) => {
    return <HeaderPrograma estimuloDiscriminativo={estimuloDiscriminativo}  resposta={resposta} estimuloReforcadorPositivo={estimuloReforcadorPositivo} />
  }

  return (
    <div className="mt-8">
      <div className="text-gray-400 font-inter grid justify-start mx-2 mt-8 leading-4">
        <span className="font-bold">Portage</span>
      </div>      
      <Card className="rounded-lg cursor-not-allowed max-w-[100%]">
        <Accordion>
          {listPortage.map((programa, pIdx) => (
            <AccordionTab
              tabIndex={pIdx}
              key={programa.key}
              className="p-accordion-content-padding-zero"
              header={<div className="flex items-center w-full"><span>{programa.label}</span></div>}
            >
              {programa.children.map((meta: any, mIdx: number) => (
                <div key={meta.key} className="my-2 grid gap-2 items-center">
                  <div className="flex flex-col gap-1">
                  {renderHeaderPrograma(meta)}  

                  {/* recursão parte daqui, path = [programa, meta] */}
                  {renderItems(meta, [pIdx, mIdx])}
                  </div>
                </div>
              ))}
            </AccordionTab>
          ))}
        </Accordion>
      </Card>
    </div>
  )
};