// src/components/session/SessionVBMapp.tsx
import React, { useState } from "react";
import { HeaderPrograma } from "../../components/fielSetHeader/HeaderProgram";
import { CheckboxTree } from "./CheckboxTree";
import { CabecalhoMeta, CardGrupo, resumoGrupo } from "./sessaoUi";

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
  // Um programa aberto por vez — o primeiro, ao entrar.
  const [aberto, setAberto] = useState<string | null>(null);

  const source = (Array.isArray(vbmapp) && vbmapp.length) ? vbmapp : (listVBMapp || []);
  if (!Array.isArray(source) || !source.length) return null;

  // Nível e programa num card só ("Nível 1 · Mando"), em vez de um
  // accordion dentro do outro. O índice do programa é o ORIGINAL em
  // nivel.children (o path do CheckboxTree navega a árvore por ele) — antes
  // era o índice depois de filtrar os programas sem metas, e um programa
  // vazio antes de outro fazia o toque cair no programa errado.
  const grupos: { chave: string; titulo: string; programa: any; nIdx: number; pIdx: number }[] = [];
  source.forEach((nivel: any, nIdx: number) => {
    (Array.isArray(nivel?.children) ? nivel.children : []).forEach((programa: any, pIdx: number) => {
      if (!Array.isArray(programa?.children) || !programa.children.length) return;
      grupos.push({
        chave: String(programa?.key ?? `${nIdx}-${pIdx}`),
        titulo: `${getLabel(nivel)} · ${getLabel(programa)}`,
        programa,
        nIdx,
        pIdx,
      });
    });
  });
  if (!grupos.length) return null;
  const abertoEfetivo = aberto === null ? grupos[0].chave : aberto;

  return (
    <div className="flex flex-col gap-3">
      {grupos.map(({ chave, titulo, programa, nIdx, pIdx }) => (
        <CardGrupo
          key={chave}
          titulo={titulo}
          resumo={resumoGrupo(programa)}
          open={abertoEfetivo === chave}
          onToggle={() => setAberto(abertoEfetivo === chave ? '' : chave)}
        >
          <HeaderPrograma {...programa} />
          {programa.children.map((meta: any, mIdx: number) => (
            <div key={String(meta?.key ?? `${nIdx}-${pIdx}-${mIdx}`)} className="flex flex-col gap-2.5">
              <CabecalhoMeta numero={mIdx + 1} nome={getLabel(meta)} />
              {/* dispara o CheckboxTree a partir da meta */}
              <CheckboxTree
                node={meta}
                path={[nIdx, pIdx, mIdx]}
                isEdit={isEdit}
                setStateFn={setVBMapp}
                repeatCount={10}
              />
            </div>
          ))}
        </CardGrupo>
      ))}
    </div>
  );
});
