// src/components/session/SessionPortage.tsx
import { memo, useState } from 'react';
import CheckboxDTT from '../../components/DTT';
import { HeaderPrograma } from '../../components/fielSetHeader/HeaderProgram';
import { CabecalhoMeta, CardGrupo, ItemTentativas, resumoGrupo } from './sessaoUi';

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
  // Um grupo (área · faixa) aberto por vez — o primeiro, ao entrar.
  const [aberto, setAberto] = useState<number | null>(0);

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
    // path = [programa, meta] na meta; [programa, meta, ato] no ato
    const ehMeta = path.length === 2;

    if (!hasActs) {
      const slots = ensureSlots(node.children, 10);
      const item = (
        <ItemTentativas nome={getLabel(node)} slots={slots} leitura={isEdit}>
          {slots.map((v: any, slot: number) => renderCheckbox(path, slot, v))}
        </ItemTentativas>
      );
      return (
        <div key={String(node?.key ?? path.join('-'))} className="flex flex-col gap-2.5">
          {ehMeta && <CabecalhoMeta numero={path[1] + 1} nome={getLabel(node)} />}
          {item}
        </div>
      );
    }

    return (
      <div key={String(node?.key ?? path.join('-'))} className="flex flex-col gap-2.5">
        {ehMeta && <CabecalhoMeta numero={path[1] + 1} nome={getLabel(node)} />}
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
    <div className="flex flex-col gap-3">
      {source.map((programa: any, pIdx: number) => {
        const metas = Array.isArray(programa?.children) ? programa.children : [];
        if (metas.length === 0) return null; // não mostrar programa sem meta

        return (
          <CardGrupo
            key={String(programa?.key ?? pIdx)}
            titulo={getLabel(programa)}
            resumo={resumoGrupo(programa)}
            open={aberto === pIdx}
            onToggle={() => setAberto(aberto === pIdx ? null : pIdx)}
          >
            {metas.map((meta: any, mIdx: number) => (
              <div key={String(meta?.key ?? `${pIdx}-${mIdx}`)} className="flex flex-col gap-2.5">
                {/* Portage: SD/Resposta/SR+ vêm em cada meta */}
                {renderHeaderPrograma(meta)}
                {/* recursão parte da meta; path = [programa, meta] */}
                {renderItems(meta, [pIdx, mIdx])}
              </div>
            ))}
          </CardGrupo>
        );
      })}
    </div>
  );
});
