// src/components/session/maintenance/SessionMaintenanceVBMapp.tsx
import React from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Card } from '../../../components/card';
import CheckboxSN from '../../../components/checkboxSN';
import { HeaderPrograma } from '../../../components/fielSetHeader/HeaderProgram';

type Node = any;

interface Props {
  data: Node[];
  isEdit: boolean;
  setCategory: (updater: (prev: Node[]) => Node[]) => void;
}

const isObj = (n: any) => n && typeof n === 'object' && !Array.isArray(n);

export const SessionMaintenanceVBMapp: React.FC<Props> = ({
  data = [],
  isEdit,
  setCategory,
}) => {
  if (!Array.isArray(data) || !data.length) return null;

  // path = [nivelIdx, programaIdx, metaIdx]
  const updateMetaSlot = (nIdx: number, pIdx: number, mIdx: number, newValue: any) =>
    setCategory(prev => {
      const updated = [...prev];
      const nivel = { ...(updated[nIdx] || {}) };
      const programas = Array.isArray(nivel.children) ? [...nivel.children] : [];
      const programa = { ...(programas[pIdx] || {}) };
      const metas = Array.isArray(programa.children) ? [...programa.children] : [];
      const meta = { ...(metas[mIdx] || {}) };
      const slots = Array.isArray(meta.children) ? [...meta.children] : [null];

      if (slots[0] === newValue) return prev;
      slots[0] = newValue;

      meta.children = slots;
      metas[mIdx] = meta;
      programa.children = metas;
      programas[pIdx] = programa;

      // 🔴 Faltava reatribuir os filhos no nível
      nivel.children = programas;
      updated[nIdx] = nivel;

      return updated;
    });

  // path = [nivelIdx, programaIdx, metaIdx, actIdx]
  const updateActSlot = (nIdx: number, pIdx: number, mIdx: number, aIdx: number, newValue: any) =>
    setCategory(prev => {
      const updated = [...prev];
      const nivel = { ...(updated[nIdx] || {}) };
      const programas = Array.isArray(nivel.children) ? [...nivel.children] : [];
      const programa = { ...(programas[pIdx] || {}) };
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
      programas[pIdx] = programa;

      // 🔴 Faltava reatribuir os filhos no nível
      nivel.children = programas;
      updated[nIdx] = nivel;

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
        <span className="font-bold">Manutenção — VB-Mapp</span>
      </div>
      <Card className="rounded-lg max-w-[100%]">
        <Accordion>
          {data.map((nivel: any, nIdx: number) => (
            <AccordionTab
              tabIndex={nIdx}
              key={String(nivel?.key ?? nIdx)}
              className="p-accordion-content-padding-zero"
              header={<div className="flex items-center w-full"><span>{nivel?.label ?? '—'}</span></div>}
            >
              <Accordion>
                {(nivel?.children || []).map((programa: any, pIdx: number) => (
                  <AccordionTab
                    tabIndex={pIdx}
                    key={String(programa?.key ?? `${nIdx}-${pIdx}`)}
                    className="p-accordion-content-padding-zero"
                    header={<div className="flex items-center"><span>{programa?.label ?? '—'}</span></div>}
                  >
                    <div className="mb-4">
                      {renderHeaderPrograma(programa)}
                    </div>

                    <ul className="list-none">
                      {(programa?.children || []).map((meta: any, mIdx: number) => {
                        const hasActs = Array.isArray(meta?.children) && meta.children.some((c: any) => isObj(c));

                        return (
                          <li key={String(meta?.key ?? `${nIdx}-${pIdx}-${mIdx}`)} className="mb-6">
                            <span className="font-bold font-inter">Meta {mIdx + 1}: </span>
                            <span className="font-base font-inter">{meta?.label ?? '—'}</span>

                            {/* meta folha -> 1 checkbox */}
                            {!hasActs && (
                              <div className="mt-2">
                                <CheckboxSN
                                  value={Array.isArray(meta?.children) ? meta.children[0] : null}
                                  disabled={isEdit}
                                  onChange={(val: any) => updateMetaSlot(nIdx, pIdx, mIdx, val)}
                                />
                              </div>
                            )}

                            {/* meta com atos -> 1 checkbox por ato */}
                            {hasActs && (
                              <ul className="list-none mt-2 font-inter">
                                {(meta.children || [])
                                  .filter((a: any) => isObj(a))
                                  .map((act: any, aIdx: number) => (
                                    <li key={String(act?.key ?? `${nIdx}-${pIdx}-${mIdx}-${aIdx}`)} className="my-2 flex gap-2 items-center">
                                      <CheckboxSN
                                        value={Array.isArray(act?.children) ? act.children[0] : null}
                                        disabled={!!act?.disabled || isEdit}
                                        onChange={(val: any) => updateActSlot(nIdx, pIdx, mIdx, aIdx, val)}
                                      />
                                      <span>{act?.label ?? '—'}</span>
                                    </li>
                                  ))}
                              </ul>
                            )}
                          </li>
                        );
                      })}
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
