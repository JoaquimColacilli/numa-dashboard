import {
  borradorNuevo,
  centavos,
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
