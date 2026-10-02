import {
  borradorNuevo,
  centavos,
  centavosEn,
  CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE,
  cotizacion,
  cuentasDelPresupuesto,
  documentoDelPresupuesto,
  plantillaDeSiempre,
  puntosBasicos,
  valoresDelTrabajo,
  type DocumentoDelPresupuesto,
  type Idioma,
  type Moneda,
  type PresupuestoAceptado,
  type PresupuestoMandado,
} from '@maun/domain';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { formatosDelDocumento } from '@/shared/idioma-del-cliente';

import { ElPresupuesto, ElPresupuestoAceptado } from './ElPresupuesto';

function documento(idioma: Idioma): DocumentoDelPresupuesto {
  const plantilla = plantillaDeSiempre(idioma);
  return documentoDelPresupuesto(
    {
      borrador: {
        ...borradorNuevo({
          titulo: 'Cocina de Lucía',
          obra: '',
          plantilla,
          validezDias: 15,
          idNuevo: () => 'm1',
        }),
        muebles: [{ id: 'm1', nombre: 'Bajomesada', descripcion: 'Melamina blanca.' }],
      },
      plantilla,
      taller: {
        nombre: 'Taller MAUN',
        titular: 'Julián Ferro',
        cuit: '20-12345678-6',
        condicionFiscal: 'monotributo',
        domicilio: '',
        telefono: '11 4088-2210',
        email: '',
      },
      cliente: 'Lucía Ferreyra',
      moneda: 'ARS',
      cobraEn: null,
      valores: valoresDelTrabajo(centavos(124_800_000), []),
      senaBp: puntosBasicos(5_000),
      abonado: centavos(0),
    },
    formatosDelDocumento(idioma),
  );
}

function mandado(idioma: Idioma): PresupuestoMandado {
  const elDocumento = documento(idioma);
  return {
    etapa: 'mandado',
    numero: '20260910-01',
    revision: 2,
    idioma,
    mandadoEl: '2026-09-10',
    documento: elDocumento,
    cuentas:
      elDocumento.valores === null
        ? []
        : cuentasDelPresupuesto<Moneda>(elDocumento.valores, elDocumento.senaBp, centavos(0)),
    queCambio: 'Pasamos la alacena a Gris Grafito.',
    valeHasta: '2026-09-25',
    vencio: null,
    pideLaSena: true,
  };
}

function aceptado(idioma: Idioma): PresupuestoAceptado {
  const {
    etapa: _,
    queCambio: __,
    valeHasta: ___,
    vencio: ____,
    pideLaSena: _____,
    ...comun
  } = mandado(idioma);
  return { ...comun, etapa: 'aceptado', aceptadoEl: '2026-09-12', letra: null, acordado: null };
}

