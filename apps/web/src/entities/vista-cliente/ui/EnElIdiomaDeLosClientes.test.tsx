import {
  centavos,
  VIDRIERA_VACIA,
  vistaDelCliente,
  type EntregaQueSeCoordina,
  type Idioma,
  type TrabajoDelCliente,
} from '@maun/domain';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { cargarMensajesDelCliente, ConElIdiomaDelCliente } from '@/shared/idioma-del-cliente';

import type { MandarLaEntrega } from '../model/mandar';
import { VistaDelCliente } from './VistaDelCliente';

vi.mock('@/shared/api', () => ({
  urlDelArchivo: (ruta: string) => `https://cdn.maun.test/${ruta}`,
}));

const HOY = '2026-09-25';

const UN_DIA = {
  id: '0192a3b4-0000-7000-8000-000000000001',
  forma: 'un_dia',
  fecha: '2026-10-08',
  franja: 'manana',
} as const;

const SUS_DIAS = {
  id: '0192a3b4-0000-7000-8000-000000000002',
  forma: 'sus_dias',
  fecha: null,
  franja: null,
} as const;

function trabajo(idioma: Idioma, cambios: Partial<TrabajoDelCliente> = {}): TrabajoDelCliente {
  return {
    taller: 'Taller MAUN',
    cliente: 'Marcela Duarte',
    trabajo: 'Placard 3 puertas',
    idioma,
    direccion: 'Olazábal 1240, Ituzaingó',
    estado: 'en_curso',
    precio: centavos(124_000_000),
    sena: centavos(62_000_000),
    fechas: {
      estimativo: null,
      presupuesto: '2026-08-01',
      aprobado: '2026-08-04',
      inicio: '2026-08-24',
      entregaPautada: '2026-10-02',
      listo: null,
      entregado: null,
      cobro: null,
      valeHasta: null,
    },
    visita: { dia: null, hecha: false },
    entrega: { comprometida: null, propuesta: null, respuesta: null },
    pago: {
      instancia: 'saldo',
      formas: ['transferencia', 'efectivo'],
      monto: centavos(44_000_000),
      siguiente: null,
    },
    cobro: {
      alias: 'maun.muebles',
      cbu: '0110001312345678901233',
      titular: 'Ana Gutiérrez',
      cuit: '27-30123456-4',
      link: null,
    },
    pagos: [{ id: 'p1', fecha: '2026-08-04', concepto: '', monto: centavos(80_000_000) }],
    archivos: [],
    vidriera: VIDRIERA_VACIA,
    valorDelRelevamiento: null,
    ...cambios,
  };
}

function listo(idioma: Idioma, entrega: Partial<EntregaQueSeCoordina>): TrabajoDelCliente {
  return trabajo(idioma, {
    fechas: {
      estimativo: null,
      presupuesto: '2026-08-01',
      aprobado: '2026-08-04',
      inicio: '2026-08-24',
      entregaPautada: '2026-10-02',
      listo: '2026-09-24',
      entregado: null,
      cobro: null,
      valeHasta: null,
    },
    entrega: { comprometida: null, propuesta: null, respuesta: null, ...entrega },
  });
}

async function dibujar(idioma: Idioma, datos: TrabajoDelCliente, alMandar?: MandarLaEntrega) {
  const m = await cargarMensajesDelCliente(idioma);
  return render(
    <ConElIdiomaDelCliente idioma={idioma}>
      <VistaDelCliente
        vista={vistaDelCliente(datos, HOY, m.vista.delDominio)}
        hoy={HOY}
        alMandar={alMandar}
      />
    </ConElIdiomaDelCliente>,
  );
}

async function tocar(dentro: HTMLElement, nombre: string) {
  await act(async () => {
    fireEvent.click(within(dentro).getByRole('button', { name: nombre }));
    await Promise.resolve();
  });
}

const EN_CASTELLANO = [
  'Tu mueble',
  'Pagaste',
  'Seña',
  'seña',
  'Te falta',
  'Dirección',
  'Empezamos',
  'Cómo pagar',
  'Lo que pagaste',
  'Fotos y planos',
  'Esta página',
  'Copiar',
  'efectivo',
  'transferencia',
  'Coordinemos',
  'mañana',
];

beforeAll(async () => {
  await Promise.all([cargarMensajesDelCliente('en'), cargarMensajesDelCliente('pt-BR')]);
}, 60_000);

