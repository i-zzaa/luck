import { useState } from 'react';
import clsx from 'clsx';
import { Controller, useWatch } from 'react-hook-form';
import {
  STATUS_META_LABEL_CURTO,
  STATUS_META_PILL_CLASS,
} from '../../constants/protocolo';
import { AutoTextarea } from './AutoTextarea';
import { metaConclusaoFieldId, metaObsFieldId } from './metaObsField';

interface MetaCardProps {
  meta: any;
  index: number;
  control: any;
  open: boolean;
  onToggle: () => void;
  // Manual (pei): meta em texto livre — descrição editável, observação,
  // conclusão e menu (duplicar/excluir). Portage/VB-MAPP reaproveitam o
  // card só pra editar os itens de uma meta que vem do protocolo.
  isPei: boolean;
  invalid: boolean;
  focusId: string | null;
  onDescChange: () => void;
  onAddItem: (afterIndex?: number) => void;
  onRemoveItem: (index: number) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

// Um card por meta: recolhido mostra um resumo (descrição em 2 linhas,
// nº de itens, se tem observação/conclusão); aberto mostra os campos.
// Quem decide qual está aberto é o pai (uma meta aberta por vez).
export function MetaCard({
  meta,
  index,
  control,
  open,
  onToggle,
  isPei,
  invalid,
  focusId,
  onDescChange,
  onAddItem,
  onRemoveItem,
  onDuplicate,
  onRemove,
}: MetaCardProps) {
  const subitems: any[] = meta.subitems || [];
  const obsId = metaObsFieldId(meta.id);
  const conclusaoId = metaConclusaoFieldId(meta.id);

  const [desc, obs, conclusao, ...itens] = useWatch({
    control,
    name: [meta.id, obsId, conclusaoId, ...subitems.map((s) => s.id)],
  }) as any[];

  // Observação/conclusão são opcionais: ficam atrás de um botão "+" até
  // serem usadas — ou abertas direto quando já têm texto.
  const [showObs, setShowObs] = useState(false);
  const [showConclusao, setShowConclusao] = useState(false);
  const [focusOpcional, setFocusOpcional] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const obsVisivel = isPei && (showObs || !!obs);
  const conclusaoVisivel = isPei && (showConclusao || !!conclusao);

  const itensPreenchidos = itens.filter((v) => `${v ?? ''}`.trim()).length;
  const status = meta.status;
  const numero = index + 1;

  return (
    <article
      className={clsx(
        'relative bg-white rounded-[14px]',
        invalid ? 'border-[1.5px] border-[#b91c1c]' : 'border border-gray-200'
      )}
    >
      <div className="flex items-start">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex-1 min-w-0 min-h-[56px] flex flex-col gap-1.5 pt-3.5 pb-3 pl-3.5 pr-1 text-left"
        >
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-bold text-[#27272a]">
              Meta {numero}
            </span>
            {status && STATUS_META_LABEL_CURTO[status] && (
              <span
                className={clsx(
                  'whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                  STATUS_META_PILL_CLASS[status]
                )}
              >
                {STATUS_META_LABEL_CURTO[status]}
              </span>
            )}
          </span>
          {!open && (
            <>
              {/* Tailwind 3.2 não tem line-clamp nativo */}
              <span
                className="text-[14px] leading-[1.4] text-[#3f3f46] overflow-hidden"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {desc || 'Sem descrição'}
              </span>
              <span className="flex items-center gap-2.5 text-[12px] font-semibold text-gray-800">
                <span>
                  {itensPreenchidos} {itensPreenchidos === 1 ? 'item' : 'itens'}
                </span>
                {!!obs && (
                  <span className="flex items-center gap-1">
                    <i className="pi pi-pencil text-[11px]" />
                    Observação
                  </span>
                )}
                {!!conclusao && (
                  <span className="flex items-center gap-1">
                    <i className="pi pi-check text-[11px]" />
                    Conclusão
                  </span>
                )}
              </span>
            </>
          )}
        </button>

        {isPei && (
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={`Mais ações da meta ${numero}`}
            aria-expanded={menuOpen}
            className="w-11 h-11 mt-1.5 shrink-0 flex items-center justify-center rounded-full text-gray-800"
          >
            <i className="pi pi-ellipsis-h" />
          </button>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={`${open ? 'Recolher' : 'Abrir'} meta ${numero}`}
          className="w-11 h-11 mt-1.5 mr-1.5 shrink-0 flex items-center justify-center rounded-full text-primary"
        >
          <i
            className={clsx(
              'pi pi-chevron-down transition-transform',
              open && 'rotate-180'
            )}
          />
        </button>
      </div>

      {menuOpen && (
        <>
          {/* fecha o menu ao tocar fora dele */}
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-[4] cursor-default"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="menu"
            className="absolute top-[52px] right-[50px] z-[5] w-[188px] p-1.5 flex flex-col bg-white border border-gray-200 rounded-xl shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onDuplicate();
              }}
              className="h-11 flex items-center gap-2.5 px-2.5 rounded-lg text-[14px] font-semibold text-[#27272a] text-left"
            >
              <i className="pi pi-copy" />
              Duplicar meta
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onRemove();
              }}
              className="h-11 flex items-center gap-2.5 px-2.5 rounded-lg text-[14px] font-semibold text-[#b91c1c] text-left"
            >
              <i className="pi pi-trash" />
              Excluir meta
            </button>
          </div>
        </>
      )}

      {open && (
        <div className="flex flex-col gap-3.5 px-3.5 pb-4">
          <AutoTextarea
            id={meta.id}
            label="Descrição"
            control={control}
            placeholder="O que a criança deve conseguir fazer?"
            disabled={!isPei}
            autoFocus={focusId === meta.id}
            invalid={invalid}
            onValueChange={onDescChange}
          />
          {invalid && (
            <span className="-mt-2 text-[13px] font-semibold text-[#b91c1c]">
              Descreva a meta ou exclua-a pelo menu ⋯
            </span>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-gray-800">
              Itens
            </span>
            {subitems.map((subitem, i) => (
              <div
                key={subitem.id}
                className="flex items-center h-11 border border-gray-300 rounded-[10px] bg-white overflow-hidden focus-within:border-2 focus-within:border-primary"
              >
                <span className="w-[34px] shrink-0 text-center text-[13px] font-bold text-primary">
                  {i + 1}
                </span>
                <Controller
                  name={subitem.id}
                  control={control}
                  render={({ field }: any) => (
                    <input
                      {...field}
                      value={field.value ?? ''}
                      aria-label={`Item ${i + 1}`}
                      placeholder="Novo item"
                      autoComplete="off"
                      autoFocus={focusId === subitem.id}
                      // Enter cria o próximo item logo abaixo — e não
                      // submete o <form> de Protocolo.tsx que envolve
                      // esta tela.
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();
                        onAddItem(i);
                      }}
                      className="flex-1 min-w-0 h-full px-1 border-0 bg-transparent text-[15px] text-[#27272a] outline-none placeholder:text-[#71717a]"
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => onRemoveItem(i)}
                  aria-label={`Excluir item ${i + 1}`}
                  className="w-11 h-full shrink-0 flex items-center justify-center text-[#71717a]"
                >
                  <i className="pi pi-times text-[14px]" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onAddItem()}
              className="self-start h-11 flex items-center gap-2 px-2.5 rounded-[10px] text-[14px] font-bold text-primary"
            >
              <i className="pi pi-plus text-[13px]" />
              Adicionar item
            </button>
          </div>

          {obsVisivel && (
            <AutoTextarea
              id={obsId}
              label="Observação"
              control={control}
              placeholder="Algo a registrar sobre esta meta"
              autoFocus={focusOpcional === 'obs'}
            />
          )}
          {conclusaoVisivel && (
            <AutoTextarea
              id={conclusaoId}
              label="Conclusão"
              control={control}
              placeholder="Como a meta foi concluída"
              autoFocus={focusOpcional === 'conclusao'}
            />
          )}

          {isPei && (!obsVisivel || !conclusaoVisivel) && (
            <div className="flex flex-wrap gap-2">
              {!obsVisivel && (
                <ChipOpcional
                  label="Observação"
                  onClick={() => {
                    setShowObs(true);
                    setFocusOpcional('obs');
                  }}
                />
              )}
              {!conclusaoVisivel && (
                <ChipOpcional
                  label="Conclusão"
                  onClick={() => {
                    setShowConclusao(true);
                    setFocusOpcional('conclusao');
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function ChipOpcional({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Adicionar ${label.toLowerCase()}`}
      className="h-9 flex items-center gap-1.5 px-3.5 rounded-full border border-dashed border-primary bg-[#faf5fc] text-[13px] font-bold text-primary"
    >
      <i className="pi pi-plus text-[11px]" />
      {label}
    </button>
  );
}
