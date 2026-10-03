import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConElIdiomaDelCliente } from './ConElIdiomaDelCliente';
import { useFormatosDelCliente, useMensajesDelCliente } from './contexto';

function ComoPagar() {
  const m = useMensajesDelCliente();
  const f = useFormatosDelCliente();
  return (
    <p>
      {m.vista.delDominio.comoPagar.titulo}: {f.pesos(150_000)}
    </p>
  );
}

describe('el idioma de lo que ve el cliente', () => {
  it('en castellano está listo desde el primer cuadro, con su lang', () => {
    render(
      <ConElIdiomaDelCliente idioma="es">
        <ComoPagar />
      </ConElIdiomaDelCliente>,
    );

    const texto = screen.getByText('Cómo pagar: $ 1.500');
    expect(texto.closest('[lang]')).toHaveAttribute('lang', 'es-AR');
  });

  it('en otro idioma lo trae, escribe la plata a su manera y marca su lang', async () => {
    render(
      <ConElIdiomaDelCliente idioma="pt-BR" mientrasCarga={<p>…</p>}>
        <ComoPagar />
      </ConElIdiomaDelCliente>,
    );

    const texto = await screen.findByText('Como pagar: ARS 1.500');
    expect(texto.closest('[lang]')).toHaveAttribute('lang', 'pt-BR');
  });

  it('adentro de la app del dueño en castellano, lo del cliente sigue en su idioma', async () => {
    render(
      <ConElIdiomaDelCliente idioma="en">
        <ComoPagar />
      </ConElIdiomaDelCliente>,
    );

    expect(await screen.findByText('How to pay: ARS 1,500')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('es-AR');
  });

  it('sin el idioma explícito no se puede leer', () => {
    expect(() => render(<ComoPagar />)).toThrow('ConElIdiomaDelCliente');
  });
});
