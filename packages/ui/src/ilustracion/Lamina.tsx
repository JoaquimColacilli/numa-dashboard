import type { ReactNode } from 'react';

export interface LaminaProps {
  children: ReactNode;
  className?: string;
  deLaMarca?: boolean;
}

export function Lamina({ children, className = '', deLaMarca = false }: LaminaProps) {
  return (
    <div
      aria-hidden="true"
      translate="no"
      data-lamina=""
      className={['lamina', deLaMarca ? 'lamina-de-la-marca' : '', className]
        .filter((clase) => clase !== '')
        .join(' ')}
    >
      {children}
    </div>
  );
}
