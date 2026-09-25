import { useLayoutEffect, useRef } from 'react';
import { Controller } from 'react-hook-form';
import clsx from 'clsx';

// Textarea ligada ao react-hook-form que cresce com o texto, em vez da
// altura fixa de InputAdd/InputTextarea (4–8 linhas mesmo pra "Apontar").
// Rótulo fixo em cima (não o label-float), então o placeholder volta a
// aparecer — label.css deixa todo placeholder de textarea transparente.
export function AutoTextarea({
  id,
  label,
  control,
  placeholder,
  disabled,
  autoFocus,
  invalid,
  onValueChange,
}: {
  id: string;
  label: string;
  control: any;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  invalid?: boolean;
  onValueChange?: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-gray-800">
      {label}
      <Controller
        name={id}
        control={control}
        render={({ field: { ref, ...field } }: any) => (
          <GrowingTextarea
            {...field}
            inputRef={ref}
            value={field.value ?? ''}
            onChange={(e: any) => {
              field.onChange(e.target.value);
              onValueChange?.(e.target.value);
            }}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            invalid={invalid}
          />
        )}
      />
    </label>
  );
}

function GrowingTextarea({ value, invalid, disabled, inputRef, ...rest }: any) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);

  return (
    <textarea
      {...rest}
      ref={(el) => {
        ref.current = el;
        inputRef?.(el);
      }}
      value={value}
      disabled={disabled}
      rows={2}
      className={clsx(
        'resize-none overflow-hidden rounded-[10px] px-3 py-2.5 text-[15px] leading-[1.4] font-normal text-[#27272a] placeholder:text-[#71717a]',
        invalid ? 'border-[1.5px] border-[#b91c1c]' : 'border border-gray-300',
        disabled && 'bg-background text-gray-800'
      )}
    />
  );
}
