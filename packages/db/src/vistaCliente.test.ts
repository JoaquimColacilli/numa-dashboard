import { describe, expect, it } from 'vitest';

import { RespuestaInvalidaError } from './replica.ts';
import { leerVistaDelCliente } from './vistaCliente.ts';

function respuesta(cambios: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    taller: { nombre: 'Taller MAUN' },
    cliente: { nombre: 'Marcela Duarte' },
    trabajo: 'Placard 3 puertas',
    direccion: 'Olazábal 1240',
    estado: 'en_curso',
    precio_centavos: 124_000_000,
    sena_centavos: 62_000_000,
    fechas: {
      estimativo: '2026-07-24',
      presupuesto: '2026-08-01',
      aprobado: '2026-08-04',
      inicio: '2026-08-24',
      entrega_pautada: '2026-10-02',
      listo: '2026-09-24',
      entregado: null,
      cobro: null,
      vale_hasta: null,
    },
    visita: { dia: '2026-07-28', hecha: true },
    entrega: {
      comprometida: null,
      propuesta: { id: 'd1', forma: 'sus_dias', fecha: null, franja: null },
      respuesta: {
        respuesta: 'mis_dias',
        dias: [{ fecha: '2026-09-29', franjas: ['manana', 'tarde'] }],
        nota: 'Tercer piso',
      },
    },
    pago: {
      instancia: 'sena',
      formas: ['transferencia', 'efectivo'],
      monto_centavos: 22_000_000,
      siguiente: {
        instancia: 'saldo',
        formas: ['efectivo'],
        monto_centavos: 62_000_000,
      },
    },
    cobro: {
      alias: 'maun.muebles',
      cbu: '0110001312345678901233',
      titular: 'Ana Gutiérrez',
      cuit: '27-30123456-4',
      link: 'https://mpago.la/2vXyZ1',
    },
    pagos: [{ id: 'p1', fecha: '2026-08-04', concepto: 'Seña', monto_centavos: 40_000_000 }],
    archivos: [
      {
        id: 'a1',
        nombre: 'Plano de frente',
        tipo: 'image/webp',
        ancho: 1600,
        alto: 900,
        fecha: '2026-08-02T12:00:00+00:00',
        ruta: 'h/p/a1.webp',
        ruta_mini: 'h/p/a1.mini.webp',
      },
    ],
    vidriera: {
      redes: {
        instagram: 'https://www.instagram.com/taller.maun/',
        facebook: null,
        tiktok: 'https://www.tiktok.com/@taller.maun',
      },
      fotos: [
        {
          id: 'f1',
          ruta: 'h/vidriera/f1.webp',
          ruta_mini: 'h/vidriera/f1.mini.webp',
          ancho: 900,
          alto: 1200,
        },
      ],
    },
    relevamiento_centavos: null,
    ...cambios,
  };
}

function foto(id: string): Record<string, unknown> {
  return {
    id,
    ruta: `h/vidriera/${id}.webp`,
    ruta_mini: `h/vidriera/${id}.mini.webp`,
    ancho: 900,
    alto: 1200,
  };
}

