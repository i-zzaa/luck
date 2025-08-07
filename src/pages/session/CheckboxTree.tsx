import React from "react";
import CheckboxDTT from "../../components/DTT";

interface CheckboxTreeProps {
  node: any;
  path: number[];
  isEdit: boolean;
  setStateFn: (updater: (prev: any) => any) => void;
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

  // detecta se é leaf: filhos são slots (null/primitivo)
  const first = node.children[0];
  const isLeaf =
    first == null || typeof first !== "object" || !("label" in first);

  if (isLeaf) {
    return (
      <div key={node.key} className="my-2">
        {/* mostra o label do subitem antes dos checkboxes */}
        <span className="block font-medium mb-2">- {node.label}</span>
        <div className="flex flex-wrap gap-1 ml-[-1rem]">
          {node.children.map((val: any, idx: number) => {
            const slot = idx;
            const key = [...path, slot].join(".");
            return (
              <CheckboxDTT
                key={key}
                value={val}
                disabled={isEdit}
                onChange={(newValue: any) =>
                  setStateFn((prev: any[]) => {
                    const next: any[] = JSON.parse(JSON.stringify(prev));
                    // navega até o array de slots
                    let target: any = next;
                    for (let i = 0; i < path.length; i++) {
                      target = target[path[i]].children;
                    }
                    target[slot] = newValue;
                    return next;
                  })
                }
              />
            );
          })}
        </div>
      </div>
    );
  }

  // se não for leaf, desce mais um nível
  return (
    <div key={node.key} className="ml-4">
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
