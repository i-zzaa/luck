// src/components/session/SessionMaintenance.tsx
import { memo } from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Card } from '../../components/card';
import CheckboxSN from '../../components/CheckboxSN';

type MaintenanceNode = {
  key: string | number;
  label?: string;
  children?: any[]; // pode conter objetos OU null (slots)
  disabled?: boolean;
  [k: string]: any;
};

type MaintenanceArr = MaintenanceNode[];
type MaintenanceObj = {
  manual?: MaintenanceArr;
  vbmapp?: MaintenanceArr;
  portage?: MaintenanceArr;
};

interface Props {
  // objeto com as três categorias já transformadas (com slots)
  listMaintenance: MaintenanceObj;
  // true desabilita edição visual
  isEdit: boolean;
  // setter que recebe o OBJETO listMaintenance atualizado
  setMaintenance: (
    next: MaintenanceObj | ((prev: MaintenanceObj) => MaintenanceObj)
  ) => void;}

const isObjNode = (n: any) => n && typeof n === 'object' && !Array.isArray(n);
const hasActs = (children: any[] | undefined) =>
  Array.isArray(children) && children.some((c) => isObjNode(c));

// Ver comentário equivalente em SessionActivity.tsx: evita re-render dessa
// árvore quando o que mudou foi estado de outra seção da tela de Sessão.
export const SessionMaintenance = memo(function SessionMaintenance({
  listMaintenance,
  isEdit,
  setMaintenance,
}: Props) {
  const hasAny =
    (Array.isArray(listMaintenance?.manual) && listMaintenance.manual!.length > 0) ||
    (Array.isArray(listMaintenance?.vbmapp) && listMaintenance.vbmapp!.length > 0) ||
    (Array.isArray(listMaintenance?.portage) && listMaintenance.portage!.length > 0);

  // Atualiza o slot [children[0]] de META (quando é folha)
  const updateMetaSlot = (
    cat: keyof MaintenanceObj,
    programaIdx: number,
    metaIdx: number,
    newValue: any
  ) => {
    const current = listMaintenance;

    const next: MaintenanceObj = {
      ...current,
      [cat]: [...(current[cat] || [])],
    };

    const programa = { ...(next[cat]![programaIdx] || {}) };
    const metas = [...(programa.children || [])];
    const meta = { ...(metas[metaIdx] || {}) };

    const slots = Array.isArray(meta.children) ? [...meta.children] : [null];
    const prev = slots[0];
    if (prev === newValue) return;

    slots[0] = newValue;
    meta.children = slots;
    metas[metaIdx] = meta;
    programa.children = metas;
    next[cat]![programaIdx] = programa;

    setMaintenance(next);
  };

  // Atualiza o slot [children[0]] de ACT (quando meta tem filhos-objeto)
  const updateActSlot = (
    cat: keyof MaintenanceObj,
    programaIdx: number,
    metaIdx: number,
    actIdx: number,
    newValue: any
  ) => {
    const current = listMaintenance;

    const next: MaintenanceObj = {
      ...current,
      [cat]: [...(current[cat] || [])],
    };

    const programa = { ...(next[cat]![programaIdx] || {}) };
    const metas = [...(programa.children || [])];
    const meta = { ...(metas[metaIdx] || {}) };
    const acts = [...(meta.children || [])];
    const act = { ...(acts[actIdx] || {}) };
    const slots = Array.isArray(act.children) ? [...act.children] : [null];

    const prev = slots[0];
    if (prev === newValue) return;

    slots[0] = newValue;
    act.children = slots;
    acts[actIdx] = act;
    meta.children = acts;
    metas[metaIdx] = meta;
    programa.children = metas;
    next[cat]![programaIdx] = programa;

    setMaintenance(next);
  };

  const renderCategory = (cat: keyof MaintenanceObj, title: string) => {
    const data = listMaintenance?.[cat] || [];
    if (!Array.isArray(data) || data.length === 0) return null;

    return (
      <div className="mt-8">
        <div className="text-gray-400 font-inter grid justify-start mx-2 mt-8 leading-4">
          <span className="font-bold">{title}</span>
        </div>

        <Card className="rounded-lg max-w-[100%]">
          <Accordion>
            {data.map((programa: any, pIdx: number) => (
              <AccordionTab
                key={`${String(cat)}-${pIdx}`}
                tabIndex={pIdx}
                header={
                  <div className="flex items-center w-full">
                    <span>{programa?.label ?? '—'}</span>
                  </div>
                }
              >
                {(programa?.children || []).map((meta: any, mIdx: number) => {
                  const metaHasActs = hasActs(meta?.children);
                  const metaDisabled = !!meta?.disabled || isEdit;

                  return (
                    <div key={`${String(cat)}-${pIdx}-meta-${mIdx}`} className="my-8">
                      <span className="font-bold font-inter">Meta {mIdx + 1}:</span>
                      <span className="font-base font-inter"> {meta?.label ?? '—'}</span>

                      {/* Caso 1: META é folha (children = [null]) -> 1 checkbox para a meta */}
                      {!metaHasActs && (
                        <ul className="list-disc mt-2 font-inter ml-4">
                          <li className="my-2 flex gap-2 -ml-4 items-center">
                            <CheckboxSN
                              key={0}
                              value={
                                Array.isArray(meta?.children) && meta.children.length > 0
                                  ? meta.children[0]
                                  : null
                              }
                              disabled={metaDisabled}
                              onChange={(newValue: any) =>
                                updateMetaSlot(cat, pIdx, mIdx, newValue)
                              }
                            />
                            <span>{meta?.label ?? '—'}</span>
                          </li>
                        </ul>
                      )}

                      {/* Caso 2: META tem ATOS (filhos-objeto) */}
                      {metaHasActs && (
                        <ul className="list-disc mt-2 font-inter ml-4">
                          {(meta?.children || [])
                            .filter((act: any) => isObjNode(act))
                            .map((act: any, aIdx: number) => {
                              const disabled = !!act?.disabled || isEdit;
                              const value =
                                Array.isArray(act?.children) && act.children.length > 0
                                  ? act.children[0]
                                  : null;

                              return (
                                <li
                                  className="my-2 flex gap-2 -ml-4 items-center"
                                  key={`${String(cat)}-${pIdx}-meta-${mIdx}-act-${aIdx}`}
                                >
                                  <CheckboxSN
                                    key={0}
                                    value={value}
                                    disabled={disabled}
                                    onChange={(newValue: any) =>
                                      updateActSlot(cat, pIdx, mIdx, aIdx, newValue)
                                    }
                                  />
                                  <span>{act?.label ?? '—'}</span>
                                </li>
                              );
                            })}
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

  if (!hasAny) return null;

  return (
    <>
      {renderCategory('manual', 'Manutenção — Manual')}
      {renderCategory('vbmapp', 'Manutenção — VB-Mapp')}
      {renderCategory('portage', 'Manutenção — Portage')}
    </>
  );
});