describe('leer la vista del cliente', () => {
  it('traduce lo que devuelve la base a lo que el dominio sabe leer', () => {
    expect(leerVistaDelCliente(respuesta())).toEqual({
      taller: 'Taller MAUN',
      cliente: 'Marcela Duarte',
      trabajo: 'Placard 3 puertas',
      direccion: 'Olazábal 1240',
      estado: 'en_curso',
      precio: 124_000_000,
      sena: 62_000_000,
      fechas: {
        estimativo: '2026-07-24',
        presupuesto: '2026-08-01',
        aprobado: '2026-08-04',
        inicio: '2026-08-24',
        entregaPautada: '2026-10-02',
        listo: '2026-09-24',
        entregado: null,
        cobro: null,
        valeHasta: null,
      },
      visita: { dia: '2026-07-28', hecha: true },
      entrega: {
        comprometida: null,
        propuesta: { id: 'd1', forma: 'sus_dias', fecha: null, franja: null },
        respuesta: {
          respuesta: 'mis_dias',
          dias: [{ fecha: '2026-09-29', franjas: ['manana', 'tarde'] }],
          nota: 'Tercer piso',
        },
      },
      pago: {
        instancia: 'sena',
        formas: ['transferencia', 'efectivo'],
        monto: 22_000_000,
        siguiente: { instancia: 'saldo', formas: ['efectivo'], monto: 62_000_000 },
      },
      cobro: {
        alias: 'maun.muebles',
        cbu: '0110001312345678901233',
        titular: 'Ana Gutiérrez',
        cuit: '27-30123456-4',
        link: 'https://mpago.la/2vXyZ1',
      },
      pagos: [{ id: 'p1', fecha: '2026-08-04', concepto: 'Seña', monto: 40_000_000 }],
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
      ],
      vidriera: {
        redes: {
          instagram: 'https://www.instagram.com/taller.maun/',
          facebook: null,
          tiktok: 'https://www.tiktok.com/@taller.maun',
        },
        fotos: [
          {
            id: 'f1',
            ruta: 'h/vidriera/f1.webp',
            rutaMini: 'h/vidriera/f1.mini.webp',
            ancho: 900,
            alto: 1200,
          },
        ],
      },
      valorDelRelevamiento: null,
      presupuesto: null,
    });
  });

  it('un trabajo sin presupuesto y sin nada cargado también se lee', () => {
    const vacio = leerVistaDelCliente(
      respuesta({
        precio_centavos: null,
        pagos: [],
        archivos: [],
        fechas: {
          estimativo: null,
          presupuesto: null,
          aprobado: null,
          inicio: null,
          entrega_pautada: null,
          entregado: null,
          cobro: null,
        },
        visita: { dia: null, hecha: false },
      }),
    );
    expect(vacio.precio).toBeNull();
    expect(vacio.pagos).toEqual([]);
    expect(vacio.fechas.estimativo).toBeNull();
    expect(vacio.visita).toEqual({ dia: null, hecha: false });
  });

  it('esperando la seña, lee hasta cuándo vale el presupuesto y la seña en pesos', () => {
    const esperando = leerVistaDelCliente(
      respuesta({
        estado: 'presupuesto_enviado',
        direccion: '',
        sena_centavos: 62_400_000,
        fechas: {
          estimativo: null,
          presupuesto: '2026-09-14',
          aprobado: null,
          inicio: null,
          entrega_pautada: null,
          entregado: null,
          cobro: null,
          vale_hasta: '2026-10-02',
        },
      }),
    );
    expect(esperando.fechas.valeHasta).toBe('2026-10-02');
    expect(esperando.sena).toBe(62_400_000);
    expect(esperando.direccion).toBe('');
  });

  it('una respuesta de antes, sin la seña en pesos ni hasta cuándo vale, se lee sin seña y sin fecha', () => {
    const { sena_centavos: _sena, ...sinSena } = respuesta();
    const vieja = leerVistaDelCliente({
      ...sinSena,
      fechas: {
        estimativo: null,
        presupuesto: '2026-08-01',
        aprobado: null,
        inicio: null,
        entrega_pautada: null,
        entregado: null,
        cobro: null,
      },
    });
    expect(vieja.sena).toBeNull();
    expect(vieja.fechas.valeHasta).toBeNull();
  });

  it('una respuesta de antes, sin el día del estimativo ni la visita, se lee como que no hubo', () => {
    const vieja = leerVistaDelCliente(
      respuesta({
        fechas: {
          presupuesto: '2026-08-01',
          aprobado: null,
          inicio: null,
          entrega_pautada: null,
          entregado: null,
          cobro: null,
        },
        visita: undefined,
      }),
    );
    expect(vieja.fechas.estimativo).toBeNull();
    expect(vieja.visita).toEqual({ dia: null, hecha: false });
  });

  it('lee la entrega comprometida con su franja', () => {
    const comprometida = leerVistaDelCliente(
      respuesta({
        entrega: {
          comprometida: { fecha: '2026-10-08', franja: 'manana' },
          propuesta: null,
          respuesta: null,
        },
      }),
    );
    expect(comprometida.entrega).toEqual({
      comprometida: { fecha: '2026-10-08', franja: 'manana' },
      propuesta: null,
      respuesta: null,
    });
  });

  it('una respuesta de antes, sin el listo ni la entrega, se lee como que no hubo', () => {
    const { entrega: _entrega, ...sinEntrega } = respuesta();
    const vieja = leerVistaDelCliente({
      ...sinEntrega,
      fechas: { presupuesto: '2026-08-01' },
    });
    expect(vieja.fechas.listo).toBeNull();
    expect(vieja.entrega).toEqual({ comprometida: null, propuesta: null, respuesta: null });
  });

  it('una forma, una respuesta o una franja que esta versión no conoce se ignora en vez de romper la página', () => {
    const nueva = leerVistaDelCliente(
      respuesta({
        entrega: {
          comprometida: { fecha: '2026-10-08', franja: 'noche' },
          propuesta: { id: 'd2', forma: 'por_telefono', fecha: null, franja: null },
          respuesta: { respuesta: 'otra', dias: [], nota: '' },
        },
      }),
    );
    expect(nueva.entrega).toEqual({
      comprometida: { fecha: '2026-10-08', franja: null },
      propuesta: null,
      respuesta: null,
    });
  });

  it('un PDF viene sin medidas', () => {
    const conPdf = leerVistaDelCliente(
      respuesta({
        archivos: [
          {
            id: 'a2',
            nombre: 'Presupuesto.pdf',
            tipo: 'application/pdf',
            ancho: null,
            alto: null,
            fecha: '2026-08-01T12:00:00+00:00',
            ruta: 'h/p/a2.pdf',
            ruta_mini: 'h/p/a2.pdf',
          },
        ],
      }),
    );
    expect(conPdf.archivos[0]?.ancho).toBeNull();
  });

  it('no le cree a una respuesta que no tiene la forma que tiene que tener', () => {
    for (const rota of [
      null,
      'texto',
      respuesta({ taller: null }),
      respuesta({ cliente: {} }),
      respuesta({ trabajo: 7 }),
      respuesta({ direccion: null }),
      respuesta({ estado: null }),
      respuesta({ precio_centavos: '124' }),
      respuesta({ sena_centavos: '62' }),
      respuesta({ fechas: null }),
      respuesta({ fechas: { vale_hasta: 20261002 } }),
      respuesta({ fechas: { presupuesto: 1 } }),
      respuesta({ fechas: { estimativo: 20260724 } }),
      respuesta({ visita: 'mañana' }),
      respuesta({ visita: { dia: '2026-07-28' } }),
      respuesta({ visita: { dia: '2026-07-28', hecha: 'sí' } }),
      respuesta({ visita: { dia: 28, hecha: true } }),
      respuesta({ pagos: null }),
      respuesta({ pagos: [{ id: 'p1', fecha: '2026-08-04', concepto: 'Seña' }] }),
      respuesta({ pagos: [{ id: 1, fecha: '2026-08-04', concepto: 'x', monto_centavos: 1 }] }),
      respuesta({ archivos: null }),
      respuesta({ archivos: [{ id: 'a1' }] }),
      respuesta({ vidriera: 'fotos' }),
      respuesta({ vidriera: { redes: 'instagram', fotos: [] } }),
      respuesta({ vidriera: { redes: { instagram: 7 }, fotos: [] } }),
      respuesta({ vidriera: { redes: null, fotos: 'f1' } }),
      respuesta({ vidriera: { redes: null, fotos: [{ id: 'f1' }] } }),
      respuesta({ vidriera: { redes: null, fotos: [{ ...foto('f1'), ancho: null }] } }),
      respuesta({ vidriera: { redes: null, fotos: [{ ...foto('f1'), alto: '1200' }] } }),
      respuesta({ relevamiento_centavos: '12000000' }),
    ]) {
      expect(() => leerVistaDelCliente(rota)).toThrow(RespuestaInvalidaError);
    }
  });
});

