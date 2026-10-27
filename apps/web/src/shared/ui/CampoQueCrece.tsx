import { useLayoutEffect, useRef, type ComponentPropsWithoutRef } from 'react';

export interface CampoQueCreceProps extends Omit<
  ComponentPropsWithoutRef<'textarea'>,
  'value' | 'onChange' | 'rows'
> {
  value: string;
  onChange: (texto: string) => void;
}

export function CampoQueCrece({ value, onChange, className = '', ...props }: CampoQueCreceProps) {
  const campo = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const elemento = campo.current;
    if (elemento === null) return;
    elemento.style.height = 'auto';
    const borde = elemento.offsetHeight - elemento.clientHeight;
    elemento.style.height = `${String(elemento.scrollHeight + borde)}px`;
  }, [value]);

  return (
    <textarea
      {...props}
      ref={campo}
      rows={1}
      value={value}
      onChange={(evento) => {
        onChange(evento.target.value);
      }}
      className={`block min-h-field w-full resize-none overflow-hidden rounded-field border border-border bg-paper px-3.5 py-2.5 text-body-lg text-ink placeholder:text-text-3 ${className}`}
    />
  );
}
