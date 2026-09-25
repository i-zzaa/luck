// src/components/CheckboxTree.tsx
import React from 'react';
import CheckboxDTT from '../../components/DTT';
import { ItemTentativas } from './sessaoUi';

interface CheckboxTreeProps {
  node: any;
  path: number[];
  isEdit: boolean;
  setStateFn: (updater: (prev: any[]) => any[]) => void;
  repeatCount: number;
}

export const CheckboxTree: React.FC<CheckboxTreeProps> = ({
  node,
  path,
  isEdit,
  setStateFn,
  repeatCount,
}) => {
  if (!Array.isArray(node.children)) return null;

  // detecta leaf: filhos são slots (null ou primitivos)
  const first = node.children[0];
  const isLeaf =
    first == null || typeof first !== 'object' || !('label' in first);

  if (isLeaf) {
    return (
      <ItemTentativas key={node.key} nome={node.label} slots={node.children} leitura={isEdit}>
          {node.children.map((val: any, idx: number) => {
            const slot = idx;
            const key = [...path, slot].join('.');
            return (
              <CheckboxDTT
                key={key}
                value={val}
                disabled={isEdit}
                onChange={(newValue: any) =>
                  setStateFn((prev) => {
                    const next = JSON.parse(JSON.stringify(prev));
                    let target: any = next;
                    // navega pelo path até chegar no array de slots
                    path.forEach((i) => {
                      target = target[i].children;
                    });
                    target[slot] = newValue;
                    return next;
                  })
                }
              />
            );
          })}
      </ItemTentativas>
    );
  }

  // ainda não leaf: desce para cada child
  return (
    <div key={node.key} className="flex flex-col gap-2.5">
      {node.children.map((child: any, i: number) => (
        <CheckboxTree
          key={child.key}
          node={child}
          path={[...path, i]}
          isEdit={isEdit}
          setStateFn={setStateFn}
          repeatCount={repeatCount}
        />
      ))}
    </div>
  );
};