describe('el valor del relevamiento', () => {
  it('antes del presupuesto llega lo que cobra el taller por ir a medir', () => {
    const leido = leerVistaDelCliente(
      respuesta({ estado: 'contacto', relevamiento_centavos: 12_000_000 }),
    );
    expect(leido.valorDelRelevamiento).toBe(12_000_000);
  });

  it('sin valor, o con una respuesta de antes que no trae la clave, queda en null', () => {
    const { relevamiento_centavos: _valor, ...vieja } = respuesta();
    expect(leerVistaDelCliente(vieja).valorDelRelevamiento).toBeNull();
    expect(leerVistaDelCliente(respuesta()).valorDelRelevamiento).toBeNull();
  });
});

describe('el pago que toca', () => {
  it('lee la instancia, las formas, el importe y el pago que sigue', () => {
    expect(leerVistaDelCliente(respuesta()).pago).toEqual({
      instancia: 'sena',
      formas: ['transferencia', 'efectivo'],
      monto: 22_000_000,
      siguiente: { instancia: 'saldo', formas: ['efectivo'], monto: 62_000_000 },
    });
  });

  it('sin otro pago después, siguiente queda en null', () => {
    const leido = leerVistaDelCliente(
      respuesta({
        pago: {
          instancia: 'saldo',
          formas: ['efectivo'],
          monto_centavos: 1,
          siguiente: null,
        },
      }),
    );
    expect(leido.pago.siguiente).toBeNull();
  });

  it('una respuesta vieja, sin la clave siguiente, tampoco rompe', () => {
    const leido = leerVistaDelCliente(
      respuesta({ pago: { instancia: 'saldo', formas: ['efectivo'], monto_centavos: 1 } }),
    );
    expect(leido.pago.siguiente).toBeNull();
  });

  it('sin instancia no hay nada que pagar', () => {
    const leido = leerVistaDelCliente(
      respuesta({ pago: { instancia: null, formas: [], monto_centavos: null, siguiente: null } }),
    );
    expect(leido.pago).toEqual({ instancia: null, formas: [], monto: null, siguiente: null });
  });

  it('una respuesta vieja, sin la clave, no rompe la vista', () => {
    expect(leerVistaDelCliente(respuesta({ pago: undefined })).pago).toEqual({
      instancia: null,
      formas: [],
      monto: null,
      siguiente: null,
    });
  });

  it('una forma que esta versión no conoce se ignora en vez de romper la página del cliente', () => {
    const leido = leerVistaDelCliente(
      respuesta({
        pago: { instancia: 'saldo', formas: ['efectivo', 'cripto'], monto_centavos: 1 },
      }),
    );
    expect(leido.pago.formas).toEqual(['efectivo']);
  });

  it('una instancia que no existe no se cree', () => {
    expect(() =>
      leerVistaDelCliente(
        respuesta({ pago: { instancia: 'visita', formas: [], monto_centavos: null } }),
      ),
    ).toThrow(RespuestaInvalidaError);
  });

  it('ni un importe que no es un número', () => {
    expect(() =>
      leerVistaDelCliente(
        respuesta({ pago: { instancia: 'sena', formas: [], monto_centavos: '100' } }),
      ),
    ).toThrow(RespuestaInvalidaError);
  });
});

