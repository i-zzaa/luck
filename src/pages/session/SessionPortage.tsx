// src/components/session/SessionPortage.tsx
import { memo } from 'react';
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

const isObjNode = (n: any) => n && typeof n === 'object' && !Array.isArray(n);
const getLabel = (n: any) => n?.label ?? n?.value ?? n?.nome ?? '—';
const ensureSlots = (arr: any[] | undefined, count = 10) =>
  Array.isArray(arr) && arr.length
    ? arr
    : Array.from({ length: count }, () => null);

// Ver comentário equivalente em SessionActivity.tsx: sem memo, essa árvore
// (a mais pesada das quatro — Programa->Meta->Ato->10 slots) re-renderiza
// inteira toda vez que QUALQUER outra seção da tela de Sessão muda de
// estado, mesmo com as próprias props (listPortage/portage/isEdit/
// setPortage) idênticas.
export const SessionPortage = memo(function SessionPortage({
  listPortage = [],
  portage = [],
  isEdit,
  setPortage,
}: Props) {
  const source =
    Array.isArray(portage) && portage.length ? portage : listPortage || [];
  if (!Array.isArray(source) || !source.length) return null;

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

  // path acumula índices [programaIdx, metaIdx, (opcional) actIdx]
  const renderItems = (node: any, path: number[] = []): JSX.Element | null => {
    if (!Array.isArray(node?.children)) return null;

    const hasActs = node.children.some((c: any) => isObjNode(c));

    // Folha (2 níveis: Programa -> Meta -> slots)
    if (!hasActs) {
      const slots = ensureSlots(node.children, 10);
      return (
        <div key={String(node?.key ?? path.join('-'))}>
          <span className="block font-medium mb-[0.5]">- {getLabel(node)}</span>
          <div className="flex gap-1 my-2">
            {slots.map((v: any, slot: number) => renderCheckbox(path, slot, v))}
          </div>
        </div>
      );
    }

    // Nó interno (3 níveis: Programa -> Meta -> Ato -> slots)
    return (
      <div key={String(node?.key ?? path.join('-'))} className="my-2">
        <span className="font-bold font-inter">Meta {path[1] + 1}: </span>
        <span className="font-base font-inter">{getLabel(node)}</span>
        {(node.children || [])
          .filter((child: any) => isObjNode(child))
          .map((child: any, idx: number) => renderItems(child, [...path, idx]))}
      </div>
    );
  };

  const renderCheckbox = (path: number[], slot: number, value: any) => {
    const [pIdx, mIdx, actIdx] = path; // actIdx pode ser undefined (meta folha)

    return (
      <CheckboxDTT
        key={`${actIdx ?? 0}-${slot}`}
        value={value}
        disabled={isEdit}
        onChange={(newValue: any) => {
          const updated = [...source];
          const programa = { ...(updated[pIdx] || {}) };
          const metas = Array.isArray(programa.children)
            ? [...programa.children]
            : [];
          const meta = { ...(metas[mIdx] || {}) };

          // Caso 1: meta com atos (actIdx é número)
          if (typeof actIdx === 'number') {
            const acts = Array.isArray(meta.children) ? [...meta.children] : [];
            const act = { ...(acts[actIdx] || {}) };
            const slots = ensureSlots(act.children, 10).slice();

            if (slots[slot] === newValue) return;

            slots[slot] = newValue;
            act.children = slots;
            acts[actIdx] = act;
            meta.children = acts;
          } else {
            // Caso 2: meta folha
            const slots = ensureSlots(meta.children, 10).slice();
            if (slots[slot] === newValue) return;

            slots[slot] = newValue;
            meta.children = slots;
          }

          metas[mIdx] = meta;
          programa.children = metas;
          updated[pIdx] = programa;
          setPortage(updated);
        }}
      />
    );
  };

  return (
    <div className="mt-8">
      <div className="text-gray-400 font-inter grid justify-start mx-2 mt-8 leading-4">
        <span className="font-bold">Portage</span>
      </div>
      <Card className="rounded-lg max-w-[100%]">
        <Accordion>
          {source.map((programa: any, pIdx: number) => {
            const metas = Array.isArray(programa?.children)
              ? programa.children
              : [];
            if (metas.length === 0) return null; // não mostrar programa sem meta

            return (
              <AccordionTab
                tabIndex={pIdx}
                key={String(programa?.key ?? pIdx)}
                className="p-accordion-content-padding-zero"
                header={
                  <div className="flex items-center w-full">
                    <span>{getLabel(programa)}</span>
                  </div>
                }
              >
                {metas.map((meta: any, mIdx: number) => (
                  <div
                    key={String(meta?.key ?? `${pIdx}-${mIdx}`)}
                    className="my-2 grid gap-2 items-center"
                  >
                    <div className="flex flex-col gap-1">
                      {renderHeaderPrograma(meta)}
                      {/* recursão parte da meta; path = [programa, meta] */}
                      {renderItems(meta, [pIdx, mIdx])}
                    </div>
                  </div>
                ))}
              </AccordionTab>
            );
          })}
        </Accordion>
      </Card>
    </div>
  );
});
