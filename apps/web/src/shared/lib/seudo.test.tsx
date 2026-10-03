import { isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { seudoCatalogo, seudoTexto } from './seudo';

describe('el seudoidioma', () => {
  it('acentúa las letras, alarga un 40 % y encierra entre ⟦ ⟧', () => {
    expect(seudoTexto('Guardar')).toBe('⟦Ĝûáŕðáŕ~~~⟧');
    expect(seudoTexto('Hoy')).toBe('⟦Ĥöý~~⟧');
    expect(seudoTexto('$ 1.500')).toMatch(/^⟦\$ 1\.500~+⟧$/u);
  });

  it('pasa todo el catálogo: los textos, las funciones con su resultado y las listas', () => {
    function Fuerte({ children }: { children: ReactNode }) {
      return <b>{children}</b>;
    }
    const catalogo = {
      titulo: 'Inicio',
      saludo: (nombre: string) => `Hola, ${nombre}`,
      saldo: (monto: string, Envoltorio: typeof Fuerte) => (
        <>
          Te quedan <Envoltorio>{monto}</Envoltorio>
        </>
      ),
      dias: ['lun', 'mar'],
    };
    const seudo = seudoCatalogo(catalogo);

    expect(seudo.titulo).toBe('⟦Îñîçîö~~~⟧');
    expect(seudo.saludo('Eliseo')).toMatch(/^⟦Ĥöļá, Éļîšéö~+⟧$/u);
    expect(seudo.dias).toEqual(['⟦ļûñ~~⟧', '⟦ɱáŕ~~⟧']);
    const saldo = seudo.saldo('$ 10', Fuerte);
    expect(isValidElement(saldo)).toBe(true);
    expect(renderToStaticMarkup(<>{saldo}</>)).toBe(
      '<span data-seudo="">⟦Te quedan <b>$ 10</b>⟧</span>',
    );
  });
});
