import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { Lamina } from '../ilustracion/Lamina.tsx';

export interface TarjetaConLaminaProps extends Omit<
  ComponentPropsWithoutRef<'section'>,
  'children'
> {
  dibujo: ReactNode;
  children: ReactNode;
  como?: 'section' | 'div';
  lamina?: string;
  apilada?: boolean;
}

const LADO_A_LADO = {
  grilla: 'grid grid-cols-1 gap-1.5 @min-[40rem]/con-lamina:grid-cols-2',
  lamina: 'h-49 @min-[40rem]/con-lamina:h-auto @min-[40rem]/con-lamina:min-h-70',
  texto:
    '@container flex min-w-0 flex-col items-start gap-2 px-3.5 pt-4 pb-3.5 @min-[40rem]/con-lamina:justify-center @min-[40rem]/con-lamina:px-8 @min-[40rem]/con-lamina:py-8',
};

const APILADA = {
  grilla: 'grid grid-cols-1 gap-1.5',
  lamina: 'h-49 @min-[40rem]/con-lamina:h-60',
  texto: '@container flex min-w-0 flex-col items-start gap-2 px-3.5 pt-4 pb-3.5',
};

export function TarjetaConLamina({
  dibujo,
  children,
  como: Como = 'section',
  lamina = '',
  apilada = false,
  className = '',
  ...resto
}: TarjetaConLaminaProps) {
  const reparto = apilada ? APILADA : LADO_A_LADO;
  return (
    <Como
      {...resto}
      data-tarjeta-con-lamina=""
      className={[
        '@container/con-lamina rounded-panel border border-hairline bg-paper p-1.5',
        className,
      ].join(' ')}
    >
      <div className={reparto.grilla}>
        <Lamina className={[reparto.lamina, lamina].join(' ')}>{dibujo}</Lamina>
        <div className={reparto.texto}>{children}</div>
      </div>
    </Como>
  );
}
