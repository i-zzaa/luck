// src/components/session/SessionMaintenance.tsx
import { memo } from 'react';
import CheckboxSN from '../../components/CheckboxSN';
import { CabecalhoMeta } from './sessaoUi';

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
  // setter que recebe o OBJETO listMaintenance atualizado (a árvore com
  // slots — não as selectedMaintenanceKeys, que é outro estado)
  setListMaintenance: (
    next: MaintenanceObj | ((prev: MaintenanceObj) => MaintenanceObj)
  ) => void;
  // Só a manutenção deste protocolo (o do seletor da tela de Sessão).
  // Sem ela, mostra as três.
  categoria?: keyof MaintenanceObj;
}

const isObjNode = (n: any) => n && typeof n === 'object' && !Array.isArray(n);
const hasActs = (children: any[] | undefined) =>
  Array.isArray(children) && children.some((c) => isObjNode(c));

// Ver comentário equivalente em SessionActivity.tsx: evita re-render dessa
// árvore quando o que mudou foi estado de outra seção da tela de Sessão.
export const SessionMaintenance = memo(function SessionMaintenance({
  listMaintenance,
  isEdit,
  setListMaintenance,
  categoria,
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

    setListMaintenance(next);
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

    setListMaintenance(next);
  };

  const renderCategory = (cat: keyof MaintenanceObj, title: string) => {
    const data = listMaintenance?.[cat] || [];
    if (!Array.isArray(data) || data.length === 0) return null;

    return (
      <div className="flex flex-col gap-3">
        <h2 className="m-0 px-1 pt-1.5 text-[13px] font-bold tracking-[0.08em] text-gray-800">
          {title}
        </h2>
        {data.map((programa: any, pIdx: number) => (
          <section
            key={`${String(cat)}-${pIdx}`}
            className="bg-white border border-gray-200 rounded-[14px] px-3.5 py-3 flex flex-col gap-3"
          >
            <span className="text-[15px] font-bold text-[#27272a]">{programa?.label ?? '—'}</span>
            {(programa?.children || []).map((meta: any, mIdx: number) => {
              const metaHasActs = hasActs(meta?.children);
              const metaDisabled = !!meta?.disabled || isEdit;

              return (
                <div
                  key={`${String(cat)}-${pIdx}-meta-${mIdx}`}
                  className="flex flex-col gap-2 pt-3 border-t border-[#f4f4f5]"
                >
                  <CabecalhoMeta numero={mIdx + 1} nome={meta?.label ?? '—'} />

                  {/* Caso 1: META é folha (children = [null]) -> 1 checkbox para a meta */}
                  {!metaHasActs && (
                    <div className="flex gap-2.5 items-center min-h-[44px]">
                      <CheckboxSN
                        key={0}
                        value={
                          Array.isArray(meta?.children) && meta.children.length > 0
                            ? meta.children[0]
                            : null
                        }
                        disabled={metaDisabled}
                        onChange={(newValue: any) => updateMetaSlot(cat, pIdx, mIdx, newValue)}
                      />
                      <span className="text-[14px] text-[#27272a]">{meta?.label ?? '—'}</span>
                    </div>
                  )}

                  {/* Caso 2: META tem ATOS (filhos-objeto) */}
                  {metaHasActs &&
                    (meta?.children || [])
                      .filter((act: any) => isObjNode(act))
                      .map((act: any, aIdx: number) => {
                        const disabled = !!act?.disabled || isEdit;
                        const value =
                          Array.isArray(act?.children) && act.children.length > 0
                            ? act.children[0]
                            : null;

                        return (
                          <div
                            className="flex gap-2.5 items-center min-h-[44px]"
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
                            <span className="text-[14px] text-[#27272a]">{act?.label ?? '—'}</span>
                          </div>
                        );
                      })}
                </div>
              );
            })}
          </section>
        ))}
      </div>
    );
  };

  if (!hasAny) return null;

  return (
    <>
      {(!categoria || categoria === 'manual') && renderCategory('manual', 'MANUTENÇÃO · MANUAL')}
      {(!categoria || categoria === 'vbmapp') && renderCategory('vbmapp', 'MANUTENÇÃO · VB-MAPP')}
      {(!categoria || categoria === 'portage') && renderCategory('portage', 'MANUTENÇÃO · PORTAGE')}
    </>
  );
});
