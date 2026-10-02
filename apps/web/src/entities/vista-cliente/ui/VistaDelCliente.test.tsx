import {
  borradorNuevo,
  centavos,
  COORDINAMOS_LA_ENTREGA_AL_APROBAR,
  documentoDelPresupuesto,
  PLANTILLA_DE_SIEMPRE,
  puntosBasicos,
  SIGUE_CON_LA_SENA_CUBIERTA,
  valoresDelTrabajo,
  VIDRIERA_VACIA,
  vistaDelCliente,
  type DatosDelTaller,
  type DocumentoDelPresupuesto,
  type Formatos,
  type OpcionDelTrabajo,
  type PresupuestoDelTrabajo,
  type TrabajoDelCliente,
} from '@maun/domain';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formatearPesos, formatearPorcentaje } from '@/shared/lib';

import { SIN_PAGOS_APROBADO } from '../model/textos';
import { VistaDelCliente } from './VistaDelCliente';

vi.mock('@/shared/api', () => ({
  urlDelArchivo: (ruta: string) => `https://cdn.maun.test/${ruta}`,
}));

const HOY = '2026-09-18';

const HACE_TANTOS_DIAS = /[Hh]ace \d/;

function fechas(cambios: Partial<TrabajoDelCliente['fechas']>): TrabajoDelCliente['fechas'] {
  return {
    estimativo: null,
    presupuesto: null,
    aprobado: null,
    inicio: null,
    entregaPautada: null,
    listo: null,
    entregado: null,
    cobro: null,
    valeHasta: null,
    ...cambios,
  };
}

function trabajo(cambios: Partial<TrabajoDelCliente> = {}): TrabajoDelCliente {
  return {
    taller: 'Taller MAUN',
    cliente: 'Marcela Duarte',
    trabajo: 'Placard 3 puertas',
    idioma: 'es',
    direccion: 'Olazábal 1240, Ituzaingó',
    estado: 'en_curso',
    precio: centavos(124_000_000),
    sena: centavos(62_000_000),
    fechas: fechas({
      presupuesto: '2026-08-01',
      aprobado: '2026-08-04',
      inicio: '2026-08-24',
      entregaPautada: '2026-10-02',
    }),
    visita: { dia: null, hecha: false },
    entrega: { comprometida: null, propuesta: null, respuesta: null },
    pago: {
      instancia: 'saldo',
      formas: ['efectivo'],
      monto: centavos(44_000_000),
      siguiente: null,
    },
    cobro: { alias: null, cbu: null, titular: null, cuit: null, link: null },
    pagos: [
      { id: 'p1', fecha: '2026-08-04', concepto: 'Seña', monto: centavos(40_000_000) },
      { id: 'p2', fecha: '2026-09-16', concepto: 'Adelanto', monto: centavos(40_000_000) },
    ],
    archivos: [],
    vidriera: VIDRIERA_VACIA,
    valorDelRelevamiento: null,
    ...cambios,
  };
}

function dibujar(datos: TrabajoDelCliente) {
  return render(<VistaDelCliente vista={vistaDelCliente(datos, HOY)} hoy={HOY} />);
}