describe('los datos para transferir', () => {
  it('lo que el dueño no cargó llega en null y se queda en null', () => {
    const leido = leerVistaDelCliente(
      respuesta({ cobro: { alias: null, cbu: null, titular: null, cuit: null } }),
    );
    expect(leido.cobro).toEqual({ alias: null, cbu: null, titular: null, cuit: null, link: null });
  });

  it('una cadena vacía o con espacios se lee como que no hay dato', () => {
    const leido = leerVistaDelCliente(
      respuesta({ cobro: { alias: '', cbu: '  ', titular: null, cuit: '' } }),
    );
    expect(leido.cobro).toEqual({ alias: null, cbu: null, titular: null, cuit: null, link: null });
  });

  it('una respuesta vieja, sin la clave, no rompe la vista', () => {
    const leido = leerVistaDelCliente(respuesta({ cobro: undefined }));
    expect(leido.cobro).toEqual({ alias: null, cbu: null, titular: null, cuit: null, link: null });
  });

  it('y lo que vino con algo adentro se lee recortado', () => {
    const leido = leerVistaDelCliente(
      respuesta({ cobro: { alias: '  maun.muebles ', cbu: null, titular: null, cuit: null } }),
    );
    expect(leido.cobro.alias).toBe('maun.muebles');
  });

  it('un dato que no es texto no se cree', () => {
    expect(() => leerVistaDelCliente(respuesta({ cobro: { alias: 42 } }))).toThrow(
      RespuestaInvalidaError,
    );
  });
});

