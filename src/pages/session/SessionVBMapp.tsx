// src/components/session/SessionVBMapp.tsx
import React from "react";
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

const getLabel = (n: any) => n?.label ?? n?.value ?? n?.nome ?? "—";

// Ver comentário equivalente em SessionActivity.tsx: evita re-render dessa
// árvore quando o que mudou foi estado de outra seção da tela de Sessão.
export const SessionVBMapp: React.FC<Props> = React.memo(function SessionVBMapp({
  listVBMapp = [],
  vbmapp = [],
  isEdit,
  setVBMapp,
}) {
  const source = (Array.isArray(vbmapp) && vbmapp.length) ? vbmapp : (listVBMapp || []);
  if (!Array.isArray(source) || !source.length) return null;

  return (
    <div className="mt-8">
      <div className="text-gray-400 font-inter grid justify-start mx-2 mt-8 leading-4">
        <span className="font-bold">VB Mapp</span>
      </div>
      <Card className="rounded-lg max-w-[100%]">
        <Accordion>
          {source.map((nivel: any, nIdx: number) => {
            const programasRaw = Array.isArray(nivel?.children) ? nivel.children : [];
            // Esconde nível sem programas válidos (programa precisa ter metas)
            const programas = programasRaw.filter(
              (p: any) => Array.isArray(p?.children) && p.children.length > 0
            );
            if (programas.length === 0) return null;

            return (
              <AccordionTab
                tabIndex={nIdx}
                key={String(nivel?.key ?? nIdx)}
                className="p-accordion-content-padding-zero"
                header={<div className="flex items-center w-full"><span>{getLabel(nivel)}</span></div>}
              >
                <Accordion>
                  {programas.map((programa: any, pIdx: number) => {
                    const metas = Array.isArray(programa?.children) ? programa.children : [];
                    if (metas.length === 0) return null; // Oculta programa sem metas

                    return (
                      <AccordionTab
                        tabIndex={pIdx}
                        key={String(programa?.key ?? `${nIdx}-${pIdx}`)}
                        className="p-accordion-content-padding-zero"
                        header={<div className="flex items-center"><span>{getLabel(programa)}</span></div>}
                      >
                        <div className="mb-4">
                          <HeaderPrograma {...programa} />
                        </div>

                        <ul className="list-none">
                          {metas.map((meta: any, mIdx: number) => (
                            <li key={String(meta?.key ?? `${nIdx}-${pIdx}-${mIdx}`)} className="mb-6">
                              <span className="font-bold font-inter">Meta {mIdx + 1}: </span>
                              <span className="font-base font-inter">{getLabel(meta)}</span>

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
                    );
                  })}
                </Accordion>
              </AccordionTab>
            );
          })}
        </Accordion>
      </Card>
    </div>
  );
});