describe('la página del cliente en inglés', () => {
  it('dice el trabajo, las cifras y los datos en inglés, con la plata a su manera', async () => {
    const { container } = await dibujar('en', trabajo('en'));

    const entrada = screen.getByRole('region', { name: 'Your furniture' });
    expect(entrada).toHaveTextContent("We're building it");
    expect(entrada).toHaveTextContent('Left to payARS 440,000');
    expect(entrada).toHaveTextContent('PriceARS 1,240,000');
    expect(entrada).toHaveTextContent('You paidARS 800,000');

    const datos = screen.getByRole('region', { name: 'Job details' });
    expect(datos).toHaveTextContent('AddressOlazábal 1240, Ituzaingó');
    expect(datos).toHaveTextContent('We startedMon, Aug 24');
    expect(datos).toHaveTextContent('Estimated deliveryFri, Oct 2');
    expect(datos).toHaveTextContent('DepositARS 620,000 · paid');

    const pagos = screen.getByRole('region', { name: "What you've paid" });
    expect(pagos).toHaveTextContent('PaymentTue, Aug 4');
    expect(pagos).toHaveTextContent(
      'Payments show up here when we record them, not the moment you transfer.',
    );

    expect(screen.getByRole('region', { name: 'Where it stands' })).toHaveTextContent(
      "The next thing you'll see here is the delivery.",
    );
    expect(screen.getByRole('region', { name: 'Photos and drawings' })).toHaveTextContent(
      'No photos yet',
    );
    for (const palabra of EN_CASTELLANO) expect(container.textContent).not.toContain(palabra);
  });

  it('en cómo pagar, el importe que se pega en el banco queda como en Argentina', async () => {
    await dibujar('en', trabajo('en'));

    const como = screen.getByRole('region', { name: 'How to pay' });
    expect(como).toHaveTextContent('Now, the balance$ 440.000');
    for (const boton of [
      'Copy amount',
      'Copy alias',
      'Copy CBU',
      'Copy account holder',
      'Copy CUIT',
    ]) {
      expect(within(como).getByRole('button', { name: boton })).toBeInTheDocument();
    }
    expect(como).toHaveTextContent("Account holder's CUIT27-30123456-4");
    expect(como).toHaveTextContent(
      'You can also pay the balance in cash, in person, by arranging it with us.',
    );
  });

  it('con la entrega comprometida, el titular es la buena noticia en inglés', async () => {
    await dibujar('en', listo('en', { comprometida: { fecha: '2026-10-08', franja: 'manana' } }));

    expect(
      screen.getByText("Good news! We're delivering on Thu, Oct 8, in the morning."),
    ).toBeInTheDocument();
  });

  it('en la vista previa, lo del cliente va en inglés y lo del dueño en su idioma', async () => {
    await dibujar('en', listo('en', { propuesta: UN_DIA }));

    const seccion = screen.getByRole('region', { name: "Let's set up the delivery" });
    expect(within(seccion).getByText('Thu, Oct 8, in the morning')).toBeInTheDocument();
    expect(
      within(seccion).getByRole('button', { name: "That day doesn't work" }),
    ).toBeInTheDocument();
    const aviso = within(seccion).getByText('Acá no se guarda nada: así lo ve tu cliente.');
    expect(aviso).toHaveAttribute('lang', 'es-AR');

    await tocar(seccion, 'Works for me');
    expect(
      within(seccion).getByText(
        "Con «Works for me», la entrega queda comprometida y tu cliente lee arriba: «Good news! We're delivering on Thu, Oct 8, in the morning.»",
      ),
    ).toHaveAttribute('lang', 'es-AR');
    expect(within(seccion).getByRole('button', { name: 'Volver a empezar' })).toHaveAttribute(
      'lang',
      'es-AR',
    );
  });
});

describe('la página del cliente en portugués', () => {
  it('el calendario nombra los días y los meses en portugués, con la semana desde el lunes', async () => {
    const mandar = vi.fn<MandarLaEntrega>(() => Promise.resolve({ tipo: 'guardada' }));
    await dibujar('pt-BR', listo('pt-BR', { propuesta: SUS_DIAS }), mandar);

    expect(screen.getByText('Seu móvel está pronto')).toBeInTheDocument();
    const seccion = screen.getByRole('region', { name: 'Vamos combinar a entrega' });
    expect(within(seccion).getByRole('heading', { name: 'Setembro' })).toBeInTheDocument();
    expect(within(seccion).getByRole('heading', { name: 'Outubro' })).toBeInTheDocument();
    expect(within(seccion).getByRole('group', { name: 'Setembro' })).toHaveTextContent(
      /^SetembroSTQQSSD/u,
    );

    await tocar(seccion, 'Enviar meus dias');
    expect(within(seccion).getByRole('alert')).toHaveTextContent(
      'Marque pelo menos um dia ou escreva quando fica bom para você.',
    );

    await tocar(seccion, 'quinta-feira, 1º de outubro');
    const horario = within(seccion).getByRole('group', {
      name: 'Horário de quinta-feira, 1º de outubro',
    });
    expect(within(horario).getByRole('button', { name: 'De manhã' })).toBeInTheDocument();
    expect(within(horario).getByRole('button', { name: 'À tarde' })).toBeInTheDocument();
    expect(
      within(seccion).getByRole('button', { name: 'Tirar quinta-feira, 1º de outubro' }),
    ).toBeInTheDocument();

    await tocar(seccion, 'Enviar meus dias');
    expect(within(seccion).getByText('qui., 1º de out., de manhã ou à tarde')).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('status')
        .some((aviso) => aviso.textContent.includes('Pronto: recebemos seus dias.')),
    ).toBe(true);
  });
});
