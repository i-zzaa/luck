// src/components/session/SessionActivity.tsx
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Card } from '../../components/card';
import CheckboxDTT from '../../components/DTT';
import { HeaderPrograma } from '../../components/fielSetHeader/HeaderProgram';

interface Props {
  list: any[];
  dtt: any[];
  isEdit: boolean;
  setDTT: (list: any) => any;
}

const isObjNode = (n: any) => n && typeof n === 'object' && !Array.isArray(n);
const getLabel = (n: any) => (n?.label ?? n?.value ?? n?.nome ?? '—');
const ensureSlots = (arr: any[] | undefined, count = 10) =>
  Array.isArray(arr) && arr.length ? arr : Array.from({ length: count }, () => null);

// meta é “renderizável” se:
// - tiver atos e pelo menos um ato tiver label real, OU
// - for folha e tiver label real (≠ '—')
const metaIsRenderable = (meta: any) => {
  const kids = Array.isArray(meta?.children) ? meta.children : [];
  const hasActs = kids.some((c: any) => isObjNode(c));
  if (hasActs) {
    return kids.some((c: any) => isObjNode(c) && getLabel(c) !== '—');
  }
  return getLabel(meta) !== '—';
};

export const SessionActivity = ({ list = [], dtt = [], isEdit, setDTT }: Props) => {
  // usa o estado DTT se existir; senão, a lista inicial
  const source = (Array.isArray(dtt) && dtt.length) ? dtt : (list || []);
  if (!Array.isArray(source) || !source.length) return null;

  const renderHeaderPrograma = ({
    estimuloDiscriminativo = '',
    resposta = '',
    estimuloReforcadorPositivo = ''
  }: any) => (
    <HeaderPrograma
      estimuloDiscriminativo={estimuloDiscriminativo}
      resposta={resposta}
      estimuloReforcadorPositivo={estimuloReforcadorPositivo}
    />
  );

  // Atualiza slot quando META é folha (slots diretamente em meta.children)
  const updateMetaSlot = (pIdx: number, mIdx: number, checkIdx: number, newValue: any) => {
    const updated = [...source];
    const programa = { ...(updated[pIdx] || {}) };
    const metas = Array.isArray(programa.children) ? [...programa.children] : [];
    const meta = { ...(metas[mIdx] || {}) };

    const slots = ensureSlots(meta.children, 10).slice();
    if (slots[checkIdx] === newValue) return;

    slots[checkIdx] = newValue;
    meta.children = slots;
    metas[mIdx] = meta;
    programa.children = metas;
    updated[pIdx] = programa;

    setDTT(updated);
  };

  // Atualiza slot quando META tem ATOS (slots ficam em act.children)
  const updateActSlot = (
    pIdx: number,
    mIdx: number,
    aIdx: number,
    checkIdx: number,
    newValue: any
  ) => {
    const updated = [...source];
    const programa = { ...(updated[pIdx] || {}) };
    const metas = Array.isArray(programa.children) ? [...programa.children] : [];
    const meta = { ...(metas[mIdx] || {}) };
    const acts = Array.isArray(meta.children) ? [...meta.children] : [];
    const act = { ...(acts[aIdx] || {}) };

    const slots = ensureSlots(act.children, 10).slice();
    if (slots[checkIdx] === newValue) return;

    slots[checkIdx] = newValue;
    act.children = slots;
    acts[aIdx] = act;
    meta.children = acts;
    metas[mIdx] = meta;
    programa.children = metas;
    updated[pIdx] = programa;

    setDTT(updated);
  };

  return (
    <div className="mt-8">
      <div className="text-gray-400 font-inter grid justify-start mx-2 mt-8 leading-4">
        <span className="font-bold"> Manual </span>
      </div>

      <Card className="rounded-lg max-w-[100%]">
        <Accordion>
          {source.map((programa: any, pIdx: number) => {
            const metas = Array.isArray(programa?.children) ? programa.children : [];

            // NÃO exibe o programa quando:
            // - não tem metas, OU
            // - todas as metas são "inválidas" (sem label real e sem atos com label)
            const hasRenderableMeta = metas.some((m: any) => metaIsRenderable(m));
            if (!metas.length || !hasRenderableMeta) return null;

            return (
              <AccordionTab
                key={String(programa?.key ?? pIdx)}
                className="p-accordion-content-padding-zero"
                tabIndex={pIdx}
                header={<div className="flex items-center w-full"><span>{getLabel(programa)}</span></div>}
              >
                {renderHeaderPrograma(programa)}

                {metas.map((meta: any, mIdx: number) => {
                  // preserva índices (não filtra), mas NÃO renderiza metas inválidas
                  if (!metaIsRenderable(meta)) return null;

                  const hasActs =
                    Array.isArray(meta?.children) &&
                    meta.children.some((c: any) => isObjNode(c));

                  return (
                    <div key={String(meta?.key ?? `${pIdx}-${mIdx}`)} className="my-8">
                      <span className="font-bold font-inter">Meta {mIdx + 1}: </span>
                      <span className="font-base font-inter">{getLabel(meta)}</span>

                      {/* Caso 1: meta folha (2 níveis: Programa -> Meta -> checkboxes) */}
                      {!hasActs && (
                        <ul className="list-none mt-2 font-inter">
                          <li className="my-2">
                            <span>- {getLabel(meta)}</span>
                            <div className="flex gap-1">
                              {ensureSlots(meta?.children, 10).map((val: any, checkIdx: number) => (
                                <CheckboxDTT
                                  key={`${pIdx}-${mIdx}-meta-${checkIdx}`}
                                  value={val}
                                  disabled={isEdit}
                                  onChange={(newValue: any) =>
                                    updateMetaSlot(pIdx, mIdx, checkIdx, newValue)
                                  }
                                />
                              ))}
                            </div>
                          </li>
                        </ul>
                      )}

                      {/* Caso 2: meta com atos (3 níveis: Programa -> Meta -> Ato -> checkboxes) */}
                      {hasActs && (
                        <ul className="list-none mt-2 font-inter">
                          {(meta.children || [])
                            .filter((act: any) => isObjNode(act))
                            .map((act: any, aIdx: number) => (
                              <li className="my-2" key={String(act?.key ?? `${pIdx}-${mIdx}-${aIdx}`)}>
                                <span>- {getLabel(act)}</span>
                                <div className="flex gap-1">
                                  {ensureSlots(act?.children, 10).map((itm: any, checkIdx: number) => (
                                    <CheckboxDTT
                                      key={`${pIdx}-${mIdx}-${aIdx}-${checkIdx}`}
                                      value={itm}
                                      disabled={!!act?.disabled || isEdit}
                                      onChange={(newValue: any) =>
                                        updateActSlot(pIdx, mIdx, aIdx, checkIdx, newValue)
                                      }
                                    />
                                  ))}
                                </div>
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </AccordionTab>
            );
          })}
        </Accordion>
      </Card>
    </div>
  );
};