describe('la vista del cliente', () => {
  it('muestra el trabajo, el cliente y los tres importes', () => {
    dibujar(trabajo());

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Placard 3 puertas');
    expect(screen.getByText('Marcela Duarte')).toBeInTheDocument();
    const entrada = screen.getByRole('region', { name: 'Tu mueble' });
    expect(entrada).toHaveTextContent('$ 1.240.000');
    expect(entrada).toHaveTextContent('$ 800.000');
    expect(entrada).toHaveTextContent('$ 440.000');
  });

  it('la vidriera del taller va al final del apoyo, justo antes de la nota del final', () => {
    const { container } = dibujar(
      trabajo({
        vidriera: {
          redes: {
            instagram: 'https://www.instagram.com/taller.maun/',
            facebook: null,
            tiktok: null,
          },
          fotos: [],
        },
      }),
    );
    const vidriera = screen.getByRole('region', { name: 'El taller en las redes' });
    const nota = container.querySelector('[data-fin-de-la-vista]');
    expect(vidriera.nextElementSibling).toBe(nota);
    expect(screen.getByRole('link', { name: '@taller.maun en Instagram' })).toBeInTheDocument();
  });

  it('sin nada en la vidriera, la página queda como estaba', () => {
    const { container } = dibujar(trabajo());
    expect(container.querySelector('[data-vidriera]')).toBeNull();
  });

  it('antes de la entrega la cifra grande es la etapa, y el saldo queda en la fila de abajo', () => {
    dibujar(trabajo());

    const entrada = screen.getByRole('region', { name: 'Tu mueble' });
    expect(within(entrada).getByText('Lo estamos fabricando')).toBeInTheDocument();
    expect(within(entrada).getByText('Te falta pagar')).toBeInTheDocument();
  });

  it('desde la entrega, con saldo, la cifra grande pasa a ser lo que falta pagar', () => {
    dibujar(
      trabajo({
        estado: 'entregado',
        fechas: fechas({
          presupuesto: '2026-08-01',
          aprobado: '2026-08-04',
          inicio: '2026-08-24',
          entregaPautada: '2026-09-16',
          entregado: '2026-09-16',
        }),
      }),
    );

    const entrada = screen.getByRole('region', { name: 'Tu mueble' });
    const etiquetas = within(entrada).getAllByText(/Te falta pagar|Ya está instalado en tu casa/);
    expect(etiquetas.length).toBeGreaterThan(0);
    expect(entrada).toHaveTextContent('Te falta pagar');
    expect(entrada).toHaveTextContent('Ya está instalado en tu casa');
    expect(entrada).toHaveTextContent('Entregado el mié 16 sep');
  });

  it('el camino tiene los cinco hitos y los que faltan no muestran fecha', () => {
    dibujar(trabajo());

    const camino = screen.getByRole('region', { name: 'En qué anda' });
    expect(within(camino).getByText('Presupuesto enviado')).toBeInTheDocument();
    expect(within(camino).getByText('Lo estamos fabricando')).toBeInTheDocument();
    expect(within(camino).getByText('Lo llevamos y lo instalamos')).toBeInTheDocument();
    expect(within(camino).getByText('Cuando esté saldado')).toBeInTheDocument();
    expect(
      within(camino).getByText('Lo próximo que vas a ver acá es la entrega.'),
    ).toBeInTheDocument();
  });

  it('entregado y pagado, el camino queda completo: los cinco pasos tildados y ninguno en curso', () => {
    dibujar(
      trabajo({
        estado: 'cobrado',
        fechas: fechas({
          presupuesto: '2026-08-01',
          aprobado: '2026-08-04',
          inicio: '2026-08-24',
          entregaPautada: '2026-09-16',
          entregado: '2026-09-16',
          cobro: '2026-09-17',
        }),
        pagos: [
          { id: 'p1', fecha: '2026-08-04', concepto: 'Seña', monto: centavos(40_000_000) },
          { id: 'p2', fecha: '2026-09-17', concepto: 'Saldo final', monto: centavos(84_000_000) },
        ],
      }),
    );

    const camino = screen.getByRole('region', { name: 'En qué anda' });
    const pasos = within(camino).getAllByRole('listitem');
    expect(pasos).toHaveLength(5);
    expect(pasos.filter((paso) => paso.querySelector('svg.lucide-check') !== null)).toHaveLength(5);
    expect(pasos[4]).toHaveTextContent('Listo, está saldado');
    expect(pasos[4]).toHaveTextContent('jue 17 sep');
  });

  it('cuando hace días que no pasa nada, no se lo cuenta: dice qué sigue', () => {
    const dibujada = dibujar(
      trabajo({
        pagos: [],
        fechas: fechas({
          presupuesto: '2026-08-01',
          inicio: '2026-09-01',
          entregaPautada: '2026-10-02',
        }),
      }),
    );

    expect(screen.getByText('Lo próximo que vas a ver acá es la entrega.')).toBeInTheDocument();
    expect(dibujada.container).not.toHaveTextContent(HACE_TANTOS_DIAS);
  });

  it('lista los pagos con su concepto y su día', () => {
    dibujar(trabajo());

    const pagos = screen.getByRole('region', { name: 'Lo que pagaste' });
    expect(within(pagos).getByText('Seña')).toBeInTheDocument();
    expect(within(pagos).getByText('Adelanto')).toBeInTheDocument();
    expect(pagos).toHaveTextContent('$ 400.000');
  });

  it('aprobado y sin pagos, dice que lo primero es la seña', () => {
    dibujar(trabajo({ pagos: [] }));

    expect(screen.getByText(SIN_PAGOS_APROBADO)).toBeInTheDocument();
  });

  it('antes de aprobar no dice nada de pagos: no tenerlos es lo normal', () => {
    dibujar(trabajo({ estado: 'presupuesto_enviado', pagos: [] }));

    const pagos = screen.getByRole('region', { name: 'Lo que pagaste' });
    expect(pagos).not.toHaveTextContent(SIN_PAGOS_APROBADO);
    expect(pagos).not.toHaveTextContent(/registramos/);
  });

  it('muestra los archivos que llegaron: las fotos se tocan para verlas y los PDF se abren aparte', () => {
    dibujar(
      trabajo({
        archivos: [
          {
            id: 'a1',
            nombre: 'Plano de frente',
            tipo: 'image/webp',
            ancho: 1600,
            alto: 900,
            fecha: '2026-08-02T12:00:00+00:00',
            ruta: 'h/p/a1.webp',
            rutaMini: 'h/p/a1.mini.webp',
          },
          {
            id: 'a2',
            nombre: 'Presupuesto 2026-041.pdf',
            tipo: 'application/pdf',
            ancho: null,
            alto: null,
            fecha: '2026-08-01T12:00:00+00:00',
            ruta: 'h/p/a2.pdf',
            rutaMini: 'h/p/a2.pdf',
          },
        ],
      }),
    );

    const galeria = screen.getByRole('region', { name: 'Fotos y planos' });
    expect(galeria).toHaveTextContent('2 archivos');
    const miniatura = within(galeria).getByRole('button', { name: 'Ver Plano de frente' });
    expect(miniatura.querySelector('img')).toHaveAttribute(
      'src',
      'https://cdn.maun.test/h/p/a1.mini.webp',
    );
    expect(galeria.querySelector('a[target="_blank"] img')).toBeNull();
    const pdf = within(galeria).getByRole('link', { name: /Presupuesto 2026-041.pdf/ });
    expect(pdf).toHaveAttribute('href', 'https://cdn.maun.test/h/p/a2.pdf');
    expect(pdf).toHaveAttribute('target', '_blank');
  });

  it('tocar una foto la abre en el visor, sin nada del dueño, y al cerrarlo el foco vuelve a la miniatura', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    const foto = (id: string, nombre: string) => ({
      id,
      nombre,
      tipo: 'image/webp',
      ancho: 1600,
      alto: 900,
      fecha: '2026-08-02T12:00:00+00:00',
      ruta: `h/p/${id}.webp`,
      rutaMini: `h/p/${id}.mini.webp`,
    });
    dibujar(trabajo({ archivos: [foto('a1', 'Plano de frente'), foto('a3', 'Render')] }));

    const miniatura = screen.getByRole('button', { name: 'Ver Plano de frente' });
    fireEvent.click(miniatura);
    expect(document.activeElement).not.toBe(miniatura);

    const visor = screen.getByRole('dialog', { name: 'Plano de frente' });
    expect(within(visor).getByRole('img', { name: 'Plano de frente' })).toHaveAttribute(
      'src',
      'https://cdn.maun.test/h/p/a1.webp',
    );
    expect(visor).toHaveTextContent('1 de 2');
    expect(within(visor).queryByRole('button', { name: /Borrar/ })).not.toBeInTheDocument();
    expect(visor).not.toHaveTextContent('KB');
    fireEvent.click(within(visor).getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByRole('dialog', { name: 'Render' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(document.activeElement).toBe(miniatura);
    vi.unstubAllGlobals();
  });

  it('sin archivos dice qué va a aparecer ahí, sin disculparse', () => {
    dibujar(trabajo());

    expect(screen.getByText('Todavía no hay fotos')).toBeInTheDocument();
  });

  it('un trabajo aprobado sin presupuesto no inventa un saldo', () => {
    dibujar(trabajo({ precio: null, sena: null, pagos: [] }));

    const entrada = screen.getByRole('region', { name: 'Tu mueble' });
    expect(entrada).toHaveTextContent('Falta el presupuesto');
    expect(entrada).toHaveTextContent('—');
  });
});

describe('la tarjeta de datos, desde la aprobación', () => {
  it('trae la dirección, el inicio, la entrega estimada y la seña acordada', () => {
    dibujar(trabajo());

    const tarjeta = screen.getByRole('region', { name: 'Datos del trabajo' });
    expect(tarjeta).toHaveTextContent('DirecciónOlazábal 1240, Ituzaingó');
    expect(tarjeta).toHaveTextContent('Empezamoslun 24 ago');
    expect(tarjeta).toHaveTextContent('Entrega estimadavie 2 oct');
    expect(tarjeta).toHaveTextContent('Seña$ 620.000 · pagada');
  });

  it('la seña de la tarjeta es la del porcentaje, no el primer pago', () => {
    dibujar(
      trabajo({
        pagos: [
          { id: 'r', fecha: '2026-08-01', concepto: 'Relevamiento', monto: centavos(12_000_000) },
          { id: 's', fecha: '2026-08-04', concepto: 'Seña', monto: centavos(50_000_000) },
        ],
      }),
    );

    const tarjeta = screen.getByRole('region', { name: 'Datos del trabajo' });
    expect(tarjeta).toHaveTextContent('Seña$ 620.000 · pagada');
    expect(tarjeta).not.toHaveTextContent('$ 120.000');
  });

  it('aprobado sin la seña completa, la tarjeta dice cuánto falta de ella', () => {
    dibujar(
      trabajo({
        pagos: [],
        pago: {
          instancia: 'sena',
          formas: ['efectivo'],
          monto: centavos(62_000_000),
          siguiente: null,
        },
      }),
    );

    expect(screen.getByRole('region', { name: 'Datos del trabajo' })).toHaveTextContent(
      'Seña$ 620.000 · te faltan $ 620.000',
    );
  });

  it('con todo pagado, debajo de la seña va el total, también pagado', () => {
    dibujar(
      trabajo({
        estado: 'cobrado',
        fechas: fechas({
          presupuesto: '2026-08-01',
          aprobado: '2026-08-04',
          inicio: '2026-08-24',
          entregaPautada: '2026-09-16',
          entregado: '2026-09-16',
          cobro: '2026-09-17',
        }),
        pagos: [
          { id: 'p1', fecha: '2026-08-04', concepto: 'Seña', monto: centavos(62_000_000) },
          { id: 'p2', fecha: '2026-09-17', concepto: 'Saldo final', monto: centavos(62_000_000) },
        ],
      }),
    );

    expect(screen.getByRole('region', { name: 'Datos del trabajo' })).toHaveTextContent(
      'Seña$ 620.000 · pagadaTotal$ 1.240.000 · pagado',
    );
  });

  it('mientras queda saldo, la tarjeta no muestra el total', () => {
    dibujar(trabajo());

    expect(screen.getByRole('region', { name: 'Datos del trabajo' })).not.toHaveTextContent(
      'Total',
    );
  });

  it('sin dirección ni fechas cargadas, cada dato dice que falta confirmarlo', () => {
    dibujar(trabajo({ direccion: '', fechas: fechas({}), sena: null }));

    const tarjeta = screen.getByRole('region', { name: 'Datos del trabajo' });
    expect(tarjeta).toHaveTextContent('DirecciónA confirmar');
    expect(tarjeta).toHaveTextContent('EmpezamosTodavía no');
    expect(tarjeta).toHaveTextContent('Entrega estimadaA confirmar');
    expect(tarjeta).toHaveTextContent('SeñaA confirmar');
  });

  it('no hay proyección: desde la aprobación la entrega ya está pautada', () => {
    dibujar(trabajo());

    expect(screen.queryByRole('region', { name: 'Para cuándo' })).not.toBeInTheDocument();
  });
});

describe('un trabajo con el presupuesto mandado y sin aprobar, con todo cargado', () => {
  function sinAprobar(cambios: Partial<TrabajoDelCliente> = {}): TrabajoDelCliente {
    return trabajo({
      trabajo: 'Escritorio',
      cliente: 'Lucía Ferreyra',
      estado: 'presupuesto_enviado',
      precio: centavos(124_800_000),
      sena: centavos(62_400_000),
      direccion: 'Belgrano 455, Haedo',
      fechas: fechas({ inicio: '2026-08-13', entregaPautada: '2026-10-10' }),
      pago: {
        instancia: 'sena',
        formas: ['efectivo'],
        monto: centavos(50_400_000),
        siguiente: { instancia: 'saldo', formas: ['efectivo'], monto: centavos(62_400_000) },
      },
      pagos: [
        {
          id: 'relevamiento',
          fecha: '2026-08-13',
          concepto: 'Relevamiento Tecnico',
          monto: centavos(12_000_000),
        },
      ],
      ...cambios,
    });
  }

  it('no promete una entrega, no dice que empezó y no muestra la tarjeta de datos', () => {
    const dibujada = dibujar(sinAprobar());

    expect(dibujada.container).not.toHaveTextContent('Entrega pautada');
    expect(dibujada.container).not.toHaveTextContent('Empezamos');
    expect(dibujada.container).not.toHaveTextContent('Belgrano 455');
    expect(screen.queryByRole('region', { name: 'Datos del trabajo' })).not.toBeInTheDocument();
  });

  it('en lo que fue pasando, el pago es un pago: ni la seña, ni la aprobación, ni la fabricación', () => {
    dibujar(sinAprobar());

    const historia = screen.getByRole('region', { name: 'Lo que fue pasando' });
    expect(historia).not.toHaveTextContent('Recibimos tu seña y quedó aprobado');
    expect(historia).not.toHaveTextContent('Empezamos a fabricarlo en el taller');
    expect(within(historia).getByText('Recibimos tu pago')).toBeInTheDocument();
    expect(historia).toHaveTextContent('$ 120.000');
    expect(within(historia).getAllByRole('listitem')).toHaveLength(1);
  });

  it('no le cobra una deuda: «Te falta pagar» no aparece', () => {
    const dibujada = dibujar(sinAprobar());

    expect(dibujada.container).not.toHaveTextContent('Te falta pagar');
  });

  it('lo que marcó en verde queda igual: lo próximo, y el relevamiento con su nombre en lo que pagaste', () => {
    dibujar(sinAprobar());

    expect(screen.getByText('Lo próximo es que lo apruebes y dejes la seña.')).toBeInTheDocument();
    const pagos = screen.getByRole('region', { name: 'Lo que pagaste' });
    expect(within(pagos).getByText('Relevamiento Tecnico')).toBeInTheDocument();
    expect(pagos).toHaveTextContent('$ 120.000');
  });

  it('arriba van el presupuesto, la seña para arrancar, lo que pagó y cuánto le queda', () => {
    dibujar(sinAprobar());

    const entrada = screen.getByRole('region', { name: 'Tu mueble' });
    expect(entrada).toHaveTextContent('Te pasamos el presupuesto');
    expect(entrada).toHaveTextContent('Presupuesto$ 1.248.000');
    expect(entrada).toHaveTextContent('Seña para arrancar$ 624.000');
    expect(entrada).toHaveTextContent('Pagaste$ 120.000');
    expect(entrada).toHaveTextContent(
      'Lo que pagaste queda a cuenta de la seña: te quedan $ 504.000 para completarla.',
    );
  });

  it('lo que le queda de la seña es el mismo número que le pide «Cómo pagar»', () => {
    dibujar(sinAprobar());

    const entrada = screen.getByRole('region', { name: 'Tu mueble' });
    const como = screen.getByRole('region', { name: 'Cómo pagar' });
    expect(entrada).toHaveTextContent('te quedan $ 504.000');
    expect(como).toHaveTextContent('Ahora, la seña');
    expect(como).toHaveTextContent('$ 504.000');
  });

  it('lo que pagó se cierra como a cuenta de la seña, no como una deuda', () => {
    dibujar(sinAprobar());

    const pagos = screen.getByRole('region', { name: 'Lo que pagaste' });
    expect(pagos).toHaveTextContent('A cuenta de la seña$ 120.000');
  });

  it('con la fecha límite cargada, en lugar de la tarjeta va la proyección', () => {
    dibujar(sinAprobar({ fechas: fechas({ valeHasta: '2026-10-02' }) }));

    const cuando = screen.getByRole('region', { name: 'Para cuándo' });
    expect(cuando).toHaveTextContent(
      'Si dejás la seña antes del vie 2 de octubre, podríamos tenerlo listo para el lun 2 de noviembre.',
    );
    expect(cuando).toHaveTextContent('Vamos tomando los trabajos a medida que entran las señas.');
  });

  it('sin fecha límite, no hay promesa: una línea y ninguna fecha', () => {
    dibujar(sinAprobar());

    const cuando = screen.getByRole('region', { name: 'Para cuándo' });
    expect(cuando).toHaveTextContent(
      'Cuando lo apruebes y dejes la seña, coordinamos la fecha de entrega.',
    );
    expect(cuando.textContent).not.toMatch(/\d/);
  });

  it('con la fecha límite ya pasada, no promete nada, deja de pedirle la seña y le pide que escriba', () => {
    dibujar(sinAprobar({ fechas: fechas({ valeHasta: '2026-09-17' }) }));

    expect(screen.queryByRole('region', { name: 'Para cuándo' })).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('podríamos');

    const como = screen.getByRole('region', { name: 'Cómo pagar' });
    expect(como).toHaveTextContent(
      'Este presupuesto venció el jue 17 sep. Escribile al taller para actualizarlo antes de pagar.',
    );
    expect(como).not.toHaveTextContent('Ahora, la seña');
    expect(como).not.toHaveTextContent('$ 504.000');
    expect(como).not.toHaveTextContent('en efectivo');
    expect(como).not.toHaveTextContent('Después, el saldo');

    const entrada = screen.getByRole('region', { name: 'Tu mueble' });
    expect(entrada).toHaveTextContent(
      'El presupuesto venció el jue 17 sep: escribile al taller para actualizarlo.',
    );
    expect(entrada).not.toHaveTextContent('te quedan');
    expect(entrada).toHaveTextContent('Presupuesto$ 1.248.000');
    expect(entrada).toHaveTextContent('Pagaste$ 120.000');
  });

  it('si lo que pagó ya cubre la seña, lo dice y no le pide nada', () => {
    dibujar(
      sinAprobar({
        pagos: [
          { id: 'grande', fecha: '2026-08-13', concepto: 'Adelanto', monto: centavos(70_000_000) },
        ],
        pago: { instancia: null, formas: [], monto: null, siguiente: null },
      }),
    );

    expect(screen.getByRole('region', { name: 'Tu mueble' })).toHaveTextContent(
      'Con lo que pagaste ya está cubierta la seña.',
    );
    expect(screen.queryByRole('region', { name: 'Cómo pagar' })).not.toBeInTheDocument();
  });
});

describe('antes de mandar el presupuesto', () => {
  it('con un pago, dice lo que pagó y que queda a cuenta de la seña; sin tarjeta ni proyección', () => {
    dibujar(
      trabajo({
        estado: 'a_presupuestar',
        precio: null,
        sena: null,
        direccion: 'Olazábal 1240',
        fechas: fechas({ inicio: '2026-08-13', entregaPautada: '2026-10-10' }),
        pago: { instancia: 'sena', formas: ['efectivo'], monto: null, siguiente: null },
        pagos: [
          { id: 'visita', fecha: '2026-08-13', concepto: 'Visita', monto: centavos(12_000_000) },
        ],
      }),
    );

    const entrada = screen.getByRole('region', { name: 'Tu mueble' });
    expect(entrada).toHaveTextContent('Estamos preparando tu presupuesto');
    expect(entrada).toHaveTextContent('Pagaste$ 120.000');
    expect(entrada).toHaveTextContent('Lo que pagaste queda a cuenta de la seña.');
    expect(entrada).not.toHaveTextContent('Te falta pagar');
    expect(screen.queryByRole('region', { name: 'Datos del trabajo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Para cuándo' })).not.toBeInTheDocument();
  });

  it('sin pagos, afuera del relevamiento no muestra ningún importe, y adentro solo lo que vale la visita', () => {
    const dibujada = dibujar(
      trabajo({
        estado: 'contacto',
        precio: null,
        sena: null,
        pagos: [],
        pago: { instancia: 'sena', formas: ['efectivo'], monto: null, siguiente: null },
        valorDelRelevamiento: centavos(12_000_000),
      }),
    );

    const bloque = screen.getByRole('region', { name: 'Relevamiento técnico' });
    expect(textoAfueraDe(dibujada.container, bloque)).not.toMatch(/\$/);
    expect(importes(bloque.textContent)).toEqual(['$ 120.000']);
  });
});

function textoAfueraDe(contenedor: HTMLElement, bloque: HTMLElement): string {
  return contenedor.textContent.replace(bloque.textContent, '');
}

function importes(texto: string): string[] {
  return texto.replace(/\s+/g, ' ').match(/\$ ?[\d.,]+/g) ?? [];
}

describe('el relevamiento técnico, mientras falta ir a medir', () => {
  beforeEach(() => {
    conPantalla('celular');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function estimativoSinMedir(valor: number | null): TrabajoDelCliente {
    return trabajo({
      estado: 'presupuesto_estimativo',
      precio: null,
      sena: null,
      pagos: [],
      pago: { instancia: 'sena', formas: ['efectivo'], monto: null, siguiente: null },
      fechas: fechas({ estimativo: '2026-09-15' }),
      valorDelRelevamiento: valor === null ? null : centavos(valor),
    });
  }

  it('abajo del camino explica qué es y cuánto vale, con el título en minúscula y en lugar de «lo próximo»', () => {
    dibujar(estimativoSinMedir(12_000_000));

    const camino = screen.getByRole('region', { name: 'En qué anda' });
    const bloque = within(camino).getByRole('region', { name: 'Relevamiento técnico' });
    expect(within(bloque).getByRole('heading', { level: 3 })).toHaveTextContent(
      'Relevamiento técnico',
    );
    expect(
      within(bloque)
        .getAllByRole('paragraph')
        .map((linea) => linea.textContent.replace(/\s+/g, ' ')),
    ).toEqual([
      'El siguiente paso es el relevamiento técnico en obra. Es una visita donde relevamos medidas exactas, revisamos instalaciones y definimos detalles constructivos para poder proyectar tu mueble al milímetro.',
      'A partir de ese relevamiento te entregamos el diseño 3D y el presupuesto final y definitivo.',
      'El valor del relevamiento es de $ 120.000 y, si decidís avanzar, se toma a cuenta como parte de la seña del proyecto.',
    ]);
    expect(within(camino).getByRole('list').compareDocumentPosition(bloque)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(camino).not.toHaveTextContent('lo próximo es ir a medir');
    expect(screen.getByRole('region', { name: 'Tu mueble' })).not.toHaveTextContent(
      'Relevamiento técnico',
    );
  });

  it('sin valor en Ajustes, explica qué es sin el precio', () => {
    const dibujada = dibujar(estimativoSinMedir(null));

    const bloque = screen.getByRole('region', { name: 'Relevamiento técnico' });
    expect(within(bloque).getAllByRole('paragraph')).toHaveLength(2);
    expect(bloque).not.toHaveTextContent('El valor del relevamiento');
    expect(dibujada.container.textContent).not.toMatch(/\$/);
  });

  it('con el presupuesto mandado o aprobado, no está', () => {
    for (const cambios of [
      {
        estado: 'presupuesto_enviado' as const,
        fechas: fechas({ presupuesto: '2026-09-14' }),
        visita: { dia: '2026-09-24', hecha: false },
      },
      { estado: 'en_curso' as const },
    ]) {
      const { unmount } = dibujar(
        trabajo({ ...cambios, valorDelRelevamiento: centavos(12_000_000) }),
      );
      expect(screen.queryByRole('region', { name: 'Relevamiento técnico' })).toBeNull();
      expect(document.body).not.toHaveTextContent('El valor del relevamiento');
      unmount();
    }
  });
});

function itemsDelCamino(): HTMLElement[] {
  const camino = screen.getByRole('region', { name: 'En qué anda' });
  return within(camino).getAllByRole('listitem');
}

function pasosDelCamino(): string[] {
  return itemsDelCamino().map((paso) => paso.textContent);
}

function tildado(paso: HTMLElement | undefined): boolean {
  return paso?.querySelector('svg.lucide-check') !== null;
}

describe('el camino tilda lo que pasó y deja en curso lo que falta', () => {
  it('con el presupuesto mandado, el paso queda tildado con su día y en curso queda que lo apruebe', () => {
    dibujar(
      trabajo({
        estado: 'presupuesto_enviado',
        fechas: fechas({ presupuesto: '2026-09-15' }),
        pagos: [],
        pago: {
          instancia: 'sena',
          formas: ['efectivo'],
          monto: centavos(62_000_000),
          siguiente: null,
        },
      }),
    );

    const [presupuesto, aprobado, fabricacion] = itemsDelCamino();
    expect(tildado(presupuesto)).toBe(true);
    expect(presupuesto).toHaveTextContent('Presupuesto enviado');
    expect(presupuesto).toHaveTextContent('mar 15 sep');
    expect(presupuesto).not.toHaveAttribute('aria-current');
    expect(aprobado).toHaveAttribute('aria-current', 'step');
    expect(aprobado).toHaveTextContent('Cuando lo apruebes y dejes la seña');
    expect(tildado(aprobado)).toBe(false);
    expect(fabricacion).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('region', { name: 'Tu mueble' })).toHaveTextContent(
      'Te pasamos el presupuesto',
    );
    expect(
      screen
        .getAllByRole('listitem')
        .filter((paso) => paso.getAttribute('aria-current') === 'step'),
    ).toHaveLength(1);
  });

  it('con la seña ya cubierta antes de aprobar, ni el camino ni «Para cuándo» se la vuelven a pedir', () => {
    dibujar(
      trabajo({
        estado: 'presupuesto_enviado',
        fechas: fechas({ presupuesto: '2026-09-15' }),
        pagos: [{ id: 's', fecha: '2026-09-16', concepto: 'Seña', monto: centavos(62_000_000) }],
        pago: { instancia: null, formas: [], monto: null, siguiente: null },
      }),
    );

    const [, aprobado] = itemsDelCamino();
    expect(aprobado).toHaveAttribute('aria-current', 'step');
    expect(aprobado).toHaveTextContent(/^Cuando lo apruebes$/);
    const camino = screen.getByRole('region', { name: 'En qué anda' });
    expect(within(camino).getByText(SIGUE_CON_LA_SENA_CUBIERTA)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Para cuándo' })).toHaveTextContent(
      COORDINAMOS_LA_ENTREGA_AL_APROBAR,
    );
    expect(document.body).not.toHaveTextContent('dejes la seña');
  });

  it('entregado con saldo, la entrega queda tildada y en curso queda el saldo', () => {
    dibujar(
      trabajo({
        estado: 'entregado',
        fechas: fechas({
          presupuesto: '2026-08-01',
          aprobado: '2026-08-04',
          inicio: '2026-08-24',
          entregado: '2026-09-16',
        }),
      }),
    );

    const pasos = itemsDelCamino();
    expect(pasos.slice(0, 4).every(tildado)).toBe(true);
    expect(pasos[3]).toHaveTextContent('Entregado');
    expect(pasos[3]).toHaveTextContent('mié 16 sep');
    expect(pasos[4]).toHaveAttribute('aria-current', 'step');
    expect(pasos[4]).toHaveTextContent('Cuando esté saldado');
  });
});

function conPantalla(ancho: 'celular' | 'escritorio'): void {
  vi.stubGlobal('matchMedia', () => ({
    matches: ancho === 'escritorio',
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

const PUEDE_CAMBIAR = 'Por qué el número todavía puede cambiar';
const DE_DONDE_SALE = 'De dónde sale este número';
const LA_NOTA = /Por qué el número|De dónde sale/;

describe('el estimativo y el relevamiento en el camino', () => {
  beforeEach(() => {
    conPantalla('celular');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('con el estimativo mandado, va tildado antes de los otros cinco y el presupuesto queda en curso', () => {
    dibujar(
      trabajo({
        estado: 'presupuesto_estimativo',
        precio: null,
        sena: null,
        pagos: [],
        fechas: fechas({ estimativo: '2026-09-15' }),
      }),
    );

    const entrada = screen.getByRole('region', { name: 'Tu mueble' });
    expect(within(entrada).getByText('Te pasamos un número estimado')).toBeInTheDocument();
    expect(entrada).not.toHaveTextContent('Te falta pagar');
    const pasos = pasosDelCamino();
    expect(pasos).toHaveLength(6);
    expect(pasos[0]).toContain('Te pasamos un número estimado');
    expect(pasos[0]).toContain('mar 15 sep');
    expect(pasos[1]).toContain('Te vamos a pasar el presupuesto');
    const [estimativo, presupuesto] = itemsDelCamino();
    expect(estimativo?.querySelector('svg.lucide-check')).not.toBeNull();
    expect(presupuesto).toHaveAttribute('aria-current', 'step');
  });

  it('sin estimativo el camino sigue siendo de cinco pasos', () => {
    dibujar(trabajo());

    expect(pasosDelCamino()).toHaveLength(5);
    expect(screen.queryByText('Te pasamos un número estimado')).not.toBeInTheDocument();
  });

  it('afuera del relevamiento no aparece ningún importe del estimativo, y adentro solo lo que vale la visita', () => {
    const dibujada = dibujar(
      trabajo({
        estado: 'presupuesto_estimativo',
        precio: null,
        sena: null,
        pagos: [],
        pago: { instancia: 'sena', formas: ['efectivo'], monto: null, siguiente: null },
        fechas: fechas({ estimativo: '2026-09-15' }),
        valorDelRelevamiento: centavos(12_000_000),
      }),
    );

    const bloque = screen.getByRole('region', { name: 'Relevamiento técnico' });
    expect(importes(textoAfueraDe(dibujada.container, bloque))).toEqual([]);
    expect(importes(bloque.textContent)).toEqual(['$ 120.000']);
  });

  function sinMedir(): TrabajoDelCliente {
    return trabajo({
      estado: 'presupuesto_estimativo',
      precio: null,
      sena: null,
      pagos: [],
      fechas: fechas({ estimativo: '2026-09-15' }),
      visita: { dia: '2026-09-22', hecha: false },
    });
  }

  it('sin medir, una sola (i), al lado de la fecha del estimativo, y el resumen abajo del titular', () => {
    dibujar(sinMedir());

    const camino = screen.getByRole('region', { name: 'En qué anda' });
    const estimativo = within(camino).getAllByRole('listitem')[0] as HTMLElement;
    expect(screen.getAllByRole('button', { name: LA_NOTA })).toHaveLength(1);
    const boton = within(estimativo).getByRole('button', { name: PUEDE_CAMBIAR });
    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(boton.previousSibling?.textContent).toBe('mar 15 sep');
    expect(boton.nextSibling).toBeNull();
    expect(within(estimativo).getByText('Te pasamos un número estimado')).not.toContainElement(
      boton,
    );
    expect(screen.getByRole('region', { name: 'Tu mueble' })).toHaveTextContent(
      'Número estimado, falta ir a medir',
    );
    expect(pasosDelCamino().join(' ')).not.toContain('Relevamiento técnico');
    expect(
      within(camino).getByRole('region', { name: 'Relevamiento técnico' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        'Si seguimos adelante, lo próximo es ir a medir para pasarte el presupuesto.',
      ),
    ).not.toBeInTheDocument();
  });

  it('en el celular abre una hoja con el día que quedamos, y «Entendido» la cierra', () => {
    dibujar(sinMedir());

    const boton = screen.getByRole('button', { name: PUEDE_CAMBIAR });
    fireEvent.click(boton);

    const hoja = screen.getByRole('dialog', { name: 'El número todavía puede cambiar' });
    expect(boton).toHaveAttribute('aria-expanded', 'true');
    expect(hoja).toHaveTextContent('Lo que te pasamos es un estimado, sacado de lo que hablamos.');
    expect(hoja).toHaveTextContent('Quedamos en ir el mar 22 sep.');
    expect(hoja).not.toHaveTextContent(/relevamiento/i);
    fireEvent.click(within(hoja).getByRole('button', { name: 'Entendido' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(boton).toHaveAttribute('aria-expanded', 'false');
  });

  it('en la PC abre al pasar el mouse, queda anclada al paso y cierra con Escape', () => {
    conPantalla('escritorio');
    dibujar(sinMedir());

    const boton = screen.getByRole('button', { name: PUEDE_CAMBIAR });
    const paso = boton.closest('li');
    fireEvent.mouseEnter(boton);
    expect(boton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const nota = document.getElementById(boton.getAttribute('aria-controls') ?? '');
    expect(nota?.closest('li')).toBe(paso);
    expect(nota).toHaveTextContent('Para cerrarlo tenemos que ir a tu casa a tomar las medidas.');

    fireEvent.click(boton);
    expect(boton).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(boton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(boton);
    expect(boton).toHaveAttribute('aria-expanded', 'true');
    fireEvent.mouseLeave(paso as HTMLElement);
    expect(boton).toHaveAttribute('aria-expanded', 'false');
  });

  it('ya medido, la (i) dice de dónde sale el número y el resumen dice el día', () => {
    dibujar(
      trabajo({
        estado: 'a_presupuestar',
        precio: null,
        sena: null,
        pagos: [],
        fechas: fechas({ estimativo: '2026-09-02' }),
        visita: { dia: '2026-09-10', hecha: true },
      }),
    );

    const camino = screen.getByRole('region', { name: 'En qué anda' });
    const presupuesto = within(camino).getAllByRole('listitem')[1] as HTMLElement;
    const boton = within(presupuesto).getByRole('button', { name: DE_DONDE_SALE });
    expect(boton.previousSibling).toBeNull();
    expect(boton.parentElement?.previousElementSibling).toHaveTextContent(
      'Estamos preparando tu presupuesto',
    );
    fireEvent.click(boton);
    const hoja = screen.getByRole('dialog', {
      name: 'El número ya está tomado de las medidas reales',
    });
    expect(hoja).toHaveTextContent('Fuimos a medir el jue 10 sep.');
    expect(screen.getByRole('region', { name: 'Tu mueble' })).toHaveTextContent('Medido el 10 sep');
    const historia = screen.getByRole('region', { name: 'Lo que fue pasando' });
    expect(within(historia).getByText('Fuimos a medir')).toBeInTheDocument();
    expect(within(historia).getByText('Te pasamos un número estimado')).toBeInTheDocument();
  });

  it('sin estimativo no hay número que pueda cambiar, y sin medir tampoco hay (i)', () => {
    dibujar(
      trabajo({ estado: 'relevamiento', precio: null, sena: null, pagos: [], fechas: fechas({}) }),
    );

    expect(screen.queryByRole('button', { name: LA_NOTA })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Tu mueble' })).not.toHaveTextContent('Número');
  });

  it('desde que se aprueba, la (i) no está', () => {
    dibujar(
      trabajo({
        fechas: fechas({ estimativo: '2026-08-01', presupuesto: '2026-08-05' }),
        visita: { dia: '2026-08-03', hecha: true },
      }),
    );

    expect(screen.queryByRole('button', { name: LA_NOTA })).not.toBeInTheDocument();
  });
});

const FORMATOS: Formatos = {
  plata: (importe) => formatearPesos(importe),
  porcentaje: formatearPorcentaje,
};

const TALLER: DatosDelTaller = {
  nombre: 'Taller MAUN',
  titular: 'Julián Ferro',
  cuit: '20-12345678-6',
  condicionFiscal: 'monotributo',
  domicilio: 'Pasaje Los Aromos 120, Haedo',
  telefono: '11 4088-2210',
  email: 'taller@ejemplo.com',
};

const OPCIONES: readonly OpcionDelTrabajo[] = [
  { id: 'opcion-a', descripcion: 'En melamina Blanco.', monto: centavos(124_800_000) },
  { id: 'opcion-b', descripcion: 'Con frentes laqueados.', monto: centavos(156_000_000) },
];

function documentoMandado(opciones: readonly OpcionDelTrabajo[] = []): DocumentoDelPresupuesto {
  const borrador = borradorNuevo({
    titulo: 'Escritorio',
    obra: 'Belgrano 455, Haedo',
    plantilla: PLANTILLA_DE_SIEMPRE,
    validezDias: 15,
    idNuevo: () => 'm1',
  });
  return documentoDelPresupuesto(
    {
      borrador: {
        ...borrador,
        muebles: [
          {
            id: 'm1',
            nombre: 'Escritorio en L',
            descripcion: 'En melamina Blanco, con dos cajones.',
          },
        ],
        herrajes: { mostrar: true, lista: [{ id: 'h1', texto: 'Correderas con cierre suave.' }] },
      },
      plantilla: PLANTILLA_DE_SIEMPRE,
      taller: TALLER,
      cliente: 'Lucía Ferreyra',
      moneda: 'ARS',
      cobraEn: null,
      valores: valoresDelTrabajo(centavos(124_800_000), opciones),
      senaBp: puntosBasicos(5_000),
      abonado: centavos(12_000_000),
    },
    FORMATOS,
  );
}

function presupuestoMandado(cambios: Partial<PresupuestoDelTrabajo> = {}): PresupuestoDelTrabajo {
  return {
    numero: '20260910-01',
    revision: 2,
    mandadoEl: '2026-09-10',
    queCambio: 'Sumamos los dos cajones.',
    documento: documentoMandado(),
    idioma: 'es',
    aceptadoEl: null,
    letra: null,
    ...cambios,
  };
}

function esperandoLaSena(cambios: Partial<TrabajoDelCliente> = {}): TrabajoDelCliente {
  return trabajo({
    trabajo: 'Escritorio',
    cliente: 'Lucía Ferreyra',
    estado: 'presupuesto_enviado',
    precio: centavos(124_800_000),
    sena: centavos(62_400_000),
    fechas: fechas({ presupuesto: '2026-09-10', valeHasta: '2026-09-25' }),
    pago: {
      instancia: 'sena',
      formas: ['efectivo'],
      monto: centavos(50_400_000),
      siguiente: { instancia: 'saldo', formas: ['efectivo'], monto: centavos(62_400_000) },
    },
    pagos: [
      {
        id: 'relevamiento',
        fecha: '2026-08-13',
        concepto: 'Relevamiento',
        monto: centavos(12_000_000),
      },
    ],
    presupuesto: presupuestoMandado(),
    ...cambios,
  });
}

function antesQue(una: HTMLElement, otra: HTMLElement): boolean {
  return (una.compareDocumentPosition(otra) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}

describe('el presupuesto mandado desde la app, esperando la seña', () => {
  it('va segundo en el principal, entre «Tu mueble» y «En qué anda»', () => {
    dibujar(esperandoLaSena());

    const presupuesto = screen.getByRole('region', { name: 'El presupuesto' });
    expect(antesQue(screen.getByRole('region', { name: 'Tu mueble' }), presupuesto)).toBe(true);
    expect(antesQue(presupuesto, screen.getByRole('region', { name: 'En qué anda' }))).toBe(true);
    expect(presupuesto).toHaveAttribute('data-quieta');
  });

  it('el rótulo lleva el número, la revisión, el día en que se mandó y hasta cuándo vale', () => {
    dibujar(esperandoLaSena());

    const rotulo = screen.getByLabelText('Rótulo del presupuesto');
    expect(rotulo.tagName).toBe('DL');
    expect(rotulo).toHaveTextContent('PresupuestoNº 20260910-01');
    expect(rotulo).toHaveTextContent('Rev.2');
    expect(rotulo).toHaveTextContent('Emitido10/09/26');
    expect(rotulo).toHaveTextContent('Vale hasta25/09/26');
  });

  it('trae qué cambió, el trabajo, el detalle, los valores con lo pagado, el plazo, la validez y el pie', () => {
    dibujar(esperandoLaSena());

    const presupuesto = screen.getByRole('region', { name: 'El presupuesto' });
    expect(presupuesto).toHaveTextContent('Qué cambió en la revisión 2');
    expect(presupuesto).toHaveTextContent('Sumamos los dos cajones.');
    expect(presupuesto).toHaveTextContent('Belgrano 455, Haedo');
    expect(presupuesto).toHaveTextContent('Escritorio en L');
    expect(presupuesto).toHaveTextContent('Correderas con cierre suave.');
    expect(presupuesto).toHaveTextContent('Total$ 1.248.000');
    expect(presupuesto).toHaveTextContent('Seña (50%)$ 624.000');
    expect(presupuesto).toHaveTextContent('Ya pagaste$ 120.000');
    expect(presupuesto).toHaveTextContent('Te falta para la seña$ 504.000');
    expect(presupuesto).toHaveTextContent('Después, el saldo$ 624.000');
    expect(presupuesto).toHaveTextContent('Seña del 50% para confirmar el trabajo');
    expect(presupuesto).toHaveTextContent('Plazo de fabricación30 días hábiles');
    expect(presupuesto).toHaveTextContent('ValidezHasta el vie 25 sep');
    expect(within(presupuesto).getByText('Garantía')).toBeInTheDocument();
    expect(presupuesto).toHaveTextContent('Garantía6 meses');
    expect(presupuesto).toHaveTextContent('Documento no válido como factura');
    expect(presupuesto).toHaveTextContent('CUIT 20-12345678-6');
    expect(presupuesto).toHaveTextContent('Responsable Monotributo');
  });

  it('los avisos, las condiciones y la garantía empiezan cerrados', () => {
    const { container } = dibujar(esperandoLaSena());

    const plegables = container.querySelectorAll('section[data-quieta] details');
    expect(plegables.length).toBe(3);
    for (const plegable of plegables) expect(plegable).not.toHaveAttribute('open');
  });

  it('«Escribirle al taller» abre el chat del taller con el número del presupuesto', () => {
    dibujar(esperandoLaSena());

    expect(screen.getByRole('link', { name: 'Escribirle al taller' })).toHaveAttribute(
      'href',
      'https://wa.me/5491140882210?text=Hola%2C%20te%20escribo%20por%20el%20presupuesto%20N%C2%BA%2020260910-01%20Rev.%202.',
    );
  });

  it('con la seña por pagar, «Cómo dejar la seña» baja a «Cómo pagar»', () => {
    dibujar(esperandoLaSena());

    const enlace = screen.getByRole('link', { name: 'Cómo dejar la seña' });
    expect(enlace).toHaveAttribute('href', '#como-pagar');
    expect(screen.getByRole('region', { name: 'Cómo pagar' })).toHaveAttribute('id', 'como-pagar');
  });

  it('sin el teléfono del taller no hay a quién escribirle', () => {
    dibujar(
      esperandoLaSena({
        presupuesto: presupuestoMandado({
          documento: { ...documentoMandado(), taller: { ...TALLER, telefono: '' } },
        }),
      }),
    );

    expect(screen.queryByRole('link', { name: 'Escribirle al taller' })).not.toBeInTheDocument();
  });

  it('en la primera revisión no hay «qué cambió»', () => {
    dibujar(esperandoLaSena({ presupuesto: presupuestoMandado({ revision: 1 }) }));

    expect(screen.getByRole('region', { name: 'El presupuesto' })).not.toHaveTextContent(
      'Qué cambió',
    );
  });

  it('con opciones, «Tu mueble» dice cuántas y la sección muestra cada una con su seña', () => {
    dibujar(
      esperandoLaSena({
        precio: null,
        sena: null,
        pago: { instancia: 'sena', formas: ['efectivo'], monto: null, siguiente: null },
        presupuesto: presupuestoMandado({ documento: documentoMandado(OPCIONES) }),
      }),
    );

    const entrada = screen.getByRole('region', { name: 'Tu mueble' });
    expect(entrada).toHaveTextContent('Presupuesto2 opciones');
    expect(entrada).toHaveTextContent(
      'Mirá las dos en el presupuesto y avisale al taller cuál preferís.',
    );
    const presupuesto = screen.getByRole('region', { name: 'El presupuesto' });
    expect(within(presupuesto).getByRole('heading', { name: 'Opción A' })).toBeInTheDocument();
    expect(within(presupuesto).getByRole('heading', { name: 'Opción B' })).toBeInTheDocument();
    expect(presupuesto).toHaveTextContent('Total$ 1.560.000');
    expect(presupuesto).toHaveTextContent('Seña (50%)$ 780.000');
    expect(presupuesto).toHaveTextContent('Elegí la opción que prefieras y avisale al taller.');
    expect(screen.queryByRole('link', { name: 'Cómo dejar la seña' })).not.toBeInTheDocument();
  });

  it('vencido, la sección lo marca y deja de mandar a pagar la seña', () => {
    dibujar(
      esperandoLaSena({ fechas: fechas({ presupuesto: '2026-09-10', valeHasta: '2026-09-17' }) }),
    );

    const presupuesto = screen.getByRole('region', { name: 'El presupuesto' });
    expect(presupuesto).toHaveTextContent(
      'Venció el jue 17 sep. Escribile al taller para actualizarlo.',
    );
    expect(presupuesto).toHaveTextContent('Venció17/09/26');
    expect(presupuesto).not.toHaveTextContent('Vale hasta');
    expect(presupuesto).toHaveTextContent('ValidezVenció el jue 17 sep');
    expect(screen.queryByRole('link', { name: 'Cómo dejar la seña' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Para cuándo' })).not.toBeInTheDocument();
  });

  it('«Para cuándo» cuenta el plazo del presupuesto en vez de los 21 días hábiles', () => {
    const documento = { ...documentoMandado(), plazoDeFabricacion: 10 };
    dibujar(esperandoLaSena({ presupuesto: presupuestoMandado({ documento }) }));

    expect(screen.getByRole('region', { name: 'Para cuándo' })).toHaveTextContent(
      'Si dejás la seña antes del vie 25 de septiembre, podríamos tenerlo listo para el vie 9 de octubre.',
    );
  });

  it('sin el presupuesto de la app, la página no tiene la sección', () => {
    dibujar(esperandoLaSena({ presupuesto: null }));

    expect(screen.queryByRole('region', { name: 'El presupuesto' })).not.toBeInTheDocument();
  });
});

describe('el presupuesto aceptado', () => {
  function aprobado(cambios: Partial<TrabajoDelCliente> = {}): TrabajoDelCliente {
    const documento = documentoMandado([OPCIONES[0] as OpcionDelTrabajo]);
    return trabajo({
      precio: centavos(124_800_000),
      presupuesto: presupuestoMandado({ documento, aceptadoEl: '2026-09-04', letra: 'A' }),
      ...cambios,
    });
  }

  it('se achica y baja: va después de «Lo que pagaste» y antes de «Fotos y planos»', () => {
    dibujar(aprobado());

    const tarjeta = screen.getByRole('region', { name: 'El presupuesto que aceptaste' });
    expect(antesQue(screen.getByRole('region', { name: 'Lo que pagaste' }), tarjeta)).toBe(true);
    expect(antesQue(tarjeta, screen.getByRole('region', { name: 'Fotos y planos' }))).toBe(true);
    expect(screen.queryByRole('region', { name: 'El presupuesto' })).not.toBeInTheDocument();
  });

  it('el rótulo dice la opción y el día en que se aceptó en lugar de hasta cuándo vale', () => {
    dibujar(aprobado());

    const tarjeta = screen.getByRole('region', { name: 'El presupuesto que aceptaste' });
    expect(tarjeta).toHaveTextContent('OpciónA');
    expect(tarjeta).toHaveTextContent('Aceptado04/09/26');
    expect(tarjeta).not.toHaveTextContent('Vale hasta');
  });

  it('«Ver el detalle» está cerrado y trae solo la opción aceptada, sin lo pagado', () => {
    dibujar(aprobado());

    const tarjeta = screen.getByRole('region', { name: 'El presupuesto que aceptaste' });
    const detalle = within(tarjeta).getByText('Ver el detalle').closest('details');
    expect(detalle).not.toHaveAttribute('open');
    expect(tarjeta).toHaveTextContent('Opción A');
    expect(tarjeta).not.toHaveTextContent('Opción B');
    expect(tarjeta).toHaveTextContent('Total$ 1.248.000');
    expect(tarjeta).not.toHaveTextContent('Ya pagaste');
    expect(tarjeta).not.toHaveTextContent('Te falta para la seña');
    expect(tarjeta).not.toHaveTextContent('Después, el saldo');
    expect(tarjeta).not.toHaveTextContent('Validez');
    expect(tarjeta).not.toHaveTextContent('Acordado al aprobar');
  });

  it('si se aprobó por otro importe, lo dice debajo del total', () => {
    dibujar(aprobado({ precio: centavos(120_000_000) }));

    expect(screen.getByRole('region', { name: 'El presupuesto que aceptaste' })).toHaveTextContent(
      'Acordado al aprobar: $ 1.200.000',
    );
  });
});
