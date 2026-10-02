import { IDIOMAS } from '@maun/domain';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { cargarMensajes } from '@/shared/idioma';
import { cargarMensajesDelCliente, ConElIdiomaDelCliente } from '@/shared/idioma-del-cliente';

import { useTextosDelPdf } from './textos';

function enIngles({ children }: { children: ReactNode }) {
  return <ConElIdiomaDelCliente idioma="en">{children}</ConElIdiomaDelCliente>;
}

describe('lo que dice el PDF mientras se arma', () => {
  it.each(IDIOMAS)('en %s dice lo mismo en la app y en la familia del cliente', async (idioma) => {
    const app = (await cargarMensajes(idioma)).pdf;
    const { preparando, noSePudo } = (await cargarMensajesDelCliente(idioma)).presupuesto.pdf;
    expect({ preparando, noSePudo }).toEqual(app);
  });

  it('adentro de lo que ve el cliente, en su idioma', async () => {
    const { result } = renderHook(() => useTextosDelPdf(), { wrapper: enIngles });

    await waitFor(() => {
      expect(result.current.preparando).toBe('Preparing the PDF…');
    });
    expect(result.current.noSePudo).toBe("We couldn't create the PDF. Tap again to try once more.");
  });

  it('afuera, en el idioma de la app, como hoy', () => {
    const { result } = renderHook(() => useTextosDelPdf());

    expect(result.current).toEqual({
      preparando: 'Preparando el PDF…',
      noSePudo: 'No pudimos armar el PDF. Tocá de nuevo para probar otra vez.',
    });
  });
});
