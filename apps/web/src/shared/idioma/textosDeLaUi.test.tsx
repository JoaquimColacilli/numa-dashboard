import { IDIOMAS } from '@maun/domain';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { cargarMensajesDelCliente, ConElIdiomaDelCliente } from '@/shared/idioma-del-cliente';
import { RotuloDelPresupuesto } from '@/shared/ui';

import { cargarMensajes } from './mensajes';
import type { TextosDeLaUiQueVeElCliente } from './textosDeLaUi';

function comoTexto(textos: TextosDeLaUiQueVeElCliente): string {
  return JSON.stringify({
    ...textos,
    rotulo: { ...textos.rotulo, numero: textos.rotulo.numero('«N»') },
    visor: { ...textos.visor, cuenta: textos.visor.cuenta('«A»', '«T»') },
  });
}

describe('los textos compartidos de lo que ve el cliente', () => {
  it.each(IDIOMAS)('en %s dicen lo mismo en la app y en la familia del cliente', async (idioma) => {
    const app = (await cargarMensajes(idioma)).ui;
    const delCliente = (await cargarMensajesDelCliente(idioma)).ui;
    expect(comoTexto(delCliente)).toBe(
      comoTexto({ hoja: app.hoja, copiar: app.copiar, rotulo: app.rotulo, visor: app.visor }),
    );
  });

  it('adentro de lo que ve el cliente, el rótulo habla en su idioma aunque la app esté en castellano', async () => {
    render(
      <ConElIdiomaDelCliente idioma="pt-BR">
        <RotuloDelPresupuesto numero="0012" revision={2} emitido="2026-09-17" />
      </ConElIdiomaDelCliente>,
    );

    const rotulo = await screen.findByLabelText('Carimbo do orçamento');
    expect(within(rotulo).getByText('Orçamento')).toBeInTheDocument();
    expect(within(rotulo).getByText('17 set. 2026')).toBeInTheDocument();
  });

  it('afuera, el rótulo sigue en el idioma de la app, como hoy', () => {
    render(<RotuloDelPresupuesto numero="0012" revision={2} emitido="2026-09-17" />);

    const rotulo = screen.getByLabelText('Rótulo del presupuesto');
    expect(within(rotulo).getByText('Presupuesto')).toBeInTheDocument();
    expect(within(rotulo).getByText('17/09/26')).toBeInTheDocument();
  });
});
