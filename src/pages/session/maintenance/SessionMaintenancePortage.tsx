// src/components/session/maintenance/SessionMaintenancePortage.tsx
import React from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Card } from '../../../components/card'; // <-- seu Card
import CheckboxSN from '../../../components/CheckboxSN';
import { HeaderPrograma } from '../../../components/fielSetHeader/HeaderProgram';

type Node = any;

interface Props {
  data: Node[];
  isEdit: boolean;
  setCategory: (updater: (prev: Node[]) => Node[]) => void;
}

const isObj = (n: any) => n && typeof n === 'object' && !Array.isArray(n);

export const SessionMaintenancePortage: React.FC<Props> = ({
  data = [],
  isEdit,
  setCategory,
}) => {
  if (!Array.isArray(data) || !data.length) return null;

  const updateMetaSlot = (pIdx: number, mIdx: number, newValue: any) =>
    setCategory(prev => {
      const updated = [...prev];
      const programa = { ...(updated[pIdx] || {}) };
      const metas = Array.isArray(programa.children) ? [...programa.children] : [];
      const meta = { ...(metas[mIdx] || {}) };
      const slots = Array.isArray(meta.children) ? [...meta.children] : [null];

      if (slots[0] === newValue) return prev;

      slots[0] = newValue;
      meta.children = slots;
      metas[mIdx] = meta;
      programa.children = metas;
      updated[pIdx] = programa;            // <- reatribui no topo

      return updated;
    });

  const updateActSlot = (pIdx: number, mIdx: number, aIdx: number, newValue: any) =>
    setCategory(prev => {
      const updated = [...prev];
      const programa = { ...(updated[pIdx] || {}) };
      const metas = Array.isArray(programa.children) ? [...programa.children] : [];
      const meta = { ...(metas[mIdx] || {}) };
      const acts = Array.isArray(meta.children) ? [...meta.children] : [];
      const act = { ...(acts[aIdx] || {}) };
      const slots = Array.isArray(act.children) ? [...act.children] : [null];

      if (slots[0] === newValue) return prev;

      slots[0] = newValue;
      act.children = slots;
      acts[aIdx] = act;
      meta.children = acts;
      metas[mIdx] = meta;
      programa.children = metas;
      updated[pIdx] = programa;            // <- reatribui no topo

      return updated;
    });

  const renderHeaderPrograma = (p: any) => (
    <HeaderPrograma
      estimuloDiscriminativo={p?.estimuloDiscriminativo ?? ''}
      resposta={p?.resposta ?? ''}
      estimuloReforcadorPositivo={p?.estimuloReforcadorPositivo ?? ''}
    />
  );

  return (
    <div className="mt-8">
      <div className="text-gray-400 font-inter grid justify-start mx-2 mt-8 leading-4">
        <span className="font-bold">Manutenção — Portage</span>
      </div>
      <Card className="rounded-lg max-w-[100%]">
        <Accordion>
          {data.map((programa: any, pIdx: number) => (
            <AccordionTab
              key={String(programa?.key ?? pIdx)}
              tabIndex={pIdx}
              className="p-accordion-content-padding-zero"
              header={<div className="flex items-center w-full"><span>{programa?.label ?? '—'}</span></div>}
            >
              {(programa?.children || []).map((meta: any, mIdx: number) => {
                const hasActs = Array.isArray(meta?.children) && meta.children.some((c: any) => isObj(c));

                return (
                  <div key={String(meta?.key ?? `${pIdx}-${mIdx}`)} className="my-6">
                    {renderHeaderPrograma(meta)}
                    <span className="font-bold font-inter">Meta {mIdx + 1}: </span>
                    <span className="font-base font-inter">{meta?.label ?? '—'}</span>

                    {/* Meta folha: 1 checkbox */}
                    {!hasActs && (
                      <ul className="list-disc mt-2 font-inter ml-4">
                        <li className="my-2 flex gap-2 -ml-4 items-center">
                          <CheckboxSN
                            value={Array.isArray(meta?.children) ? meta.children[0] : null}
                            disabled={isEdit}
                            onChange={(val: any) => updateMetaSlot(pIdx, mIdx, val)}
                          />
                          <span>{meta?.label ?? '—'}</span>
                        </li>
                      </ul>
                    )}

                    {/* Meta com atos: 1 checkbox por ato */}
                    {hasActs && (
                      <ul className="list-disc mt-2 font-inter ml-4">
                        {(meta.children || [])
                          .filter((a: any) => isObj(a))
                          .map((act: any, aIdx: number) => (
                            <li key={String(act?.key ?? `${pIdx}-${mIdx}-${aIdx}`)} className="my-2 flex gap-2 -ml-4 items-center">
                              <CheckboxSN
                                value={Array.isArray(act?.children) ? act.children[0] : null}
                                disabled={!!act?.disabled || isEdit}
                                onChange={(val: any) => updateActSlot(pIdx, mIdx, aIdx, val)}
                              />
                              <span>{act?.label ?? '—'}</span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </AccordionTab>
          ))}
        </Accordion>
      </Card>
    </div>
  );
};