describe('el link de Mercado Pago', () => {
  it('se lee cuando la base lo manda', () => {
    const leido = leerVistaDelCliente(
      respuesta({
        cobro: {
          alias: null,
          cbu: null,
          titular: null,
          cuit: null,
          link: ' https://mpago.la/2vXyZ1 ',
        },
      }),
    );
    expect(leido.cobro.link).toBe('https://mpago.la/2vXyZ1');
  });

  it('un link que no es de Mercado Pago se descarta: esta página la abre un desconocido', () => {
    for (const link of [
      'https://pagame-aca.com/taller',
      'http://mpago.la/2vXyZ1',
      'javascript:alert(1)',
    ]) {
      const leido = leerVistaDelCliente(
        respuesta({ cobro: { alias: null, cbu: null, titular: null, cuit: null, link } }),
      );
      expect(leido.cobro.link).toBeNull();
    }
  });
});

describe('la vidriera del taller', () => {
  it('una respuesta de antes, sin la vidriera, se lee con la vidriera vacía', () => {
    const { vidriera: _vidriera, ...vieja } = respuesta();
    expect(leerVistaDelCliente(vieja).vidriera).toEqual({
      redes: { instagram: null, facebook: null, tiktok: null },
      fotos: [],
    });
  });

  it('sin redes o sin fotos, lo que falta queda vacío', () => {
    expect(leerVistaDelCliente(respuesta({ vidriera: { fotos: [] } })).vidriera.redes).toEqual({
      instagram: null,
      facebook: null,
      tiktok: null,
    });
    expect(
      leerVistaDelCliente(respuesta({ vidriera: { redes: null, fotos: null } })).vidriera.fotos,
    ).toEqual([]);
  });

  it('cada link se vuelve a leer: uno que no es de su red, o no es un perfil, se descarta', () => {
    const leido = leerVistaDelCliente(
      respuesta({
        vidriera: {
          redes: {
            instagram: 'https://www.instagram.com/p/C1a2b3c4d5/',
            facebook: 'javascript:alert(1)',
            tiktok: ' https://www.tiktok.com/@taller.maun ',
          },
          fotos: [],
        },
      }),
    );
    expect(leido.vidriera.redes).toEqual({
      instagram: null,
      facebook: null,
      tiktok: 'https://www.tiktok.com/@taller.maun',
    });
  });

  it('con un link vacío, esa red no está', () => {
    const leido = leerVistaDelCliente(
      respuesta({
        vidriera: { redes: { instagram: '', facebook: '  ', tiktok: null }, fotos: [] },
      }),
    );
    expect(leido.vidriera.redes).toEqual({ instagram: null, facebook: null, tiktok: null });
  });

  it('lee las fotos en el orden en que llegan, y no más de doce', () => {
    const ids = Array.from({ length: 14 }, (_, indice) => `f${String(indice + 1)}`);
    const leido = leerVistaDelCliente(
      respuesta({ vidriera: { redes: null, fotos: ids.map(foto) } }),
    );
    expect(leido.vidriera.fotos.map((una) => una.id)).toEqual(ids.slice(0, 12));
  });
});

