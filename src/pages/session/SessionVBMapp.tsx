// SessionVBMapp.tsx
import React, { useEffect } from "react";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Card } from "../../components/card";
import { HeaderPrograma } from "../../components/fielSetHeader/HeaderProgram";
import { CheckboxTree } from "./CheckboxTree";

interface Props {
  listVBMapp: any[];
  vbmapp: any[];
  isEdit: boolean;
  setVBMapp: (fn: (prev: any) => any) => void;
}

export const SessionVBMapp: React.FC<Props> = ({
  listVBMapp,
  vbmapp,
  isEdit,
  setVBMapp,
}) => {
  if (!vbmapp.length && !listVBMapp.length) return null;
  if (!vbmapp.length && listVBMapp.length) vbmapp = listVBMapp

  return (
    <div className="mt-8">
      <div className="text-gray-400 font-inter grid justify-start mx-2 mt-8 leading-4">
        <span className="font-bold">VB Mapp</span>
      </div> 
      <Card className="rounded-lg cursor-not-allowed max-w-[100%]">
        <Accordion>
          {vbmapp.map((nivel: any, nIdx: number) => (
            <AccordionTab
              tabIndex={nIdx}
              key={nivel.key}
              className="p-accordion-content-padding-zero"
              header={<div className="flex items-center w-full"><span>{nivel.label}</span></div>}
            >
              <Accordion >
                {nivel.children.map((programa: any, pIdx: number) => (
                  <AccordionTab
                    tabIndex={pIdx}
                    key={programa.key}
                    className="p-accordion-content-padding-zero"
                    header={<div className="flex items-center"><span>{programa.label}</span></div>}
                  >
                    <div className="mb-4">
                      <HeaderPrograma {...programa} />
                    </div>

                    <ul className="list-none">
                      {programa.children.map((meta: any, mIdx: number) => (
                        <li key={meta.key} className="mb-6">
                          <span className="font-medium">- {meta.label}</span>
                          {/* dispara o CheckboxTree a partir da meta */}
                          <CheckboxTree
                            node={meta}
                            path={[nIdx, pIdx, mIdx]}
                            isEdit={isEdit}
                            setStateFn={setVBMapp}
                            repeatCount={10}
                          />
                        </li>
                      ))}
                    </ul>
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
