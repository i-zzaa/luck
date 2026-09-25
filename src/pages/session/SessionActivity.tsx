// src/components/session/SessionActivity.tsx
import { memo, useState } from 'react';
import CheckboxDTT from '../../components/DTT';
import { HeaderPrograma } from '../../components/fielSetHeader/HeaderProgram';
import { CabecalhoMeta, CardGrupo, ItemTentativas, resumoGrupo } from './sessaoUi';

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

// Session.tsx renderiza SessionActivity/SessionPortage/SessionVBMapp/
// SessionMaintenance como irmãos que compartilham o mesmo hook de estado
// (useSessionForm) — sem memo, clicar num checkbox de QUALQUER uma das
// outras três seções re-renderiza essa árvore inteira também (o Session
// pai re-renderiza e passa de novo pra todo mundo), mesmo com list/dtt/
// isEdit/setDTT idênticos. Os props aqui já são referências estáveis
// (state/setters direto do hook, sem literal inline), então o memo
// funciona sem precisar de comparador customizado.
export const SessionActivity = memo(function SessionActivity({
  list = [],
  dtt = [],
  isEdit,
  setDTT,
}: Props) {
  // Um programa aberto por vez (o primeiro, ao entrar).
  const [aberto, setAberto] = useState<number | null>(0);

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
    <div className="flex flex-col gap-3">
      {source.map((programa: any, pIdx: number) => {
        const metas = Array.isArray(programa?.children) ? programa.children : [];

        // NÃO exibe o programa quando:
        // - não tem metas, OU
        // - todas as metas são "inválidas" (sem label real e sem atos com label)
        const hasRenderableMeta = metas.some((m: any) => metaIsRenderable(m));
        if (!metas.length || !hasRenderableMeta) return null;

        return (
          <CardGrupo
            key={String(programa?.key ?? pIdx)}
            titulo={getLabel(programa)}
            resumo={resumoGrupo(programa)}
            open={aberto === pIdx}
            onToggle={() => setAberto(aberto === pIdx ? null : pIdx)}
          >
            {renderHeaderPrograma(programa)}

            {metas.map((meta: any, mIdx: number) => {
              // preserva índices (não filtra), mas NÃO renderiza metas inválidas
              if (!metaIsRenderable(meta)) return null;

              const hasActs =
                Array.isArray(meta?.children) &&
                meta.children.some((c: any) => isObjNode(c));

              return (
                <div key={String(meta?.key ?? `${pIdx}-${mIdx}`)} className="flex flex-col gap-2.5">
                  <CabecalhoMeta numero={mIdx + 1} nome={getLabel(meta)} />

                  {/* Caso 1: meta folha (Programa -> Meta -> tentativas) */}
                  {!hasActs && (
                    <ItemTentativas nome={getLabel(meta)} slots={ensureSlots(meta?.children, 10)} leitura={isEdit}>
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
                    </ItemTentativas>
                  )}

                  {/* Caso 2: meta com atos (Programa -> Meta -> Ato -> tentativas) */}
                  {hasActs &&
                    (meta.children || [])
                      .filter((act: any) => isObjNode(act))
                      .map((act: any, aIdx: number) => (
                        <ItemTentativas
                          key={String(act?.key ?? `${pIdx}-${mIdx}-${aIdx}`)}
                          nome={getLabel(act)}
                          slots={ensureSlots(act?.children, 10)}
                          leitura={isEdit}
                        >
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
                        </ItemTentativas>
                      ))}
                </div>
              );
            })}
          </CardGrupo>
        );
      })}
    </div>
  );
});