const CONTENIDO = {
  forma: 1,
  taller: {
    nombre: 'Taller de prueba',
    titular: 'Julián Ferro',
    cuit: '20-12345678-6',
    condicionFiscal: 'monotributo',
    domicilio: 'Pasaje Los Robles 450, CABA',
    telefono: '11 5555-0199',
    email: 'taller@ejemplo.com',
  },
  cliente: 'Paula Benítez',
  titulo: 'Placard',
  obra: 'Arenales 1840, Palermo',
  descripcion: '',
  muebles: [{ nombre: 'Placard', descripcion: 'Placard de tres puertas corredizas.' }],
  herrajes: [],
  aTenerEnCuenta: [],
  incluye: [],
  valores: { tipo: 'total', total: 120_000_000 },
  senaBp: 5000,
  abonado: 12_000_000,
  formaDePago: null,
  plazoDeFabricacion: 35,
  validezDias: 15,
  avisos: [],
  condiciones: [],
  garantia: 'Garantía de 6 meses.',
  garantiaMeses: 6,
};

describe('el presupuesto que se le mandó', () => {
  it('esperando la seña, lee la última revisión con su número, lo que cambió y el documento', () => {
    const leido = leerVistaDelCliente(
      respuesta({
        estado: 'presupuesto_enviado',
        presupuesto: {
          numero: '20260920-01',
          revision: 2,
          mandado_el: '2026-09-22',
          que_cambio: 'Sumamos un estante.',
          contenido: CONTENIDO,
        },
      }),
    );
    expect(leido.presupuesto).toMatchObject({
      numero: '20260920-01',
      revision: 2,
      mandadoEl: '2026-09-22',
      queCambio: 'Sumamos un estante.',
      aceptadoEl: null,
      letra: null,
    });
    expect(leido.presupuesto?.documento.obra).toBe('Arenales 1840, Palermo');
    expect(leido.presupuesto?.documento.plazoDeFabricacion).toBe(35);
  });

  it('aprobado, lee el día en que se aceptó y la letra de la opción', () => {
    const leido = leerVistaDelCliente(
      respuesta({
        presupuesto: {
          numero: '20260920-01',
          revision: 1,
          mandado_el: '2026-09-20',
          contenido: CONTENIDO,
          aceptado_el: '2026-09-25',
          letra: 'A',
        },
      }),
    );
    expect(leido.presupuesto).toMatchObject({
      queCambio: null,
      aceptadoEl: '2026-09-25',
      letra: 'A',
    });
  });

  it('lo que no se puede leer queda en null en vez de romper la página', () => {
    const conPresupuesto = (presupuesto: unknown) =>
      leerVistaDelCliente(respuesta({ presupuesto })).presupuesto;
    const bueno = {
      numero: '20260920-01',
      revision: 1,
      mandado_el: '2026-09-20',
      contenido: CONTENIDO,
    };

    expect(conPresupuesto(null)).toBeNull();
    expect(conPresupuesto('presupuesto')).toBeNull();
    expect(conPresupuesto({ ...bueno, contenido: { forma: 2 } })).toBeNull();
    expect(conPresupuesto({ ...bueno, numero: 'sin número' })).toBeNull();
    expect(conPresupuesto({ ...bueno, revision: 0 })).toBeNull();
    expect(conPresupuesto({ ...bueno, revision: 1.5 })).toBeNull();
    expect(conPresupuesto({ ...bueno, mandado_el: null })).toBeNull();
    expect(conPresupuesto(bueno)).not.toBeNull();
  });
});