describe('el presupuesto que ve el cliente, en el idioma de su revisión', () => {
  it('en inglés, la app escribe en inglés y lo que escribió el taller queda como está', async () => {
    render(<ElPresupuesto presupuesto={mandado('en')} hoy="2026-09-12" hayComoPagar />);

    const presupuesto = await screen.findByRole('region', { name: 'Quote' });
    expect(presupuesto.closest('[lang]')).toHaveAttribute('lang', 'en-US');
    expect(within(presupuesto).getByText('What changed in revision 2')).toBeInTheDocument();
    expect(within(presupuesto).getByText('Pasamos la alacena a Gris Grafito.')).toHaveAttribute(
      'translate',
      'no',
    );
    expect(within(presupuesto).getByText('Details')).toBeInTheDocument();
    expect(within(presupuesto).getByText("What's included")).toBeInTheDocument();
    expect(within(presupuesto).getByText('ARS 1,248,000')).toHaveAttribute('translate', 'no');
    expect(within(presupuesto).getByText('Deposit (50%)')).toBeInTheDocument();
    expect(within(presupuesto).getByText('30 business days')).toBeInTheDocument();
    expect(within(presupuesto).getByText(/^Until /)).toBeInTheDocument();
    expect(within(presupuesto).getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
    expect(within(presupuesto).getByRole('link', { name: 'Message the shop' })).toHaveAttribute(
      'href',
      `https://wa.me/5491140882210?text=${encodeURIComponent("Hi, I'm writing about quote No. 20260910-01 Rev. 2.")}`,
    );
  });

  it('la leyenda de ARCA queda en castellano y en inglés se aclara al lado', async () => {
    render(<ElPresupuesto presupuesto={mandado('en')} hoy="2026-09-12" hayComoPagar />);

    const leyenda = await screen.findByText('Documento no válido como factura');
    expect(leyenda).toHaveAttribute('lang', 'es-AR');
    expect(leyenda).toHaveAttribute('translate', 'no');
    expect(screen.getByText('Not valid as an invoice.')).toBeInTheDocument();
  });

  it('en castellano dice lo de siempre, sin la aclaración', async () => {
    render(<ElPresupuesto presupuesto={mandado('es')} hoy="2026-09-12" hayComoPagar />);

    const presupuesto = await screen.findByRole('region', { name: 'El presupuesto' });
    expect(within(presupuesto).getByText('Qué cambió en la revisión 2')).toBeInTheDocument();
    expect(within(presupuesto).getByText('$ 1.248.000')).toBeInTheDocument();
    expect(within(presupuesto).getByText('Seña (50%)')).toBeInTheDocument();
    expect(within(presupuesto).getByText(/^Hasta el /)).toBeInTheDocument();
    expect(within(presupuesto).getByText('Documento no válido como factura')).toBeInTheDocument();
    expect(within(presupuesto).queryByText('No válido como factura.')).not.toBeInTheDocument();
  });

  it('el aceptado en portugués', async () => {
    render(<ElPresupuestoAceptado presupuesto={aceptado('pt-BR')} />);

    const presupuesto = await screen.findByRole('region', {
      name: 'O orçamento que você aceitou',
    });
    expect(presupuesto.closest('[lang]')).toHaveAttribute('lang', 'pt-BR');
    expect(within(presupuesto).getByText('Ver os detalhes')).toBeInTheDocument();
    expect(within(presupuesto).getByRole('button', { name: 'Baixar o PDF' })).toBeInTheDocument();
  });
});

describe('el presupuesto en dólares que ve el cliente', () => {
  function enDolares(idioma: Idioma): PresupuestoMandado {
    const plantilla = plantillaDeSiempre(idioma);
    const elDocumento = documentoDelPresupuesto(
      {
        borrador: {
          ...borradorNuevo({
            titulo: 'Cocina de Lucía',
            obra: '',
            plantilla,
            validezDias: 15,
            idNuevo: () => 'm1',
          }),
          muebles: [{ id: 'm1', nombre: 'Bajomesada', descripcion: 'Melamina blanca.' }],
        },
        plantilla,
        taller: {
          nombre: 'Taller MAUN',
          titular: '',
          cuit: '',
          condicionFiscal: null,
          domicilio: '',
          telefono: '',
          email: '',
        },
        cliente: 'Lucía Ferreyra',
        moneda: 'USD',
        cobraEn: null,
        valores: valoresDelTrabajo(centavosEn('USD', 240_000), []),
        senaBp: puntosBasicos(5_000),
        abonado: centavosEn('USD', 0),
        referencia: { cotizacion: cotizacion(154_000), fecha: '2026-10-01' },
      },
      formatosDelDocumento(idioma),
    );
    return {
      etapa: 'mandado',
      numero: '20261001-01',
      revision: 1,
      idioma,
      mandadoEl: '2026-10-01',
      documento: elDocumento,
      cuentas:
        elDocumento.valores === null
          ? []
          : cuentasDelPresupuesto<Moneda>(
              elDocumento.valores,
              elDocumento.senaBp,
              centavosEn('USD', 8_276),
            ),
      queCambio: null,
      valeHasta: '2026-10-16',
      vencio: null,
      pideLaSena: true,
    };
  }

  it('cada importe va en dólares, con sus pesos y el dólar del día debajo del total y de la seña', async () => {
    render(<ElPresupuesto presupuesto={enDolares('es')} hoy="2026-10-02" hayComoPagar />);

    const presupuesto = await screen.findByRole('region', { name: 'El presupuesto' });
    expect(within(presupuesto).getByText('US$ 2.400')).toHaveAttribute('translate', 'no');
    expect(within(presupuesto).getAllByText('US$ 1.200')).not.toHaveLength(0);
    expect(within(presupuesto).getByText('US$ 82,76')).toBeInTheDocument();
    expect(within(presupuesto).getByText('US$ 1.117,24')).toBeInTheDocument();
    expect(
      within(presupuesto).getByText(
        'Son $ 3.696.000 con el dólar a $ 1.540, el que vale para pagos del 1 de octubre de 2026.',
      ),
    ).toBeInTheDocument();
    expect(
      within(presupuesto).getByText(
        'Son $ 1.848.000 con el dólar a $ 1.540, el que vale para pagos del 1 de octubre de 2026.',
      ),
    ).toBeInTheDocument();
    expect(within(presupuesto).queryByText(/^\$ [\d.,]+$/)).toBeNull();
  });

  it('la cláusula de la moneda va debajo de la forma de pago, como la escribió el taller', async () => {
    render(<ElPresupuesto presupuesto={enDolares('es')} hoy="2026-10-02" hayComoPagar />);

    const presupuesto = await screen.findByRole('region', { name: 'El presupuesto' });
    const moneda = within(presupuesto).getByText('Moneda');
    const formaDePago = within(presupuesto).getByText('Forma de pago');
    expect(
      formaDePago.compareDocumentPosition(moneda) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      within(presupuesto).getByText(CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE.dolaresEnPesos),
    ).toHaveAttribute('translate', 'no');
  });

  it('en inglés, los pesos de la referencia van con su código y el dólar con el suyo', async () => {
    render(<ElPresupuesto presupuesto={enDolares('en')} hoy="2026-10-02" hayComoPagar />);

    const presupuesto = await screen.findByRole('region', { name: 'Quote' });
    expect(within(presupuesto).getByText('US$2,400')).toBeInTheDocument();
    expect(
      within(presupuesto).getByText(
        "That's ARS 3,696,000 at ARS 1,540 per dollar, the rate for payments made on October 1, 2026.",
      ),
    ).toBeInTheDocument();
    expect(within(presupuesto).getByText('Currency')).toBeInTheDocument();
  });

  it('un presupuesto en pesos no lleva referencia ni moneda', async () => {
    render(<ElPresupuesto presupuesto={mandado('es')} hoy="2026-09-12" hayComoPagar />);

    const presupuesto = await screen.findByRole('region', { name: 'El presupuesto' });
    expect(within(presupuesto).queryByText(/con el dólar a/)).toBeNull();
    expect(within(presupuesto).queryByText('Moneda')).toBeNull();
  });
});
