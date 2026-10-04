import { describe, expect, it } from 'vitest';

import { cotizacion } from './cotizacion.ts';
import { DIAS_HABILES_DE_ENTREGA, entregaEstimada, sumarDias, sumarDiasHabiles } from './fechas.ts';
import type { Idioma } from './idioma.ts';
import { centavos, centavosEn, puntosBasicos, type Moneda, type Money } from './money.ts';
import type { FormaDeCobro } from './pagos.ts';
import {
  documentoDelPresupuesto,
  PLANTILLA_DE_SIEMPRE,
  soloLaAceptada,
  tildadasPorDefecto,
  valoresDelTrabajo,
  type BorradorDelPresupuesto,
  type DocumentoDelPresupuesto,
  type EntradaDelDocumento,
  type ReferenciaEnPesos,
} from './presupuesto.ts';
import { VIDRIERA_VACIA, type VidrieraDelTaller } from './vidriera.ts';
import {
  comoPagar as comoPagarCon,
  estaAprobada,
  hayComoPagar,
  HITOS_DEL_CAMINO,
  llegoAl,
  loQueSePagoEnOtraMoneda,
  notaDelRelevamiento as notaDelRelevamientoCon,
  proyeccionDeLaEntrega,
  seOfrece,
  textoDeLaProyeccion as textoDeLaProyeccionCon,
  tuvoEstimativo,
  vistaDelCliente as vistaDelClienteCon,
  hayComoTransferir,
  type TextosDeLaVista,
  type ProyeccionDeLaEntrega,
  type SenaDeLaVista,
  type CobroDelTaller,
  type ComprometidaDelTrabajo,
  type CuentaParaTransferir,
  type EntregaQueSeCoordina,
  type EstadoDelHito,
  type EstadoDelRelevamiento,
  type EtapaDeLaVista,
  type FacturaDelCliente,
  type FechasDelTrabajo,
  type FormatosDeFecha,
  type HitoDelTrabajo,
  type PagoDelCliente,
  type PagoPendiente,
  type PresupuestoDelTrabajo,
  type PropuestaDeEntrega,
  type RespuestaDelCliente,
  type TitularDeLaVista,
  type TrabajoDelCliente,
  type VistaAntesDelPresupuesto,
  type VistaAprobada,
  type VistaDelCliente,
  type VistaEsperandoLaSena,
} from './vistaCliente.ts';

const TEXTOS: TextosDeLaVista = {
  hitos: {
    estimativo: {
      etiqueta: 'Te pasamos un número estimado',
      futuro: 'Te pasamos un número estimado',
    },
    presupuesto: { etiqueta: 'Presupuesto enviado', futuro: 'Te vamos a pasar el presupuesto' },
    aprobado: { etiqueta: 'Aprobado, seña cobrada', futuro: 'Cuando lo apruebes y dejes la seña' },
    fabricacion: { etiqueta: 'En fabricación', futuro: 'Vamos a empezar a fabricarlo' },
    entregado: { etiqueta: 'Entregado', futuro: 'Lo llevamos y lo instalamos' },
    pagado: { etiqueta: 'Pagado', futuro: 'Cuando esté saldado' },
  },
  aprobadoSinLaSena: 'Aprobado',
  cuandoLoApruebes: 'Cuando lo apruebes',
  cuandoDejesLaSena: 'Cuando dejes la seña',
  yaEstaPagado: 'Ya está pagado',
  enCurso: {
    estimativo: 'Te pasamos un número estimado',
    presupuesto: 'Estamos preparando tu presupuesto',
    aprobado: 'Recibimos la seña y ya estás en la cola del taller',
    fabricacion: 'Lo estamos fabricando',
    entregado: 'Ya está instalado en tu casa',
    pagado: 'Listo, está saldado',
  },
  presupuestoMandado: 'Te pasamos el presupuesto',
  titularDelAprobado: {
    cubierta: 'Recibimos la seña y ya estás en la cola del taller',
    falta: 'Lo aprobaste y falta la seña para entrar en la cola del taller',
    'sin-presupuesto': 'Lo aprobaste y ya estás en la cola del taller',
  },
  sigue: {
    estimativo: 'Si seguimos adelante, lo próximo que vas a ver acá es el presupuesto.',
    presupuesto: 'Lo próximo que vas a ver acá es el presupuesto.',
    aprobado: 'Lo próximo que vas a ver acá es el arranque de la fabricación.',
    fabricacion: 'Lo próximo que vas a ver acá es la entrega.',
    entregado: 'Lo próximo que vas a ver acá es el pago del saldo.',
  },
  titularListo: 'Tu mueble está listo',
  listoParaEntregar: 'Listo para entregar',
  sigueListo: {
    'sin-pedido': 'Lo próximo es acordar el día de la entrega.',
    'un-dia': 'Lo próximo es que nos digas si te queda bien ese día.',
    'sus-dias': 'Lo próximo es que nos pases los días que te quedan bien.',
    mandados: 'Lo próximo es que te confirmemos el día.',
  },
  sigueConLaComprometida: 'Lo próximo que vas a ver acá es la entrega.',
  sigueConElPresupuestoMandado: 'Lo próximo es que lo apruebes y dejes la seña.',
  sigueConLaSenaCubierta: 'Lo próximo es que lo apruebes.',
  sigueConElPresupuestoVencido: 'Lo próximo es que le escribas al taller para actualizarlo.',
  sigueFaltaLaSena: 'Lo próximo es que dejes la seña.',
  sigueFaltaMedir: {
    estimativo: 'Si seguimos adelante, lo próximo es ir a medir para pasarte el presupuesto.',
    presupuesto: 'Lo próximo es ir a medir, para poder pasarte el presupuesto.',
  },
  relevamientoTecnico: 'Relevamiento técnico',
  queEsElRelevamiento: [
    'El siguiente paso es el relevamiento técnico en obra. Es una visita donde relevamos medidas exactas, revisamos instalaciones y definimos detalles constructivos para poder proyectar tu mueble al milímetro.',
    'A partir de ese relevamiento te entregamos el diseño 3D y el presupuesto final y definitivo.',
  ],
  eventos: {
    estimativo: 'Te pasamos un número estimado',
    relevamiento: 'Fuimos a medir',
    presupuesto: 'Te pasamos el presupuesto',
    pago: 'Recibimos tu pago',
    pagoQueSalda: 'Recibimos el pago y quedó saldado',
    saldoQueSalda: 'Recibimos el saldo y quedó saldado',
    aprobado: 'Aprobaste el presupuesto',
    inicio: 'Empezamos a fabricarlo en el taller',
    listo: 'Terminamos tu mueble',
    entregado: 'Lo llevamos y lo instalamos',
  },
  comoPagar: {
    titulo: 'Cómo pagar',
    etiquetaDelImporte: { sena: 'Ahora, la seña', saldo: 'Ahora, el saldo' },
    nombre: { sena: 'la seña', saldo: 'el saldo' },
    porTransferenciaOEnEfectivo: 'por transferencia o en efectivo',
    porTransferencia: 'por transferencia',
    enEfectivo: 'en efectivo',
    pasosParaTransferir:
      'Copiá el alias, pegalo en Transferir en la app de tu banco o de tu billetera, escribí el monto y confirmá.',
    soloEfectivo: {
      sena: 'La seña es en efectivo, en mano. Lo coordinás con el taller.',
      saldo: 'El saldo es en efectivo, en mano. Lo coordinás con el taller.',
    },
    tambienEfectivo: {
      sena: 'La seña también la podés dejar en efectivo, en mano, coordinándolo con el taller.',
      saldo: 'El saldo también lo podés pagar en efectivo, en mano, coordinándolo con el taller.',
    },
  },
  proyeccion: {
    coordinamosLaEntrega: 'Cuando lo apruebes y dejes la seña, coordinamos la fecha de entrega.',
    coordinamosLaEntregaAlAprobar: 'Cuando lo apruebes, coordinamos la fecha de entrega.',
    vencio: (fecha) =>
      `Este presupuesto venció el ${fecha}. Hablá con el taller para actualizarlo.`,
    siLoAprobasAntesDel: (antesDe, listoPara) =>
      `Si lo aprobás antes del ${antesDe}, podríamos tenerlo listo para el ${listoPara}.`,
    siDejasLaSenaAntesDel: (antesDe, listoPara) =>
      `Si dejás la seña antes del ${antesDe}, podríamos tenerlo listo para el ${listoPara}.`,
    vamosTomandoLosTrabajos: 'Vamos tomando los trabajos a medida que entran las señas.',
  },
  nota: {
    pendiente: {
      etiqueta: 'Por qué el número todavía puede cambiar',
      titulo: 'El número todavía puede cambiar',
    },
    hecho: {
      etiqueta: 'De dónde sale este número',
      titulo: 'El número ya está tomado de las medidas reales',
    },
    yaFuimosAMedir: 'Ya fuimos a medir.',
    fuimosAMedirEl: (fecha) => `Fuimos a medir el ${fecha}.`,
    armamosElPresupuesto: 'Con esas medidas armamos el presupuesto final.',
    cerrandoElPresupuesto: 'Con esas medidas estamos cerrando el presupuesto final.',
    resumenYaFuimos: 'Ya fuimos a medir',
    medidoEl: (fecha) => `Medido el ${fecha}`,
    faltaMedirDelEstimado: [
      'Lo que te pasamos es un estimado, sacado de lo que hablamos.',
      'Para cerrarlo tenemos que ir a tu casa a tomar las medidas.',
    ],
    sinFechaParaLaVisita: 'Todavía no tenemos fecha para la visita.',
    quedamosEnIrEl: (fecha) => `Quedamos en ir el ${fecha}.`,
    resumenFaltaMedir: 'Número estimado, falta ir a medir',
  },
};

const HITO_DEL_ESTIMATIVO = { id: 'estimativo', ...TEXTOS.hitos.estimativo } as const;
const HITOS = HITOS_DEL_CAMINO.map((id) => ({ id, ...TEXTOS.hitos[id] }));
const APROBADO_SIN_LA_SENA = TEXTOS.aprobadoSinLaSena;
const APROBASTE_EL_PRESUPUESTO = TEXTOS.eventos.aprobado;
const ARMAMOS_EL_PRESUPUESTO = TEXTOS.nota.armamosElPresupuesto;
const CERRANDO_EL_PRESUPUESTO = TEXTOS.nota.cerrandoElPresupuesto;
const COORDINAMOS_LA_ENTREGA = TEXTOS.proyeccion.coordinamosLaEntrega;
const COORDINAMOS_LA_ENTREGA_AL_APROBAR = TEXTOS.proyeccion.coordinamosLaEntregaAlAprobar;
const CUANDO_DEJES_LA_SENA = TEXTOS.cuandoDejesLaSena;
const CUANDO_LO_APRUEBES = TEXTOS.cuandoLoApruebes;
const EMPEZAMOS_A_FABRICARLO = TEXTOS.eventos.inicio;
const FALTA_MEDIR_DEL_ESTIMADO = TEXTOS.nota.faltaMedirDelEstimado;
const FUIMOS_A_MEDIR = TEXTOS.eventos.relevamiento;
const LISTO_PARA_ENTREGAR = TEXTOS.listoParaEntregar;
const LO_LLEVAMOS_Y_LO_INSTALAMOS = TEXTOS.eventos.entregado;
const NOTA_DEL_RELEVAMIENTO = { pendiente: TEXTOS.nota.pendiente, hecho: TEXTOS.nota.hecho };
const PASOS_PARA_TRANSFERIR = TEXTOS.comoPagar.pasosParaTransferir;
const PRESUPUESTO_MANDADO = TEXTOS.presupuestoMandado;
const QUE_ES_EL_RELEVAMIENTO = TEXTOS.queEsElRelevamiento;
const RECIBIMOS_TU_PAGO = TEXTOS.eventos.pago;
const RELEVAMIENTO_TECNICO = TEXTOS.relevamientoTecnico;
const RESUMEN_FALTA_MEDIR = TEXTOS.nota.resumenFaltaMedir;
const SIGUE = TEXTOS.sigue;
const SIGUE_CON_EL_PRESUPUESTO_MANDADO = TEXTOS.sigueConElPresupuestoMandado;
const SIGUE_CON_LA_COMPROMETIDA = TEXTOS.sigueConLaComprometida;
const SIGUE_CON_LA_SENA_CUBIERTA = TEXTOS.sigueConLaSenaCubierta;
const SIGUE_FALTA_LA_SENA = TEXTOS.sigueFaltaLaSena;
const SIGUE_FALTA_MEDIR = TEXTOS.sigueFaltaMedir;
const SIGUE_LISTO = TEXTOS.sigueListo;
const SIN_FECHA_PARA_LA_VISITA = TEXTOS.nota.sinFechaParaLaVisita;
const TE_PASAMOS_EL_ESTIMATIVO = TEXTOS.eventos.estimativo;
const TE_PASAMOS_EL_PRESUPUESTO = TEXTOS.eventos.presupuesto;
const TERMINAMOS_TU_MUEBLE = TEXTOS.eventos.listo;
const TITULAR_DEL_APROBADO = TEXTOS.titularDelAprobado;
const TITULAR_LISTO = TEXTOS.titularListo;
const VAMOS_TOMANDO_LOS_TRABAJOS = TEXTOS.proyeccion.vamosTomandoLosTrabajos;
const YA_ESTA_PAGADO = TEXTOS.yaEstaPagado;

function vistaDelCliente(trabajo: TrabajoDelCliente, hoy: string): VistaDelCliente {
  return vistaDelClienteCon(trabajo, hoy, TEXTOS);
}

function comoPagar(trabajo: TrabajoDelCliente, hoy: string) {
  return comoPagarCon(trabajo, hoy, TEXTOS.comoPagar);
}

function notaDelRelevamiento(
  vista: VistaDelCliente,
  formatos: Pick<FormatosDeFecha, 'larga' | 'corta'>,
) {
  return notaDelRelevamientoCon(vista, formatos, TEXTOS.nota);
}

function textoDeLaProyeccion(
  proyeccion: ProyeccionDeLaEntrega,
  formatos: Pick<FormatosDeFecha, 'enUnaFrase'>,
  sena: SenaDeLaVista['situacion'],
) {
  return textoDeLaProyeccionCon(proyeccion, formatos, sena, TEXTOS.proyeccion);
}

const HOY = '2026-09-18';

// El cliente ya no ve cuánto hace que no pasa nada: lo pone a echar cuentas contra el taller y en
// una obra de muebles pasan semanas sin un hito. Lo que ve son fechas y qué sigue (ADR 0046).
const HACE_TANTOS_DIAS = new RegExp(String.raw`[Hh]ace \d`);

function pago(id: string, fecha: string, monto: number, concepto = 'Pago'): PagoDelCliente {
  return { id, fecha, concepto, monto: centavos(monto) };
}

function fechas(cambios: Partial<FechasDelTrabajo>): FechasDelTrabajo {
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
    direccion: 'Olazábal 1240',
    estado: 'en_curso',
    precio: centavos(124_000_000),
    sena: null,
    fechas: fechas({}),
    visita: { dia: null, hecha: false },
    entrega: { comprometida: null, propuesta: null, respuesta: null },
    pago: { instancia: null, formas: [], monto: null, siguiente: null },
    cobro: { alias: null, cbu: null, titular: null, cuit: null, link: null },
    pagos: [],
    archivos: [],
    vidriera: VIDRIERA_VACIA,
    valorDelRelevamiento: null,
    presupuesto: null,
    ...cambios,
  };
}

function aprobada(vista: VistaDelCliente): VistaAprobada {
  if (!estaAprobada(vista)) throw new Error(`Se esperaba un trabajo aprobado y es ${vista.etapa}.`);
  return vista;
}

function esperandoLaSena(vista: VistaDelCliente): VistaEsperandoLaSena {
  if (vista.etapa !== 'esperando-la-sena') {
    throw new Error(`Se esperaba el presupuesto mandado y es ${vista.etapa}.`);
  }
  return vista;
}

// Los números del Escritorio de la captura: presupuesto de $ 1.248.000, seña del 50 %, y los
// $ 120.000 del relevamiento técnico ya pagados.
const PRESUPUESTO = 124_800_000;
const SENA = 62_400_000;
const RELEVAMIENTO = 12_000_000;
const FALTA_DE_LA_SENA = 50_400_000;
const SALDO_DESPUES = 62_400_000;

const PIDE_LA_SENA: PagoPendiente = {
  instancia: 'sena',
  formas: ['transferencia', 'efectivo'],
  monto: centavos(FALTA_DE_LA_SENA),
  siguiente: { instancia: 'saldo', formas: ['efectivo'], monto: centavos(SALDO_DESPUES) },
};

const PIDE_EL_SALDO: PagoPendiente = {
  instancia: 'saldo',
  formas: ['efectivo'],
  monto: centavos(SALDO_DESPUES),
  siguiente: null,
};

describe('el saldo y lo pagado, desde la aprobación', () => {
  it('suma los pagos y resta del precio', () => {
    const vista = aprobada(
      vistaDelCliente(
        trabajo({
          pagos: [pago('p1', '2026-08-04', 40_000_000), pago('p2', '2026-09-02', 40_000_000)],
        }),
        HOY,
      ),
    );
    expect(vista.pagado).toBe(80_000_000);
    expect(vista.saldo).toBe(44_000_000);
    expect(vista.saldado).toBe(false);
  });

  it('sin presupuesto no hay saldo, y no está saldado', () => {
    const vista = aprobada(
      vistaDelCliente(trabajo({ precio: null, pagos: [pago('p1', '2026-08-04', 1_000)] }), HOY),
    );
    expect(vista.saldo).toBeNull();
    expect(vista.saldado).toBe(false);
  });

  it('pagar de más sigue estando saldado', () => {
    const vista = aprobada(
      vistaDelCliente(
        trabajo({ precio: centavos(1_000), pagos: [pago('p1', '2026-08-04', 1_500)] }),
        HOY,
      ),
    );
    expect(vista.saldo).toBe(-500);
    expect(vista.saldado).toBe(true);
  });

  it('antes de aprobar no hay saldo que deber: la variante ni siquiera lo tiene', () => {
    for (const estado of ['contacto', 'a_presupuestar', 'presupuesto_enviado'] as const) {
      const vista = vistaDelCliente(
        trabajo({ estado, pagos: [pago('p1', '2026-08-04', 1_000)] }),
        HOY,
      );
      expect(estaAprobada(vista)).toBe(false);
      expect('saldo' in vista).toBe(false);
      expect(vista.pagado).toBe(1_000);
    }
  });
});

describe('el hito en el que está el trabajo', () => {
  it('lo que todavía está en consultas está en el presupuesto', () => {
    for (const estado of ['contacto', 'relevamiento', 'presupuesto_enviado'] as const) {
      expect(vistaDelCliente(trabajo({ estado }), HOY).hitoActual).toBe('presupuesto');
    }
  });

  it('aprobado pero sin empezar es «aprobado», y con el inicio ya pasado es «en fabricación»', () => {
    expect(vistaDelCliente(trabajo({ estado: 'en_curso' }), HOY).hitoActual).toBe('aprobado');
    expect(
      vistaDelCliente(
        trabajo({ estado: 'en_curso', fechas: fechas({ inicio: '2026-09-25' }) }),
        HOY,
      ).hitoActual,
    ).toBe('aprobado');
    expect(
      vistaDelCliente(
        trabajo({ estado: 'en_curso', fechas: fechas({ inicio: '2026-08-24' }) }),
        HOY,
      ).hitoActual,
    ).toBe('fabricacion');
  });

  it('entregado con saldo es «entregado», y entregado sin saldo ya es «pagado»', () => {
    const entregado = trabajo({
      estado: 'entregado',
      fechas: fechas({ entregado: '2026-09-16' }),
      pagos: [pago('p1', '2026-08-04', 40_000_000)],
    });
    expect(vistaDelCliente(entregado, HOY).hitoActual).toBe('entregado');
    expect(
      vistaDelCliente({ ...entregado, pagos: [pago('p1', '2026-08-04', 124_000_000)] }, HOY)
        .hitoActual,
    ).toBe('pagado');
  });

  it('cobrado es «pagado» aunque el saldo no dé cero', () => {
    expect(vistaDelCliente(trabajo({ estado: 'cobrado' }), HOY).hitoActual).toBe('pagado');
  });

  it('un estado que la vista pública nunca sirve cae en el primer hito, antes del presupuesto', () => {
    const vista = vistaDelCliente(trabajo({ estado: 'perdido' }), HOY);
    expect(vista.hitoActual).toBe('presupuesto');
    expect(vista.etapa).toBe('antes-del-presupuesto');
  });
});

describe('el camino', () => {
  it('sin estimativo son los cinco hitos, en orden', () => {
    const vista = vistaDelCliente(trabajo(), HOY);
    expect(vista.hitos.map((hito) => hito.id)).toEqual(HITOS.map((hito) => hito.id));
  });

  it('con estimativo, el estimativo va primero y los otros cinco siguen igual', () => {
    const vista = vistaDelCliente(trabajo({ fechas: fechas({ estimativo: '2026-08-20' }) }), HOY);
    expect(vista.hitos.map((hito) => hito.id)).toEqual([
      HITO_DEL_ESTIMATIVO.id,
      ...HITOS.map((hito) => hito.id),
    ]);
    expect(vista.hitos[0]).toMatchObject({
      estado: 'pasado',
      fecha: '2026-08-20',
      texto: 'Te pasamos un número estimado',
    });
  });

  it('los que faltan no muestran fecha: dicen qué va a pasar', () => {
    const vista = vistaDelCliente(
      trabajo({
        estado: 'en_curso',
        fechas: fechas({ presupuesto: '2026-08-01', aprobado: '2026-08-04', inicio: '2026-08-24' }),
      }),
      HOY,
    );
    const futuros = vista.hitos.filter((hito) => hito.estado === 'futuro');
    expect(futuros.map((hito) => hito.id)).toEqual(['entregado', 'pagado']);
    expect(futuros.every((hito) => hito.fecha === null)).toBe(true);
    expect(futuros.map((hito) => hito.texto)).toEqual([
      'Lo llevamos y lo instalamos',
      'Cuando esté saldado',
    ]);
  });

  it('el pasado lleva su fecha y su etiqueta, y el actual habla en presente', () => {
    const vista = vistaDelCliente(
      trabajo({
        estado: 'en_curso',
        fechas: fechas({ presupuesto: '2026-08-01', aprobado: '2026-08-04', inicio: '2026-08-24' }),
      }),
      HOY,
    );
    expect(vista.hitos[0]).toEqual({
      id: 'presupuesto',
      etiqueta: 'Presupuesto enviado',
      estado: 'pasado',
      fecha: '2026-08-01',
      texto: 'Presupuesto enviado',
    });
    expect(vista.hitos[2]).toEqual({
      id: 'fabricacion',
      etiqueta: 'En fabricación',
      estado: 'actual',
      fecha: '2026-08-24',
      texto: 'Lo estamos fabricando',
    });
  });

  it('sin la fecha de aprobación registrada, el paso no tiene fecha: un pago no es la aprobación', () => {
    const vista = vistaDelCliente(
      trabajo({ estado: 'en_curso', pagos: [pago('p1', '2026-08-04', 40_000_000)] }),
      HOY,
    );
    expect(vista.hitos[1]).toMatchObject({ id: 'aprobado', estado: 'pasado', fecha: null });
  });

  it('lo que ya pasó se tilda con su día, y en curso queda lo que se espera, sin fecha', () => {
    const mandado = vistaDelCliente(
      trabajo({ estado: 'presupuesto_enviado', fechas: fechas({ presupuesto: '2026-09-14' }) }),
      HOY,
    );
    expect(mandado.hitos[0]).toMatchObject({
      estado: 'pasado',
      fecha: '2026-09-14',
      texto: 'Presupuesto enviado',
    });
    expect(mandado.hitos[1]).toMatchObject({
      estado: 'actual',
      fecha: null,
      texto: 'Cuando lo apruebes y dejes la seña',
    });
    expect(mandado.titular).toBe(PRESUPUESTO_MANDADO);

    const enLaCola = vistaDelCliente(
      trabajo({
        estado: 'en_curso',
        fechas: fechas({ presupuesto: '2026-09-01', aprobado: '2026-09-05', inicio: '2026-09-28' }),
      }),
      HOY,
    );
    expect(enLaCola.hitos[1]).toMatchObject({ estado: 'pasado', fecha: '2026-09-05' });
    expect(enLaCola.hitos[2]).toMatchObject({
      estado: 'actual',
      fecha: null,
      texto: 'Vamos a empezar a fabricarlo',
    });

    const entregado = vistaDelCliente(
      trabajo({
        estado: 'entregado',
        fechas: fechas({ inicio: '2026-09-01', entregado: '2026-09-16' }),
        pagos: [pago('p1', '2026-08-04', 40_000_000)],
      }),
      HOY,
    );
    expect(entregado.hitos[3]).toMatchObject({
      estado: 'pasado',
      fecha: '2026-09-16',
      texto: 'Entregado',
    });
    expect(entregado.hitos[4]).toMatchObject({
      estado: 'actual',
      fecha: null,
      texto: 'Cuando esté saldado',
    });
    expect(entregado.titular).toBe('Ya está instalado en tu casa');
  });

  function sinPasarPorElAmarillo(dias: readonly Partial<TrabajoDelCliente>[]): HitoDelTrabajo[] {
    const caminos = dias.map((cambios) => vistaDelCliente(trabajo(cambios), HOY).hitos);
    const saltados: HitoDelTrabajo[] = [];
    for (let dia = 1; dia < caminos.length; dia += 1) {
      const antes = caminos[dia - 1] ?? [];
      (caminos[dia] ?? []).forEach((hito, paso) => {
        const estabaAntes = antes[paso]?.estado;
        if (hito.estado === 'pasado' && estabaAntes === 'futuro') saltados.push(hito.id);
      });
    }
    return saltados;
  }

  const HASTA_FABRICAR: readonly Partial<TrabajoDelCliente>[] = [
    { estado: 'contacto', precio: null },
    { estado: 'presupuesto_enviado', fechas: fechas({ presupuesto: '2026-09-10' }) },
    {
      estado: 'en_curso',
      fechas: fechas({ presupuesto: '2026-09-10', aprobado: '2026-09-18', inicio: '2026-09-18' }),
    },
  ];

  const ENTREGADO_EL_MISMO_DIA = fechas({
    presupuesto: '2026-09-10',
    aprobado: '2026-09-18',
    inicio: '2026-09-18',
    entregado: '2026-09-18',
  });

  it('el amarillo avanza de a un paso: la aprobación está en curso antes de tildarse, y con el mueble listo la entrega también', () => {
    expect(
      sinPasarPorElAmarillo([
        ...HASTA_FABRICAR,
        {
          estado: 'en_curso',
          fechas: fechas({
            presupuesto: '2026-09-10',
            aprobado: '2026-09-18',
            inicio: '2026-09-18',
            listo: '2026-09-18',
          }),
        },
        { estado: 'entregado', fechas: { ...ENTREGADO_EL_MISMO_DIA, listo: '2026-09-18' } },
      ]),
    ).toEqual([]);
  });

  it('un trabajo que se entregó sin que nadie marcara que estaba listo tilda la entrega junto con la fabricación', () => {
    expect(
      sinPasarPorElAmarillo([
        ...HASTA_FABRICAR,
        { estado: 'entregado', fechas: ENTREGADO_EL_MISMO_DIA },
      ]),
    ).toEqual(['entregado']);
  });

  it('pagado entero antes de la entrega, el último paso no pide el saldo: dice que ya está pagado', () => {
    const vista = vistaDelCliente(
      trabajo({
        fechas: fechas({ inicio: '2026-09-01' }),
        pagos: [pago('p1', '2026-09-10', 124_000_000)],
      }),
      HOY,
    );
    expect(vista.hitos[2]).toMatchObject({ estado: 'actual', texto: 'Lo estamos fabricando' });
    expect(vista.hitos[4]).toMatchObject({ estado: 'futuro', texto: YA_ESTA_PAGADO, fecha: null });
  });

  it('un inicio que todavía no llegó o que es posterior a la entrega no se muestra como el día que arrancó', () => {
    const vista = vistaDelCliente(
      trabajo({
        estado: 'entregado',
        fechas: fechas({ inicio: '2026-09-17', entregado: '2026-09-16' }),
        pagos: [pago('p1', '2026-08-04', 40_000_000)],
      }),
      HOY,
    );
    expect(vista.hitos[2]).toMatchObject({ id: 'fabricacion', estado: 'pasado', fecha: null });
    expect(vista.eventos.map((evento) => evento.texto)).not.toContain(EMPEZAMOS_A_FABRICARLO);
  });

  it('volver a preparar el presupuesto lo deja en curso, sin la fecha del que se mandó antes', () => {
    const vista = vistaDelCliente(
      trabajo({
        estado: 'a_presupuestar',
        precio: null,
        fechas: fechas({ presupuesto: '2026-09-10' }),
      }),
      HOY,
    );
    expect(vista.hitos[0]).toMatchObject({
      id: 'presupuesto',
      estado: 'actual',
      fecha: null,
      texto: 'Estamos preparando tu presupuesto',
    });
    expect(vista.eventos.map((evento) => evento.id)).not.toContain('presupuesto');

    const alEstimativo = vistaDelCliente(
      trabajo({
        estado: 'presupuesto_estimativo',
        precio: null,
        fechas: fechas({ estimativo: '2026-09-02', presupuesto: '2026-09-14' }),
      }),
      HOY,
    );
    expect(alEstimativo.eventos.map((evento) => evento.id)).toEqual(['estimativo']);

    const mandadoDeNuevo = vistaDelCliente(
      trabajo({ estado: 'presupuesto_enviado', fechas: fechas({ presupuesto: '2026-09-10' }) }),
      HOY,
    );
    expect(mandadoDeNuevo.eventos.map((evento) => [evento.id, evento.fecha])).toEqual([
      ['presupuesto', '2026-09-10'],
    ]);
  });

  it('con la fecha de aprobación registrada, el paso la lleva', () => {
    const vista = vistaDelCliente(
      trabajo({
        estado: 'en_curso',
        fechas: fechas({ aprobado: '2026-09-05' }),
        pagos: [pago('p1', '2026-08-04', 40_000_000)],
      }),
      HOY,
    );
    expect(vista.hitos[1]?.fecha).toBe('2026-09-05');
  });

  it('sin fecha de cobro, el hito pagado toma la del último pago que lo saldó', () => {
    const vista = vistaDelCliente(
      trabajo({
        estado: 'entregado',
        fechas: fechas({ entregado: '2026-09-16' }),
        pagos: [pago('p1', '2026-08-04', 100_000_000), pago('p2', '2026-09-17', 24_000_000)],
      }),
      HOY,
    );
    expect(vista.hitos[4]).toMatchObject({ estado: 'pasado', fecha: '2026-09-17' });
  });

  it('al llegar al final el camino queda completo: todo tildado, nada en curso, y el titular dice que está saldado', () => {
    const vista = vistaDelCliente(
      trabajo({
        estado: 'cobrado',
        fechas: fechas({ entregado: '2026-09-16', cobro: '2026-09-18' }),
        pagos: [pago('p1', '2026-08-04', 124_000_000)],
      }),
      HOY,
    );
    expect(vista.hitos.map((hito) => hito.estado)).toEqual(HITOS.map(() => 'pasado'));
    expect(vista.hitos.some((hito) => hito.estado === 'actual')).toBe(false);
    expect(vista.hitos[4]).toMatchObject({
      id: 'pagado',
      fecha: '2026-09-18',
      texto: 'Listo, está saldado',
    });
    expect(vista.titular).toBe('Listo, está saldado');
  });

  it('y con fecha de cobro, esa manda', () => {
    const vista = vistaDelCliente(
      trabajo({
        estado: 'cobrado',
        fechas: fechas({ entregado: '2026-09-16', cobro: '2026-09-18' }),
        pagos: [pago('p1', '2026-08-04', 124_000_000)],
      }),
      HOY,
    );
    expect(vista.hitos[4]?.fecha).toBe('2026-09-18');
  });

  it('un trabajo sin nada todavía no promete ninguna fecha', () => {
    const vista = vistaDelCliente(trabajo({ estado: 'contacto' }), HOY);
    expect(vista.hitos.every((hito) => hito.fecha === null)).toBe(true);
  });

  it('un trabajo de cero está saldado sin ningún pago, y entonces no hay día que mostrar', () => {
    const vista = aprobada(
      vistaDelCliente(trabajo({ estado: 'entregado', precio: centavos(0) }), HOY),
    );
    expect(vista.saldado).toBe(true);
    expect(vista.hitoActual).toBe('pagado');
    expect(vista.hitos[4]?.fecha).toBeNull();
  });
});

describe('el paso de la aprobación dice de la seña solo lo que es cierto', () => {
  function enLaCola(cambios: Partial<TrabajoDelCliente>): VistaAprobada {
    return aprobada(vistaDelCliente(trabajo({ estado: 'en_curso', ...cambios }), HOY));
  }

  it('con la seña cubierta: «Aprobado, seña cobrada» tildado, en la cola, y lo próximo es fabricarlo', () => {
    const vista = enLaCola({
      precio: centavos(PRESUPUESTO),
      sena: centavos(SENA),
      pagos: [pago('s', '2026-09-05', SENA)],
      pago: PIDE_EL_SALDO,
    });
    expect(vista.hitos[1]).toMatchObject({
      estado: 'pasado',
      etiqueta: 'Aprobado, seña cobrada',
      texto: 'Aprobado, seña cobrada',
    });
    expect(vista.hitos[2]).toMatchObject({
      estado: 'actual',
      texto: 'Vamos a empezar a fabricarlo',
    });
    expect(vista.titular).toBe(TITULAR_DEL_APROBADO.cubierta);
    expect(TITULAR_DEL_APROBADO.cubierta).toBe(
      'Recibimos la seña y ya estás en la cola del taller',
    );
    expect(vista.sigue).toBe(SIGUE.aprobado);
  });

  it('aprobado sin dejar la seña: no dice que la cobramos, queda en curso y lo próximo es la seña', () => {
    const vista = enLaCola({
      precio: centavos(PRESUPUESTO),
      sena: centavos(SENA),
      fechas: fechas({ aprobado: '2026-09-05' }),
      pagos: [],
      pago: { ...PIDE_LA_SENA, monto: centavos(SENA) },
    });
    expect(vista.hitos[1]).toMatchObject({
      estado: 'actual',
      etiqueta: APROBADO_SIN_LA_SENA,
      texto: CUANDO_DEJES_LA_SENA,
      fecha: null,
    });
    expect(vista.titular).toBe(TITULAR_DEL_APROBADO.falta);
    expect(vista.sigue).toBe(SIGUE_FALTA_LA_SENA);
    expect(vista.datos.sena).toEqual({
      situacion: 'falta',
      sena: SENA,
      aCuenta: 0,
      falta: SENA,
    });
  });

  it('sin presupuesto no se sabe cuánto es la seña: no afirma nada de ella', () => {
    const vista = enLaCola({ precio: null, sena: null });
    expect(vista.hitos[1]).toMatchObject({
      estado: 'pasado',
      etiqueta: APROBADO_SIN_LA_SENA,
      texto: APROBADO_SIN_LA_SENA,
    });
    expect(vista.titular).toBe(TITULAR_DEL_APROBADO['sin-presupuesto']);
    expect(vista.sigue).toBe(SIGUE.aprobado);
  });

  it('ya en fabricación con la seña sin completar, el paso pasado dice solo «Aprobado»', () => {
    const vista = enLaCola({
      fechas: fechas({ inicio: '2026-09-10' }),
      sena: centavos(62_000_000),
      pago: { ...PIDE_LA_SENA, monto: centavos(62_000_000) },
    });
    expect(vista.hitos[1]).toMatchObject({ estado: 'pasado', texto: APROBADO_SIN_LA_SENA });
  });

  it('con el presupuesto mandado, el paso queda en curso y dice qué hace falta', () => {
    const vista = vistaDelCliente(
      trabajo({ estado: 'presupuesto_enviado', sena: centavos(SENA), pago: PIDE_LA_SENA }),
      HOY,
    );
    expect(vista.hitos[1]).toMatchObject({
      estado: 'actual',
      texto: 'Cuando lo apruebes y dejes la seña',
    });
  });

  it('con la seña ya cubierta antes de aprobar, no se la vuelve a pedir: falta que lo apruebe', () => {
    const vista = vistaDelCliente(
      trabajo({
        estado: 'presupuesto_enviado',
        sena: centavos(SENA),
        pagos: [pago('s', '2026-09-15', SENA)],
      }),
      HOY,
    );
    expect(vista.hitos[1]).toMatchObject({ estado: 'actual', texto: CUANDO_LO_APRUEBES });
    expect(vista.sigue).toBe(SIGUE_CON_LA_SENA_CUBIERTA);
    expect(SIGUE_CON_LA_SENA_CUBIERTA).toBe('Lo próximo es que lo apruebes.');
  });
});

describe('lo que fue pasando', () => {
  it('arma la línea de tiempo con los hechos fechados, del más nuevo al más viejo', () => {
    const vista = vistaDelCliente(
      trabajo({
        estado: 'en_curso',
        fechas: fechas({ presupuesto: '2026-08-01', aprobado: '2026-08-04', inicio: '2026-09-06' }),
        pagos: [pago('p1', '2026-08-04', 40_000_000), pago('p2', '2026-09-02', 40_000_000)],
      }),
      HOY,
    );
    expect(vista.eventos.map((evento) => [evento.fecha, evento.texto])).toEqual([
      ['2026-09-06', EMPEZAMOS_A_FABRICARLO],
      ['2026-09-02', RECIBIMOS_TU_PAGO],
      ['2026-08-04', APROBASTE_EL_PRESUPUESTO],
      ['2026-08-04', RECIBIMOS_TU_PAGO],
      ['2026-08-01', TE_PASAMOS_EL_PRESUPUESTO],
    ]);
  });

  it('la aprobación sale de su registro: sin él no hay evento de aprobación, aunque haya pagos', () => {
    const vista = vistaDelCliente(
      trabajo({ estado: 'en_curso', pagos: [pago('p1', '2026-08-04', 40_000_000)] }),
      HOY,
    );
    expect(vista.eventos.map((evento) => evento.texto)).toEqual([RECIBIMOS_TU_PAGO]);
  });

  it('un inicio que todavía no llegó no es «empezamos a fabricarlo»', () => {
    const vista = vistaDelCliente(
      trabajo({ estado: 'en_curso', fechas: fechas({ inicio: '2026-09-25' }) }),
      HOY,
    );
    expect(vista.eventos.map((evento) => evento.texto)).not.toContain(EMPEZAMOS_A_FABRICARLO);
  });

  it('el pago que salda el trabajo lo dice, y lleva su importe aparte del texto', () => {
    const vista = vistaDelCliente(
      trabajo({
        estado: 'entregado',
        fechas: fechas({ entregado: '2026-09-16' }),
        pagos: [pago('p1', '2026-08-04', 100_000_000), pago('p2', '2026-09-17', 24_000_000)],
      }),
      HOY,
    );
    expect(vista.eventos[0]).toEqual({
      id: 'p2',
      fecha: '2026-09-17',
      texto: 'Recibimos el saldo y quedó saldado',
      hito: 'pagado',
      monto: 24_000_000,
    });
  });

  it('un único pago que cubre todo no se llama seña ni saldo', () => {
    const vista = vistaDelCliente(
      trabajo({ estado: 'entregado', pagos: [pago('p1', '2026-09-17', 124_000_000)] }),
      HOY,
    );
    expect(vista.eventos[0]?.texto).toBe('Recibimos el pago y quedó saldado');
  });

  it('dos cosas el mismo día se ordenan por el camino: la entrega después del pago', () => {
    const vista = vistaDelCliente(
      trabajo({
        estado: 'entregado',
        fechas: fechas({ inicio: '2026-09-16', entregado: '2026-09-16' }),
        pagos: [pago('p1', '2026-09-16', 40_000_000)],
      }),
      HOY,
    );
    expect(vista.eventos.map((evento) => evento.hito)).toEqual([
      'entregado',
      'fabricacion',
      'aprobado',
    ]);
  });

  it('dos pagos el mismo día conservan su orden, el más nuevo arriba', () => {
    const vista = vistaDelCliente(
      trabajo({ pagos: [pago('p1', '2026-09-16', 10_000), pago('p2', '2026-09-16', 20_000)] }),
      HOY,
    );
    expect(vista.eventos.map((evento) => evento.id)).toEqual(['p2', 'p1']);
  });

  it('el día de la aprobación, aprobar va arriba del pago de ese día', () => {
    const vista = vistaDelCliente(
      trabajo({
        estado: 'en_curso',
        fechas: fechas({ aprobado: '2026-09-16' }),
        pagos: [pago('s', '2026-09-16', 40_000_000)],
      }),
      HOY,
    );
    expect(vista.eventos.map((evento) => evento.id)).toEqual(['aprobado', 's']);
  });

  it('una entrega cargada con la obra en el taller no es una entrega', () => {
    const vista = vistaDelCliente(
      trabajo({ estado: 'en_curso', fechas: fechas({ entregado: '2026-09-16' }) }),
      HOY,
    );
    expect(vista.eventos.map((evento) => evento.texto)).not.toContain(LO_LLEVAMOS_Y_LO_INSTALAMOS);
  });

  it('un trabajo recién cargado no tiene nada que contar', () => {
    expect(vistaDelCliente(trabajo({ estado: 'contacto' }), HOY).eventos).toEqual([]);
  });
});

describe('la vista no le cuenta al cliente cuánto hace que no pasa nada', () => {
  it('de un trabajo quieto hace días sale lo que sigue, no el silencio', () => {
    const vista = vistaDelCliente(
      trabajo({ estado: 'en_curso', fechas: fechas({ inicio: '2026-08-01' }) }),
      HOY,
    );
    expect(vista.sigue).toBe('Lo próximo que vas a ver acá es la entrega.');
    expect(JSON.stringify(vista)).not.toMatch(HACE_TANTOS_DIAS);
  });

  it('ni de uno recién arrancado, ni de uno sin nada cargado, ni del que espera la seña', () => {
    for (const cambios of [
      { estado: 'en_curso' as const, fechas: fechas({ inicio: '2026-09-17' }) },
      { estado: 'contacto' as const },
      { estado: 'entregado' as const, fechas: fechas({ entregado: HOY }) },
      { estado: 'presupuesto_enviado' as const, fechas: fechas({ valeHasta: '2026-10-02' }) },
    ]) {
      expect(JSON.stringify(vistaDelCliente(trabajo(cambios), HOY))).not.toMatch(HACE_TANTOS_DIAS);
    }
  });

  it('saldado no promete nada más', () => {
    const vista = vistaDelCliente(
      trabajo({ estado: 'cobrado', pagos: [pago('p1', '2026-09-17', 124_000_000)] }),
      HOY,
    );
    expect(vista.sigue).toBe('');
  });
});

describe('qué se lee primero', () => {
  it('antes de la entrega manda la etapa', () => {
    const vista = aprobada(
      vistaDelCliente(
        trabajo({ estado: 'en_curso', fechas: fechas({ inicio: '2026-08-24' }) }),
        HOY,
      ),
    );
    expect(vista.foco).toBe('estado');
  });

  it('desde la entrega, con saldo pendiente, manda el saldo', () => {
    const vista = aprobada(
      vistaDelCliente(
        trabajo({
          estado: 'entregado',
          fechas: fechas({ entregado: '2026-09-16' }),
          pagos: [pago('p1', '2026-08-04', 40_000_000)],
        }),
        HOY,
      ),
    );
    expect(vista.foco).toBe('saldo');
  });

  it('entregado y saldado vuelve a la etapa: no hay cifra que cobrar', () => {
    const vista = aprobada(
      vistaDelCliente(
        trabajo({
          estado: 'entregado',
          fechas: fechas({ entregado: '2026-09-16' }),
          pagos: [pago('p1', '2026-08-04', 124_000_000)],
        }),
        HOY,
      ),
    );
    expect(vista.foco).toBe('estado');
  });

  it('entregado sin presupuesto tampoco tiene saldo que mostrar', () => {
    const vista = aprobada(
      vistaDelCliente(
        trabajo({ estado: 'entregado', precio: null, fechas: fechas({ entregado: '2026-09-16' }) }),
        HOY,
      ),
    );
    expect(vista.foco).toBe('estado');
  });
});

describe('lo que viaja es lo que llegó', () => {
  it('la vista pasa los archivos y los pagos tal cual, y no expone el trabajo crudo', () => {
    const entrada = trabajo({
      archivos: [
        {
          id: 'a1',
          nombre: 'Plano de frente',
          tipo: 'image/webp',
          ancho: 1600,
          alto: 900,
          fecha: '2026-08-02T12:00:00Z',
          ruta: 'h/p/a1.webp',
          rutaMini: 'h/p/a1.mini.webp',
        },
      ],
      pagos: [pago('p1', '2026-08-04', 1_000)],
    });
    const vista = vistaDelCliente(entrada, HOY);
    expect(vista.archivos).toBe(entrada.archivos);
    expect(vista.pagos).toBe(entrada.pagos);
    expect(vista).toMatchObject({
      taller: 'Taller MAUN',
      cliente: 'Marcela Duarte',
      titulo: 'Placard 3 puertas',
    });
    expect('trabajo' in vista).toBe(false);
  });
});

describe('los importes son centavos enteros con marca', () => {
  it('lo pagado sale de sumar los pagos', () => {
    const total: Money<Moneda> = vistaDelCliente(
      trabajo({ pagos: [pago('p1', '2026-08-04', 1), pago('p2', '2026-08-05', 2)] }),
      HOY,
    ).pagado;
    expect(total).toBe(3);
  });
});

describe('si hay cómo transferirle al taller', () => {
  it('alcanza con el alias o con el CBU: eso es lo que el cliente pega en su banco', () => {
    expect(
      hayComoTransferir({
        alias: 'maun.muebles',
        cbu: null,
        titular: null,
        cuit: null,
        link: null,
      }),
    ).toBe(true);
    expect(
      hayComoTransferir({
        alias: null,
        cbu: '0110001312345678901233',
        titular: null,
        cuit: null,
        link: null,
      }),
    ).toBe(true);
  });

  it('el titular y el CUIT solos no alcanzan: con eso no se transfiere', () => {
    expect(
      hayComoTransferir({
        alias: null,
        cbu: null,
        titular: 'Ana Gutiérrez',
        cuit: '27-30123456-4',
        link: null,
      }),
    ).toBe(false);
    expect(
      hayComoTransferir({ alias: null, cbu: null, titular: null, cuit: null, link: null }),
    ).toBe(false);
  });
});

describe('cómo puede pagar el cliente lo que le toca', () => {
  const CUENTA = {
    alias: 'maun.muebles',
    cbu: '0110001312345678901233',
    titular: 'Ana Gutiérrez',
    cuit: null,
    link: null,
  };

  it('con todo pagado no hay nada que ofrecer', () => {
    expect(comoPagar(trabajo(), HOY)).toBeNull();
  });

  it('por transferencia arma el importe listo para pegar en el banco, con la cuenta', () => {
    const como = comoPagar(
      trabajo({
        cobro: CUENTA,
        pago: {
          instancia: 'sena',
          formas: ['transferencia'],
          monto: centavos(150_000_000),
          siguiente: null,
        },
      }),
      HOY,
    );
    expect(como).toMatchObject({
      instancia: 'sena',
      transferencia: true,
      efectivo: false,
      faltanLosDatos: false,
      montoParaPegar: '1500000',
      etiquetaDelImporte: 'Ahora, la seña',
      cuenta: {
        alias: 'maun.muebles',
        cbu: '0110001312345678901233',
        titular: 'Ana Gutiérrez',
        cuit: null,
      },
    });
    expect(como?.pasos).toBe(PASOS_PARA_TRANSFERIR);
  });

  it('en efectivo lo dice sin decir «también»: no hay otra forma, y no hay cuenta que mostrar', () => {
    const como = comoPagar(
      trabajo({
        cobro: CUENTA,
        pago: {
          instancia: 'saldo',
          formas: ['efectivo'],
          monto: centavos(44_000_000),
          siguiente: null,
        },
      }),
      HOY,
    );
    expect(como).toMatchObject({ transferencia: false, efectivo: true });
    expect(como?.cuenta).toEqual({ alias: null, cbu: null, titular: null, cuit: null });
    expect(como?.enEfectivo).toBe('El saldo es en efectivo, en mano. Lo coordinás con el taller.');
  });

  it('con las dos, la línea del efectivo es la segunda opción', () => {
    const como = comoPagar(
      trabajo({
        cobro: CUENTA,
        pago: {
          instancia: 'saldo',
          formas: ['transferencia', 'efectivo'],
          monto: centavos(44_000_000),
          siguiente: null,
        },
      }),
      HOY,
    );
    expect(como).toMatchObject({ transferencia: true, efectivo: true });
    expect(como?.enEfectivo).toContain('también');
  });

  it('si pide transferencia y el taller no cargó la cuenta, lo dice en vez de mostrar un bloque vacío', () => {
    const como = comoPagar(
      trabajo({
        pago: {
          instancia: 'sena',
          formas: ['transferencia'],
          monto: centavos(100),
          siguiente: null,
        },
      }),
      HOY,
    );
    expect(como).toMatchObject({ transferencia: false, efectivo: false, faltanLosDatos: true });
  });

  it('sin importe todavía, no hay nada que copiar', () => {
    const como = comoPagar(
      trabajo({
        precio: null,
        cobro: CUENTA,
        pago: {
          instancia: 'sena',
          formas: ['transferencia', 'efectivo'],
          monto: null,
          siguiente: null,
        },
      }),
      HOY,
    );
    expect(como?.monto).toBeNull();
    expect(como?.montoParaPegar).toBeNull();
  });

  it('cuando hay otro pago después, lo nombra con su importe y con cómo se paga', () => {
    const como = comoPagar(
      trabajo({
        cobro: CUENTA,
        pago: {
          instancia: 'sena',
          formas: ['transferencia'],
          monto: centavos(50_000_000),
          siguiente: { instancia: 'saldo', formas: ['efectivo'], monto: centavos(80_000_000) },
        },
      }),
      HOY,
    );

    expect(como?.siguiente).toEqual({
      instancia: 'saldo',
      monto: centavos(80_000_000),
      nombre: 'el saldo',
      comoSePaga: 'en efectivo',
    });
  });

  it('el «cómo se paga» del que sigue nombra las dos formas cuando las hay', () => {
    const conLasDos = comoPagar(
      trabajo({
        cobro: CUENTA,
        pago: {
          instancia: 'sena',
          formas: ['transferencia'],
          monto: centavos(1),
          siguiente: { instancia: 'saldo', formas: ['transferencia', 'efectivo'], monto: null },
        },
      }),
      HOY,
    );
    expect(conLasDos?.siguiente?.comoSePaga).toBe('por transferencia o en efectivo');

    const soloTransferencia = comoPagar(
      trabajo({
        cobro: CUENTA,
        pago: {
          instancia: 'sena',
          formas: ['efectivo'],
          monto: centavos(1),
          siguiente: { instancia: 'saldo', formas: ['transferencia'], monto: centavos(2) },
        },
      }),
      HOY,
    );
    expect(soloTransferencia?.siguiente?.comoSePaga).toBe('por transferencia');
  });

  it('sin otro pago después, no hay nada que anticipar', () => {
    const como = comoPagar(
      trabajo({
        cobro: CUENTA,
        pago: { instancia: 'saldo', formas: ['efectivo'], monto: centavos(1), siguiente: null },
      }),
      HOY,
    );

    expect(como?.siguiente).toBeNull();
  });

  it('ningún texto del cliente dice «arreglar»: acá se lee como reparar', () => {
    for (const instancia of ['sena', 'saldo'] as const) {
      for (const formas of [
        ['transferencia'],
        ['efectivo'],
        ['transferencia', 'efectivo'],
      ] as const) {
        const como = comoPagar(
          trabajo({
            cobro: CUENTA,
            pago: { instancia, formas, monto: centavos(1_000), siguiente: null },
          }),
          HOY,
        );
        expect(JSON.stringify(como)).not.toMatch(/arregl/i);
      }
    }
  });

  it('la vista trae lo mismo que devuelve comoPagar para su trabajo', () => {
    const entrada = trabajo({
      estado: 'presupuesto_enviado',
      cobro: CUENTA,
      sena: centavos(SENA),
      pago: PIDE_LA_SENA,
    });
    expect(vistaDelCliente(entrada, HOY).comoPagar).toEqual(comoPagar(entrada, HOY));
  });
});

describe('el link de Mercado Pago del taller', () => {
  const CON_LINK: CobroDelTaller = {
    alias: 'maun.muebles',
    cbu: '0110001312345678901233',
    titular: 'Ana Gutiérrez',
    cuit: null,
    link: 'https://mpago.la/2vXyZ1',
  };

  const SOLO_EL_LINK: CobroDelTaller = {
    alias: null,
    cbu: null,
    titular: null,
    cuit: null,
    link: 'https://mpago.la/2vXyZ1',
  };

  function conCobro(cobro: CobroDelTaller, formas: readonly FormaDeCobro[]) {
    return comoPagar(
      trabajo({
        cobro,
        pago: { instancia: 'sena', formas, monto: centavos(45_000_000), siguiente: null },
      }),
      HOY,
    );
  }

  it('lo devuelve sin tocar los pasos: el alias sigue siendo la forma sin comisión', () => {
    const como = conCobro(CON_LINK, ['transferencia']);
    expect(como?.link).toBe('https://mpago.la/2vXyZ1');
    expect(como?.pasos).toBe(PASOS_PARA_TRANSFERIR);
  });

  it('sin link los pasos son los mismos', () => {
    const como = conCobro({ ...CON_LINK, link: null }, ['transferencia']);
    expect(como?.link).toBeNull();
    expect(como?.pasos).toBe(PASOS_PARA_TRANSFERIR);
  });

  it('el logo de Mercado Pago va siempre que el pago se ofrezca por transferencia, con link', () => {
    expect(conCobro(CON_LINK, ['transferencia'])?.mercadoPago).toBe(true);
  });

  it('y sin link también: depende de la forma de cobro, no del link', () => {
    expect(conCobro({ ...CON_LINK, link: null }, ['transferencia'])?.mercadoPago).toBe(true);
  });

  it('no mira de qué entidad es la cuenta: con un CVU de Mercado Pago o un CBU de banco, igual', () => {
    const conCvu = { ...CON_LINK, link: null, cbu: '0000003100012345678907' };
    const conCbu = { ...CON_LINK, link: null, cbu: '0110001312345678901233' };
    expect(conCobro(conCvu, ['transferencia'])?.mercadoPago).toBe(true);
    expect(conCobro(conCbu, ['transferencia'])?.mercadoPago).toBe(true);
  });

  it('con transferencia y efectivo a elegir, también va', () => {
    expect(conCobro(CON_LINK, ['transferencia', 'efectivo'])?.mercadoPago).toBe(true);
  });

  it('en efectivo, no', () => {
    const cobro = { ...CON_LINK, link: null, cbu: '0000003100012345678907' };
    expect(conCobro(cobro, ['efectivo'])?.mercadoPago).toBe(false);
  });

  it('por transferencia pero sin ningún dato cargado, tampoco: no hay datos a los que acompañar', () => {
    const vacio = { alias: null, cbu: null, titular: null, cuit: null, link: null };
    const como = conCobro(vacio, ['transferencia']);
    expect(como?.faltanLosDatos).toBe(true);
    expect(como?.mercadoPago).toBe(false);
  });

  it('no viaja si ese pago es en efectivo, igual que la cuenta', () => {
    const como = conCobro(CON_LINK, ['efectivo']);
    expect(como?.link).toBeNull();
    expect(como?.transferencia).toBe(false);
  });

  it('tener solo el link ya alcanza para poder cobrar sin efectivo', () => {
    expect(hayComoTransferir(SOLO_EL_LINK)).toBe(true);
    const como = conCobro(SOLO_EL_LINK, ['transferencia']);
    expect(como?.transferencia).toBe(true);
    expect(como?.faltanLosDatos).toBe(false);
    expect(como?.link).toBe('https://mpago.la/2vXyZ1');
  });
});

describe('un trabajo guardado por una versión vieja de la app', () => {
  it('no rompe: sin «pago» no hay nada que cobrar, y la página se dibuja igual', () => {
    const { pago: _pago, ...viejo } = trabajo();
    const comoLoGuardoLaVersionVieja = viejo as unknown as TrabajoDelCliente;

    expect(() => comoPagar(comoLoGuardoLaVersionVieja, HOY)).not.toThrow();
    expect(comoPagar(comoLoGuardoLaVersionVieja, HOY)).toBeNull();
    expect(() => vistaDelCliente(comoLoGuardoLaVersionVieja, HOY)).not.toThrow();
  });

  it('sin la fecha del estimativo ni la visita, dibuja el camino de siempre', () => {
    const base = trabajo({ estado: 'relevamiento' });
    const { visita: _visita, ...sinVisita } = base;
    const { estimativo: _estimativo, ...fechasViejas } = base.fechas;
    const comoLoGuardoLaVersionVieja = {
      ...sinVisita,
      fechas: fechasViejas,
    } as unknown as TrabajoDelCliente;

    const vista = vistaDelCliente(comoLoGuardoLaVersionVieja, HOY);
    expect(vista.hitos.map((hito) => hito.id)).toEqual(HITOS.map((hito) => hito.id));
    expect(vista.relevamiento).toMatchObject({ estado: 'pendiente', fecha: null });
    expect(vista.eventos).toEqual([]);
  });

  it('tampoco rompe si le falta la cuenta para transferir', () => {
    const { cobro: _cobro, ...viejo } = trabajo({
      pago: {
        instancia: 'sena',
        formas: ['transferencia'],
        monto: centavos(1_000),
        siguiente: null,
      },
    });
    expect(comoPagar(viejo as unknown as TrabajoDelCliente, HOY)).toBeNull();
  });

  it('sin «pago», o con la seña pedida sin importe, la seña no se da por cubierta', () => {
    const { pago: _pago, ...sinPago } = trabajo({
      estado: 'presupuesto_enviado',
      sena: centavos(SENA),
    });
    expect(
      esperandoLaSena(vistaDelCliente(sinPago as unknown as TrabajoDelCliente, HOY)).sena,
    ).toEqual({ situacion: 'sin-presupuesto' });

    const sinImporte = trabajo({
      estado: 'presupuesto_enviado',
      sena: centavos(SENA),
      pago: { ...PIDE_LA_SENA, monto: null },
    });
    expect(esperandoLaSena(vistaDelCliente(sinImporte, HOY)).sena).toEqual({
      situacion: 'sin-presupuesto',
    });
  });

  it('sin la seña en pesos ni hasta cuándo vale, el presupuesto mandado se lee sin seña y sin fecha', () => {
    const { sena: _sena, ...sinSena } = trabajo({ estado: 'presupuesto_enviado' });
    const { valeHasta: _valeHasta, ...fechasViejas } = sinSena.fechas;
    const vista = esperandoLaSena(
      vistaDelCliente({ ...sinSena, fechas: fechasViejas } as unknown as TrabajoDelCliente, HOY),
    );
    expect(vista.sena).toEqual({ situacion: 'sin-presupuesto' });
    expect(vista.proyeccion).toEqual({ situacion: 'sin-fecha' });
  });

  it('sin la vidriera, la página se dibuja con la vidriera vacía', () => {
    const { vidriera: _vidriera, ...viejo } = trabajo();
    expect(vistaDelCliente(viejo as unknown as TrabajoDelCliente, HOY).vidriera).toEqual(
      VIDRIERA_VACIA,
    );
  });

  it('sin las facturas, la página se dibuja sin facturas', () => {
    const { facturas: _facturas, ...viejo } = trabajo({ facturas: [] });
    expect(vistaDelCliente(viejo, HOY).facturas).toEqual([]);
  });
});

describe('las facturas en la página del cliente', () => {
  const EMISOR = {
    nombreDelTaller: 'Taller MAUN',
    razonSocial: 'Ana Gutiérrez',
    domicilio: 'Olazábal 1240, CABA',
    cuit: '20-11111111-2',
    ingresosBrutos: '901-123456-7',
    inicioDeActividades: '2019-03-01',
  };
  const FACTURA: FacturaDelCliente = {
    id: 'c1',
    tipo: 'factura_c',
    puntoDeVenta: 3,
    numero: 42,
    fecha: '2026-09-10',
    importe: centavos(45_000_000),
    detalle: 'Seña — Placard 3 puertas',
    cae: '76398765432109',
    caeVence: '2026-09-20',
    prueba: false,
    emisor: EMISOR,
    receptor: {
      nombre: 'Marcela Duarte',
      condicion: 'consumidor_final',
      docTipo: 96,
      docNro: '28456789',
      domicilio: '',
    },
    anuladaPor: { puntoDeVenta: 3, numero: 7, fecha: '2026-09-12' },
    anulaA: null,
  };
  const NOTA: FacturaDelCliente = {
    ...FACTURA,
    id: 'c2',
    tipo: 'nota_de_credito_c',
    numero: 7,
    fecha: '2026-09-12',
    cae: '76398765432110',
    caeVence: '2026-09-22',
    anuladaPor: null,
    anulaA: { puntoDeVenta: 3, numero: 42, fecha: '2026-09-10' },
  };

  it.each(['contacto', 'presupuesto_enviado', 'en_curso', 'cobrado'] as const)(
    'llegan tal cual con el trabajo en %s: la de la seña existe antes de aprobar',
    (estado) => {
      expect(vistaDelCliente(trabajo({ estado, facturas: [FACTURA, NOTA] }), HOY).facturas).toEqual(
        [FACTURA, NOTA],
      );
    },
  );
});

describe('la vidriera del taller en la página del cliente', () => {
  const VIDRIERA: VidrieraDelTaller = {
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
  };

  it('llega igual en todas las etapas, antes y después de aprobar', () => {
    for (const estado of ['contacto', 'presupuesto_enviado', 'en_curso', 'cobrado'] as const) {
      expect(vistaDelCliente(trabajo({ estado, vidriera: VIDRIERA }), HOY).vidriera).toBe(VIDRIERA);
    }
  });
});

const FORMATOS: FormatosDeFecha = {
  larga: (fecha) => `larga(${fecha})`,
  corta: (fecha) => `corta(${fecha})`,
  enUnaFrase: (fecha) => `frase(${fecha})`,
};

interface CasoDeEtapa {
  nombre: string;
  cambios: Partial<TrabajoDelCliente>;
  etapa: EtapaDeLaVista;
  camino: readonly (readonly [HitoDelTrabajo, EstadoDelHito])[];
  titular: TitularDeLaVista;
  relevamiento: { estado: 'pendiente' | 'hecho'; fecha: string | null } | null;
  nota: EstadoDelRelevamiento | null;
  sigue: string;
  conElBloqueDelRelevamiento?: true;
}

const SIN_ESTIMATIVO = (
  enCurso: HitoDelTrabajo,
): readonly (readonly [HitoDelTrabajo, EstadoDelHito])[] => {
  const indice = HITOS.findIndex((hito) => hito.id === enCurso);
  return HITOS.map(
    (hito, cual) =>
      [hito.id, cual < indice ? 'pasado' : cual === indice ? 'actual' : 'futuro'] as const,
  );
};

const CON_ESTIMATIVO = (
  enCurso: HitoDelTrabajo,
): readonly (readonly [HitoDelTrabajo, EstadoDelHito])[] => [
  ['estimativo', 'pasado'],
  ...SIN_ESTIMATIVO(enCurso),
];

const COMPLETO: readonly (readonly [HitoDelTrabajo, EstadoDelHito])[] = HITOS.map(
  (hito) => [hito.id, 'pasado'] as const,
);

const INICIO = '2026-09-01';

const LISTO = '2026-09-17';

const SIN_COORDINAR: EntregaQueSeCoordina = {
  comprometida: null,
  propuesta: null,
  respuesta: null,
};

const UN_DIA: PropuestaDeEntrega = {
  id: '0192a3b4-c5d6-7e8f-9a0b-000000000071',
  forma: 'un_dia',
  fecha: '2026-09-24',
  franja: 'manana',
};

const SUS_DIAS: PropuestaDeEntrega = {
  id: '0192a3b4-c5d6-7e8f-9a0b-000000000072',
  forma: 'sus_dias',
  fecha: null,
  franja: null,
};

const SUS_DIAS_MANDADOS: RespuestaDelCliente = {
  respuesta: 'mis_dias',
  dias: [{ fecha: '2026-09-22', franjas: ['manana', 'tarde'] }],
  nota: 'Tercer piso',
};

const COMPROMETIDA: ComprometidaDelTrabajo = { fecha: '2026-09-25', franja: 'manana' };

function conPropuesta(
  propuesta: PropuestaDeEntrega,
  respuesta: RespuestaDelCliente | null = null,
): EntregaQueSeCoordina {
  return { comprometida: null, propuesta, respuesta };
}

const CASOS_POR_ETAPA: readonly CasoDeEtapa[] = [
  {
    nombre: 'contacto: se prepara el presupuesto y falta ir a medir, sin día todavía',
    cambios: { estado: 'contacto', precio: null },
    etapa: 'antes-del-presupuesto',
    camino: SIN_ESTIMATIVO('presupuesto'),
    titular: 'Estamos preparando tu presupuesto',
    relevamiento: { estado: 'pendiente', fecha: null },
    nota: null,
    sigue: '',
    conElBloqueDelRelevamiento: true,
  },
  {
    nombre:
      'contacto con la visita agendada: el relevamiento guarda el día, y sin estimativo no hay nota',
    cambios: { estado: 'contacto', precio: null, visita: { dia: '2026-09-25', hecha: false } },
    etapa: 'antes-del-presupuesto',
    camino: SIN_ESTIMATIVO('presupuesto'),
    titular: 'Estamos preparando tu presupuesto',
    relevamiento: { estado: 'pendiente', fecha: '2026-09-25' },
    nota: null,
    sigue: '',
    conElBloqueDelRelevamiento: true,
  },
  {
    nombre:
      'estimativo enviado antes de medir: queda tildado, el presupuesto en curso, y la nota dice que el número puede cambiar',
    cambios: {
      estado: 'presupuesto_estimativo',
      precio: null,
      fechas: fechas({ estimativo: '2026-09-15' }),
    },
    etapa: 'antes-del-presupuesto',
    camino: CON_ESTIMATIVO('presupuesto'),
    titular: 'Te pasamos un número estimado',
    relevamiento: { estado: 'pendiente', fecha: null },
    nota: 'pendiente',
    sigue: '',
    conElBloqueDelRelevamiento: true,
  },
  {
    nombre: 'estimativo enviado después de medir: la nota dice de dónde sale el número',
    cambios: {
      estado: 'presupuesto_estimativo',
      precio: null,
      fechas: fechas({ estimativo: '2026-09-15' }),
      visita: { dia: '2026-09-12', hecha: false },
    },
    etapa: 'antes-del-presupuesto',
    camino: CON_ESTIMATIVO('presupuesto'),
    titular: 'Te pasamos un número estimado',
    relevamiento: { estado: 'hecho', fecha: '2026-09-12' },
    nota: 'hecho',
    sigue: SIGUE.estimativo,
  },
  {
    nombre: 'relevamiento sin día: falta ir a medir y no se inventa una fecha',
    cambios: { estado: 'relevamiento', precio: null },
    etapa: 'antes-del-presupuesto',
    camino: SIN_ESTIMATIVO('presupuesto'),
    titular: 'Estamos preparando tu presupuesto',
    relevamiento: { estado: 'pendiente', fecha: null },
    nota: null,
    sigue: '',
    conElBloqueDelRelevamiento: true,
  },
  {
    nombre: 'relevamiento con el día acordado',
    cambios: { estado: 'relevamiento', precio: null, visita: { dia: '2026-09-22', hecha: false } },
    etapa: 'antes-del-presupuesto',
    camino: SIN_ESTIMATIVO('presupuesto'),
    titular: 'Estamos preparando tu presupuesto',
    relevamiento: { estado: 'pendiente', fecha: '2026-09-22' },
    nota: null,
    sigue: '',
    conElBloqueDelRelevamiento: true,
  },
  {
    nombre: 'relevamiento con el día ya pasado y sin marcar: sigue pendiente y no promete ese día',
    cambios: { estado: 'relevamiento', precio: null, visita: { dia: '2026-09-16', hecha: false } },
    etapa: 'antes-del-presupuesto',
    camino: SIN_ESTIMATIVO('presupuesto'),
    titular: 'Estamos preparando tu presupuesto',
    relevamiento: { estado: 'pendiente', fecha: null },
    nota: null,
    sigue: '',
    conElBloqueDelRelevamiento: true,
  },
  {
    nombre: 'relevamiento tildado en la hoja del contacto: hecho, con su día',
    cambios: { estado: 'relevamiento', precio: null, visita: { dia: '2026-09-16', hecha: true } },
    etapa: 'antes-del-presupuesto',
    camino: SIN_ESTIMATIVO('presupuesto'),
    titular: 'Estamos preparando tu presupuesto',
    relevamiento: { estado: 'hecho', fecha: '2026-09-16' },
    nota: 'hecho',
    sigue: SIGUE.presupuesto,
  },
  {
    nombre: 'a presupuestar después de medir, con un estimativo antes',
    cambios: {
      estado: 'a_presupuestar',
      precio: null,
      fechas: fechas({ estimativo: '2026-09-02' }),
      visita: { dia: '2026-09-10', hecha: true },
    },
    etapa: 'antes-del-presupuesto',
    camino: CON_ESTIMATIVO('presupuesto'),
    titular: 'Estamos preparando tu presupuesto',
    relevamiento: { estado: 'hecho', fecha: '2026-09-10' },
    nota: 'hecho',
    sigue: SIGUE.presupuesto,
  },
  {
    nombre: 'a presupuestar sin visita: no hizo falta medir y no hay nota',
    cambios: { estado: 'a_presupuestar', precio: null },
    etapa: 'antes-del-presupuesto',
    camino: SIN_ESTIMATIVO('presupuesto'),
    titular: 'Estamos preparando tu presupuesto',
    relevamiento: null,
    nota: null,
    sigue: SIGUE.presupuesto,
  },
  {
    nombre:
      'presupuesto enviado: el paso queda tildado, la aprobación en curso, y lo que sigue es aprobarlo',
    cambios: {
      estado: 'presupuesto_enviado',
      fechas: fechas({ presupuesto: '2026-09-14' }),
      visita: { dia: '2026-09-10', hecha: true },
    },
    etapa: 'esperando-la-sena',
    camino: SIN_ESTIMATIVO('aprobado'),
    titular: PRESUPUESTO_MANDADO,
    relevamiento: { estado: 'hecho', fecha: '2026-09-10' },
    nota: 'hecho',
    sigue: SIGUE_CON_EL_PRESUPUESTO_MANDADO,
  },
  {
    nombre: 'presupuesto enviado sin haber ido a medir: tampoco hay nota',
    cambios: { estado: 'presupuesto_enviado', fechas: fechas({ presupuesto: '2026-09-14' }) },
    etapa: 'esperando-la-sena',
    camino: SIN_ESTIMATIVO('aprobado'),
    titular: PRESUPUESTO_MANDADO,
    relevamiento: null,
    nota: null,
    sigue: SIGUE_CON_EL_PRESUPUESTO_MANDADO,
  },
  {
    nombre:
      'presupuesto enviado con la seña ya cubierta a cuenta: lo único que falta es que lo apruebe',
    cambios: {
      estado: 'presupuesto_enviado',
      precio: centavos(PRESUPUESTO),
      sena: centavos(SENA),
      fechas: fechas({ presupuesto: '2026-09-14' }),
      pagos: [pago('s', '2026-09-15', SENA)],
    },
    etapa: 'esperando-la-sena',
    camino: SIN_ESTIMATIVO('aprobado'),
    titular: PRESUPUESTO_MANDADO,
    relevamiento: null,
    nota: null,
    sigue: SIGUE_CON_LA_SENA_CUBIERTA,
  },
  {
    nombre: 'aprobado y sin empezar: la visita de antes cuenta como hecha y la nota ya no está',
    cambios: {
      estado: 'en_curso',
      precio: centavos(PRESUPUESTO),
      sena: centavos(SENA),
      pago: PIDE_EL_SALDO,
      pagos: [pago('s', '2026-09-05', SENA)],
      fechas: fechas({ presupuesto: '2026-09-01', aprobado: '2026-09-05' }),
      visita: { dia: '2026-08-28', hecha: false },
    },
    etapa: 'aprobado',
    camino: SIN_ESTIMATIVO('fabricacion'),
    titular: 'Recibimos la seña y ya estás en la cola del taller',
    relevamiento: { estado: 'hecho', fecha: '2026-08-28' },
    nota: null,
    sigue: SIGUE.aprobado,
  },
  {
    nombre: 'aprobado sin la seña: la aprobación sigue en curso hasta que la deja',
    cambios: {
      estado: 'en_curso',
      precio: centavos(PRESUPUESTO),
      sena: centavos(SENA),
      pago: { ...PIDE_LA_SENA, monto: centavos(SENA) },
      fechas: fechas({ presupuesto: '2026-09-01', aprobado: '2026-09-05' }),
    },
    etapa: 'aprobado',
    camino: SIN_ESTIMATIVO('aprobado'),
    titular: TITULAR_DEL_APROBADO.falta,
    relevamiento: null,
    nota: null,
    sigue: SIGUE_FALTA_LA_SENA,
  },
  {
    nombre: 'aprobado sin presupuesto: no hay seña que esperar, y lo que sigue es arrancar',
    cambios: { estado: 'en_curso', precio: null, sena: null },
    etapa: 'aprobado',
    camino: SIN_ESTIMATIVO('fabricacion'),
    titular: TITULAR_DEL_APROBADO['sin-presupuesto'],
    relevamiento: null,
    nota: null,
    sigue: SIGUE.aprobado,
  },
  {
    nombre: 'en fabricación',
    cambios: { estado: 'en_curso', fechas: fechas({ inicio: '2026-09-10' }) },
    etapa: 'fabricacion',
    camino: SIN_ESTIMATIVO('fabricacion'),
    titular: 'Lo estamos fabricando',
    relevamiento: null,
    nota: null,
    sigue: SIGUE.fabricacion,
  },
  {
    nombre: 'entregado con saldo',
    cambios: {
      estado: 'entregado',
      fechas: fechas({ entregado: '2026-09-16' }),
      pagos: [pago('p1', '2026-08-04', 40_000_000)],
    },
    etapa: 'entregado',
    camino: SIN_ESTIMATIVO('pagado'),
    titular: 'Ya está instalado en tu casa',
    relevamiento: null,
    nota: null,
    sigue: SIGUE.entregado,
  },
  {
    nombre: 'entregado y saldado: el camino queda completo, sin ningún paso en curso',
    cambios: { estado: 'entregado', pagos: [pago('p1', '2026-09-16', 124_000_000)] },
    etapa: 'pagado',
    camino: COMPLETO,
    titular: 'Listo, está saldado',
    relevamiento: null,
    nota: null,
    sigue: '',
  },
  {
    nombre: 'cobrado: el camino queda completo, sin ningún paso en curso',
    cambios: {
      estado: 'cobrado',
      fechas: fechas({ cobro: '2026-09-17' }),
      pagos: [pago('p1', '2026-09-17', 124_000_000)],
    },
    etapa: 'pagado',
    camino: COMPLETO,
    titular: 'Listo, está saldado',
    relevamiento: null,
    nota: null,
    sigue: '',
  },
  {
    nombre:
      'cobrado después de un estimativo: el camino entero queda completo, estimativo incluido',
    cambios: {
      estado: 'cobrado',
      fechas: fechas({ estimativo: '2026-08-20', cobro: '2026-09-17' }),
      pagos: [pago('p1', '2026-09-17', 124_000_000)],
    },
    etapa: 'pagado',
    camino: [['estimativo', 'pasado'], ...COMPLETO],
    titular: 'Listo, está saldado',
    relevamiento: null,
    nota: null,
    sigue: '',
  },
  {
    nombre: 'listo y sin nada pedido: la entrega en curso, y lo que sigue es acordar el día',
    cambios: { fechas: fechas({ inicio: INICIO, listo: LISTO }) },
    etapa: 'listo',
    camino: SIN_ESTIMATIVO('entregado'),
    titular: TITULAR_LISTO,
    relevamiento: null,
    nota: null,
    sigue: SIGUE_LISTO['sin-pedido'],
  },
  {
    nombre: 'listo con un día propuesto: lo que sigue es que diga si le queda bien',
    cambios: { fechas: fechas({ inicio: INICIO, listo: LISTO }), entrega: conPropuesta(UN_DIA) },
    etapa: 'listo',
    camino: SIN_ESTIMATIVO('entregado'),
    titular: TITULAR_LISTO,
    relevamiento: null,
    nota: null,
    sigue: SIGUE_LISTO['un-dia'],
  },
  {
    nombre: 'listo con un día propuesto que ya pasó: es como si no hubiera nada pedido',
    cambios: {
      fechas: fechas({ inicio: INICIO, listo: LISTO }),
      entrega: conPropuesta({ ...UN_DIA, fecha: '2026-09-17' }),
    },
    etapa: 'listo',
    camino: SIN_ESTIMATIVO('entregado'),
    titular: TITULAR_LISTO,
    relevamiento: null,
    nota: null,
    sigue: SIGUE_LISTO['sin-pedido'],
  },
  {
    nombre: 'listo esperando sus días',
    cambios: { fechas: fechas({ inicio: INICIO, listo: LISTO }), entrega: conPropuesta(SUS_DIAS) },
    etapa: 'listo',
    camino: SIN_ESTIMATIVO('entregado'),
    titular: TITULAR_LISTO,
    relevamiento: null,
    nota: null,
    sigue: SIGUE_LISTO['sus-dias'],
  },
  {
    nombre: 'listo con sus días mandados: lo que sigue es que el taller confirme uno',
    cambios: {
      fechas: fechas({ inicio: INICIO, listo: LISTO }),
      entrega: conPropuesta(SUS_DIAS, SUS_DIAS_MANDADOS),
    },
    etapa: 'listo',
    camino: SIN_ESTIMATIVO('entregado'),
    titular: TITULAR_LISTO,
    relevamiento: null,
    nota: null,
    sigue: SIGUE_LISTO.mandados,
  },
  {
    nombre: 'listo, dijo que no puede el día propuesto y mandó los suyos',
    cambios: {
      fechas: fechas({ inicio: INICIO, listo: LISTO }),
      entrega: conPropuesta(UN_DIA, SUS_DIAS_MANDADOS),
    },
    etapa: 'listo',
    camino: SIN_ESTIMATIVO('entregado'),
    titular: TITULAR_LISTO,
    relevamiento: null,
    nota: null,
    sigue: SIGUE_LISTO.mandados,
  },
  {
    nombre: 'listo con la entrega comprometida: el titular es la buena noticia',
    cambios: {
      fechas: fechas({ inicio: INICIO, listo: LISTO }),
      entrega: { ...SIN_COORDINAR, comprometida: COMPROMETIDA },
    },
    etapa: 'listo',
    camino: SIN_ESTIMATIVO('entregado'),
    titular: { comprometida: COMPROMETIDA },
    relevamiento: null,
    nota: null,
    sigue: SIGUE_CON_LA_COMPROMETIDA,
  },
  {
    nombre:
      'en fabricación con la entrega ya comprometida: manda la comprometida, y el paso sigue en la fabricación',
    cambios: {
      fechas: fechas({ inicio: INICIO }),
      entrega: { ...SIN_COORDINAR, comprometida: COMPROMETIDA },
    },
    etapa: 'fabricacion',
    camino: SIN_ESTIMATIVO('fabricacion'),
    titular: { comprometida: COMPROMETIDA },
    relevamiento: null,
    nota: null,
    sigue: SIGUE_CON_LA_COMPROMETIDA,
  },
  {
    nombre: 'listo con una comprometida que ya pasó: no se muestra, y vuelve a lo de la etapa',
    cambios: {
      fechas: fechas({ inicio: INICIO, listo: LISTO }),
      entrega: { ...SIN_COORDINAR, comprometida: { fecha: '2026-09-17', franja: 'tarde' } },
    },
    etapa: 'listo',
    camino: SIN_ESTIMATIVO('entregado'),
    titular: TITULAR_LISTO,
    relevamiento: null,
    nota: null,
    sigue: SIGUE_LISTO['sin-pedido'],
  },
];

describe('qué ve el cliente en cada etapa del trabajo', () => {
  for (const caso of CASOS_POR_ETAPA) {
    it(caso.nombre, () => {
      const vista = vistaDelCliente(trabajo(caso.cambios), HOY);

      expect(vista.etapa).toBe(caso.etapa);
      expect(vista.hitos.map((hito) => [hito.id, hito.estado])).toEqual(caso.camino);
      expect(vista.titular).toEqual(caso.titular);
      if (caso.relevamiento === null) expect(vista.relevamiento).toBeNull();
      else expect(vista.relevamiento).toEqual(caso.relevamiento);
      expect(notaDelRelevamiento(vista, FORMATOS)?.estado ?? null).toBe(caso.nota);
      expect(vista.sigue).toBe(caso.sigue);
      expect(vista.sigue).not.toMatch(/\d/);
      expect(vista.etapa === 'antes-del-presupuesto' && vista.relevamientoPorHacer !== null).toBe(
        caso.conElBloqueDelRelevamiento ?? false,
      );
    });
  }

  it('un estimativo de antes de que se guardaran los cambios de etapa igual aparece, sin fecha', () => {
    const vista = vistaDelCliente(trabajo({ estado: 'presupuesto_estimativo', precio: null }), HOY);
    expect(vista.hitos[0]).toMatchObject({ id: 'estimativo', estado: 'pasado', fecha: null });
    expect(vista.eventos).toEqual([]);
  });

  it('el estimativo nunca lleva un importe: ni en el camino ni en lo que fue pasando', () => {
    const vista = vistaDelCliente(
      trabajo({
        estado: 'presupuesto_estimativo',
        precio: null,
        fechas: fechas({ estimativo: '2026-09-15' }),
      }),
      HOY,
    );
    const delEstimativo = vista.eventos.find((evento) => evento.id === 'estimativo');
    expect(delEstimativo).toMatchObject({ texto: TE_PASAMOS_EL_ESTIMATIVO, monto: null });
    expect(JSON.stringify(vista.hitos)).not.toMatch(/\$|\d{4,}(?!-)/);
  });
});

function antesDelPresupuesto(vista: VistaDelCliente): VistaAntesDelPresupuesto {
  if (vista.etapa !== 'antes-del-presupuesto') {
    throw new Error(`Se esperaba antes del presupuesto y es ${vista.etapa}.`);
  }
  return vista;
}

describe('el bloque del relevamiento técnico', () => {
  it('mientras falta ir a medir explica qué es y cuánto vale, y reemplaza a «lo próximo es ir a medir»', () => {
    const vista = antesDelPresupuesto(
      vistaDelCliente(
        trabajo({
          estado: 'presupuesto_estimativo',
          precio: null,
          fechas: fechas({ estimativo: '2026-09-15' }),
          valorDelRelevamiento: centavos(12_000_000),
        }),
        HOY,
      ),
    );

    expect(vista.relevamientoPorHacer).toEqual({
      titulo: RELEVAMIENTO_TECNICO,
      lineas: QUE_ES_EL_RELEVAMIENTO,
      valor: 12_000_000,
    });
    expect(RELEVAMIENTO_TECNICO).toBe('Relevamiento técnico');
    expect(QUE_ES_EL_RELEVAMIENTO).toEqual([
      'El siguiente paso es el relevamiento técnico en obra. Es una visita donde relevamos medidas exactas, revisamos instalaciones y definimos detalles constructivos para poder proyectar tu mueble al milímetro.',
      'A partir de ese relevamiento te entregamos el diseño 3D y el presupuesto final y definitivo.',
    ]);
    expect(vista.sigue).toBe('');
    expect(vista.sigue).not.toBe(SIGUE_FALTA_MEDIR.estimativo);
  });

  it('sin valor en Ajustes, explica qué es sin el precio', () => {
    const vista = antesDelPresupuesto(
      vistaDelCliente(trabajo({ estado: 'contacto', precio: null }), HOY),
    );
    expect(vista.relevamientoPorHacer).toMatchObject({ titulo: RELEVAMIENTO_TECNICO, valor: null });
    expect(vista.sigue).not.toBe(SIGUE_FALTA_MEDIR.presupuesto);
  });

  it('una vista de antes, sin la clave, se lee sin precio', () => {
    const { valorDelRelevamiento: _valor, ...deAntes } = trabajo({
      estado: 'relevamiento',
      precio: null,
    });
    const vista = antesDelPresupuesto(
      vistaDelCliente(deAntes as unknown as TrabajoDelCliente, HOY),
    );
    expect(vista.relevamientoPorHacer?.valor).toBeNull();
  });

  it('ya medido, o sin hacer falta medir, no aparece y vuelve «lo próximo»', () => {
    for (const cambios of [
      { estado: 'relevamiento', visita: { dia: '2026-09-16', hecha: true } },
      { estado: 'a_presupuestar', visita: { dia: null, hecha: false } },
    ] as const) {
      const vista = antesDelPresupuesto(
        vistaDelCliente(
          trabajo({ ...cambios, precio: null, valorDelRelevamiento: centavos(12_000_000) }),
          HOY,
        ),
      );
      expect(vista.relevamientoPorHacer).toBeNull();
      expect(vista.sigue).toBe(SIGUE.presupuesto);
    }
  });

  it('con el presupuesto mandado, con una visita nueva después de mandarlo o aprobado, no existe', () => {
    for (const cambios of [
      { estado: 'presupuesto_enviado', fechas: fechas({ presupuesto: '2026-09-14' }) },
      {
        estado: 'presupuesto_enviado',
        fechas: fechas({ presupuesto: '2026-09-14' }),
        visita: { dia: '2026-09-24', hecha: false },
      },
      { estado: 'en_curso', fechas: fechas({ aprobado: '2026-09-14' }) },
    ] as const) {
      const vista = vistaDelCliente(
        trabajo({ ...cambios, valorDelRelevamiento: centavos(12_000_000) }),
        HOY,
      );
      expect(vista.etapa).not.toBe('antes-del-presupuesto');
      expect('relevamientoPorHacer' in vista).toBe(false);
      expect(JSON.stringify(vista)).not.toContain(RELEVAMIENTO_TECNICO);
    }
  });
});

describe('el relevamiento', () => {
  it('mientras falta ir a medir, sin día acordado, queda pendiente y sin fecha', () => {
    const vista = vistaDelCliente(trabajo({ estado: 'relevamiento', precio: null }), HOY);
    expect(vista.relevamiento).toEqual({ estado: 'pendiente', fecha: null });
  });

  it('hecho sin día cargado queda hecho sin fecha, y no entra en lo que fue pasando', () => {
    const vista = vistaDelCliente(
      trabajo({ estado: 'a_presupuestar', precio: null, visita: { dia: null, hecha: true } }),
      HOY,
    );
    expect(vista.relevamiento).toEqual({ estado: 'hecho', fecha: null });
    expect(vista.eventos.map((evento) => evento.id)).not.toContain('relevamiento');
  });

  it('la visita de hoy, sin marcar, todavía no se da por hecha: dice que quedamos en ir hoy', () => {
    for (const estado of ['contacto', 'presupuesto_estimativo', 'a_presupuestar'] as const) {
      const vista = vistaDelCliente(
        trabajo({ estado, precio: null, visita: { dia: HOY, hecha: false } }),
        HOY,
      );
      expect(vista.relevamiento).toMatchObject({ estado: 'pendiente', fecha: HOY });
    }
  });

  it('marcada con «Ya fui a relevar», se tilda el mismo día', () => {
    const vista = vistaDelCliente(
      trabajo({ estado: 'a_presupuestar', precio: null, visita: { dia: HOY, hecha: true } }),
      HOY,
    );
    expect(vista.relevamiento).toMatchObject({ estado: 'hecho', fecha: HOY });
  });

  it('una visita agendada después de presupuestar vuelve a mostrar el pendiente con su día', () => {
    const vista = vistaDelCliente(
      trabajo({
        estado: 'presupuesto_enviado',
        fechas: fechas({ presupuesto: '2026-09-14' }),
        visita: { dia: '2026-09-24', hecha: false },
      }),
      HOY,
    );
    expect(vista.relevamiento).toMatchObject({ estado: 'pendiente', fecha: '2026-09-24' });
  });
});

describe('la nota del relevamiento', () => {
  const estimativo = fechas({ estimativo: '2026-09-15' });

  function notaDe(cambios: Partial<TrabajoDelCliente>) {
    return notaDelRelevamiento(
      vistaDelCliente(trabajo({ precio: null, ...cambios }), HOY),
      FORMATOS,
    );
  }

  it('con el estimativo y sin medir: el número puede cambiar, y dice el día que quedamos', () => {
    expect(
      notaDe({
        estado: 'presupuesto_estimativo',
        fechas: estimativo,
        visita: { dia: '2026-09-22', hecha: false },
      }),
    ).toEqual({
      hito: 'estimativo',
      estado: 'pendiente',
      ...NOTA_DEL_RELEVAMIENTO.pendiente,
      lineas: [...FALTA_MEDIR_DEL_ESTIMADO, 'Quedamos en ir el larga(2026-09-22).'],
      resumen: RESUMEN_FALTA_MEDIR,
    });
  });

  it('sin día acordado no promete ninguno', () => {
    expect(notaDe({ estado: 'presupuesto_estimativo', fechas: estimativo })?.lineas).toEqual([
      ...FALTA_MEDIR_DEL_ESTIMADO,
      SIN_FECHA_PARA_LA_VISITA,
    ]);
  });

  it('ya medido: dice cuándo fuimos y que con eso se cierra el presupuesto', () => {
    expect(
      notaDe({
        estado: 'a_presupuestar',
        fechas: estimativo,
        visita: { dia: '2026-09-16', hecha: true },
      }),
    ).toEqual({
      hito: 'presupuesto',
      estado: 'hecho',
      ...NOTA_DEL_RELEVAMIENTO.hecho,
      lineas: [`${FUIMOS_A_MEDIR} el larga(2026-09-16).`, CERRANDO_EL_PRESUPUESTO],
      resumen: 'Medido el corta(2026-09-16)',
    });
  });

  it('cuelga del paso del número que explica, aunque ese paso ya esté tildado', () => {
    const conElEstimativo = vistaDelCliente(
      trabajo({ estado: 'presupuesto_estimativo', precio: null, fechas: estimativo }),
      HOY,
    );
    expect(notaDelRelevamiento(conElEstimativo, FORMATOS)?.hito).toBe('estimativo');
    expect(conElEstimativo.hitos[0]).toMatchObject({ id: 'estimativo', estado: 'pasado' });

    const mandado = vistaDelCliente(
      trabajo({
        estado: 'presupuesto_enviado',
        precio: centavos(10_000_000),
        fechas: fechas({ presupuesto: '2026-09-17' }),
        visita: { dia: '2026-09-16', hecha: true },
      }),
      HOY,
    );
    expect(notaDelRelevamiento(mandado, FORMATOS)?.hito).toBe('presupuesto');
    expect(mandado.hitos[0]).toMatchObject({ id: 'presupuesto', estado: 'pasado' });
  });

  it('con el presupuesto ya mandado, no dice que lo está cerrando', () => {
    expect(
      notaDe({
        estado: 'presupuesto_enviado',
        precio: centavos(10_000_000),
        fechas: fechas({ presupuesto: '2026-09-17' }),
        visita: { dia: '2026-09-16', hecha: true },
      })?.lineas,
    ).toEqual([`${FUIMOS_A_MEDIR} el larga(2026-09-16).`, ARMAMOS_EL_PRESUPUESTO]);
  });

  it('hecho sin día cargado no inventa uno', () => {
    const nota = notaDe({ estado: 'a_presupuestar', visita: { dia: null, hecha: true } });
    expect(nota?.lineas[0]).toBe('Ya fuimos a medir.');
    expect(nota?.resumen).toBe('Ya fuimos a medir');
  });

  it('sin estimativo no hay número que pueda cambiar: mientras falta medir, no hay nota', () => {
    expect(
      notaDe({ estado: 'relevamiento', visita: { dia: '2026-09-22', hecha: false } }),
    ).toBeNull();
  });

  it('con el presupuesto ya mandado, una visita nueva no vuelve a decir que es un estimado', () => {
    expect(
      notaDe({
        estado: 'presupuesto_enviado',
        fechas: fechas({ estimativo: '2026-09-02', presupuesto: '2026-09-14' }),
        visita: { dia: '2026-09-24', hecha: false },
      }),
    ).toBeNull();
  });

  it('desde que se aprueba, desaparece: ya no condiciona nada', () => {
    expect(
      notaDe({
        estado: 'en_curso',
        fechas: fechas({ estimativo: '2026-09-02', presupuesto: '2026-09-10' }),
        visita: { dia: '2026-09-08', hecha: true },
      }),
    ).toBeNull();
  });

  it('nunca cuenta cuánto hace de algo', () => {
    const nota = notaDe({
      estado: 'presupuesto_estimativo',
      fechas: estimativo,
      visita: { dia: '2026-09-12', hecha: true },
    });
    expect(JSON.stringify(nota)).not.toMatch(HACE_TANTOS_DIAS);
  });
});

describe('lo que fue pasando, con el estimativo y el día que se fue a medir', () => {
  it('los suma a la línea de tiempo, del más nuevo al más viejo', () => {
    const vista = vistaDelCliente(
      trabajo({
        estado: 'presupuesto_enviado',
        fechas: fechas({ estimativo: '2026-09-02', presupuesto: '2026-09-14' }),
        visita: { dia: '2026-09-10', hecha: true },
      }),
      HOY,
    );
    expect(vista.eventos.map((evento) => [evento.texto, evento.fecha, evento.monto])).toEqual([
      ['Te pasamos el presupuesto', '2026-09-14', null],
      [FUIMOS_A_MEDIR, '2026-09-10', null],
      [TE_PASAMOS_EL_ESTIMATIVO, '2026-09-02', null],
    ]);
  });

  it('el mismo día, ir a medir va antes que el presupuesto y después del estimativo', () => {
    const vista = vistaDelCliente(
      trabajo({
        estado: 'presupuesto_enviado',
        fechas: fechas({ estimativo: '2026-09-10', presupuesto: '2026-09-10' }),
        visita: { dia: '2026-09-10', hecha: true },
      }),
      HOY,
    );
    expect(vista.eventos.map((evento) => evento.id)).toEqual([
      'presupuesto',
      'relevamiento',
      'estimativo',
    ]);
  });
});

const DIRECCION_CARGADA = 'Belgrano 455, Haedo';
const INICIO_CARGADO = '2026-08-14';
const ENTREGA_CARGADA = '2026-10-10';

function conTodoCargado(estado: TrabajoDelCliente['estado']): TrabajoDelCliente {
  return trabajo({
    estado,
    precio: estado === 'presupuesto_enviado' ? centavos(PRESUPUESTO) : null,
    direccion: DIRECCION_CARGADA,
    fechas: fechas({ inicio: INICIO_CARGADO, entregaPautada: ENTREGA_CARGADA }),
    pagos: [pago('relevamiento', '2026-08-13', RELEVAMIENTO, 'Relevamiento Tecnico')],
  });
}

const ETAPAS_SIN_APROBAR = [
  'contacto',
  'presupuesto_estimativo',
  'relevamiento',
  'a_presupuestar',
  'presupuesto_enviado',
] as const;

describe('un trabajo sin aprobar, con dirección, inicio, entrega y un pago cargados', () => {
  for (const estado of ETAPAS_SIN_APROBAR) {
    it(`${estado}: no devuelve ni la dirección, ni el inicio, ni la entrega`, () => {
      const vista = JSON.stringify(vistaDelCliente(conTodoCargado(estado), HOY));
      expect(vista).not.toContain(DIRECCION_CARGADA);
      expect(vista).not.toContain(INICIO_CARGADO);
      expect(vista).not.toContain(ENTREGA_CARGADA);
    });

    it(`${estado}: el pago es un pago, no la seña ni la aprobación, y no empezó a fabricarse`, () => {
      const vista = vistaDelCliente(conTodoCargado(estado), HOY);
      const textos = vista.eventos.map((evento) => evento.texto);
      expect(textos).not.toContain('Recibimos tu seña y quedó aprobado');
      expect(textos).not.toContain('Empezamos a fabricarlo en el taller');
      expect(vista.eventos).toContainEqual(
        expect.objectContaining({
          id: 'relevamiento',
          fecha: '2026-08-13',
          texto: 'Recibimos tu pago',
          monto: 12_000_000,
        }),
      );
    });

    it(`${estado}: no es una variante aprobada, así que no tiene los datos de la tarjeta`, () => {
      const vista = vistaDelCliente(conTodoCargado(estado), HOY);
      expect(estaAprobada(vista)).toBe(false);
      expect('datos' in vista).toBe(false);
    });
  }

  it('con el presupuesto mandado, el pago del relevamiento es el único hecho de lo que fue pasando', () => {
    const vista = vistaDelCliente(conTodoCargado('presupuesto_enviado'), HOY);
    expect(vista.eventos).toEqual([
      {
        id: 'relevamiento',
        fecha: '2026-08-13',
        texto: RECIBIMOS_TU_PAGO,
        hito: 'presupuesto',
        monto: RELEVAMIENTO,
      },
    ]);
  });

  it('aprobado, lo mismo cargado ya es cierto: la tarjeta tiene la dirección, el inicio y la entrega', () => {
    const vista = aprobada(vistaDelCliente(conTodoCargado('en_curso'), HOY));
    expect(vista.datos).toMatchObject({
      direccion: DIRECCION_CARGADA,
      inicio: INICIO_CARGADO,
      entrega: { situacion: 'estimada', fecha: ENTREGA_CARGADA },
    });
  });
});

describe('la tarjeta de datos, desde la aprobación', () => {
  it('sin dirección cargada, la dirección es null: la pantalla dice que falta confirmarla', () => {
    const vista = aprobada(vistaDelCliente(trabajo({ direccion: '   ' }), HOY));
    expect(vista.datos.direccion).toBeNull();
    expect(vista.datos.inicio).toBeNull();
    expect(vista.datos.entrega).toEqual({ situacion: 'estimada', fecha: null });
  });

  it('entregado, la entrega es la del día que se entregó', () => {
    const vista = aprobada(
      vistaDelCliente(
        trabajo({
          estado: 'entregado',
          fechas: fechas({ entregaPautada: '2026-09-20', entregado: '2026-09-16' }),
        }),
        HOY,
      ),
    );
    expect(vista.datos.entrega).toEqual({ situacion: 'entregado', fecha: '2026-09-16' });
  });

  it('en curso, un día de entrega cargado de más no la da por entregada: sigue la estimada', () => {
    const vista = aprobada(
      vistaDelCliente(
        trabajo({ fechas: fechas({ entregaPautada: '2026-09-20', entregado: '2026-09-16' }) }),
        HOY,
      ),
    );
    expect(vista.datos.entrega).toEqual({ situacion: 'estimada', fecha: '2026-09-20' });
  });
});

describe('la seña: un porcentaje del presupuesto aprobado, no un pago', () => {
  function esperando(cambios: Partial<TrabajoDelCliente>): VistaEsperandoLaSena {
    return esperandoLaSena(
      vistaDelCliente(
        trabajo({
          estado: 'presupuesto_enviado',
          precio: centavos(PRESUPUESTO),
          sena: centavos(SENA),
          pago: PIDE_LA_SENA,
          pagos: [pago('relevamiento', '2026-08-13', RELEVAMIENTO, 'Relevamiento Tecnico')],
          ...cambios,
        }),
        HOY,
      ),
    );
  }

  it('esperando la seña: la seña para arrancar, lo que pagó a cuenta y lo que le queda', () => {
    const vista = esperando({});
    expect(vista.presupuesto).toBe(PRESUPUESTO);
    expect(vista.sena).toEqual({
      situacion: 'falta',
      sena: SENA,
      aCuenta: RELEVAMIENTO,
      falta: FALTA_DE_LA_SENA,
    });
  });

  it('lo que le queda de la seña es exactamente lo que le pide «Cómo pagar»: sale del mismo pago', () => {
    const vista = esperando({});
    expect(vista.sena.situacion).toBe('falta');
    if (vista.sena.situacion !== 'falta') return;
    expect(vista.comoPagar?.monto).toBe(vista.sena.falta);
    expect(vista.comoPagar?.etiquetaDelImporte).toBe('Ahora, la seña');
    expect(vista.sena.sena - vista.sena.aCuenta).toBe(vista.sena.falta);
  });

  it('el relevamiento queda a cuenta: la seña no crece por lo que ya pagó, lo que falta baja', () => {
    const sinPagar = esperando({
      pagos: [],
      pago: { ...PIDE_LA_SENA, monto: centavos(SENA) },
    });
    const conElRelevamiento = esperando({});
    expect(sinPagar.sena).toMatchObject({ sena: SENA, aCuenta: 0, falta: SENA });
    expect(conElRelevamiento.sena).toMatchObject({
      sena: SENA,
      aCuenta: RELEVAMIENTO,
      falta: SENA - RELEVAMIENTO,
    });
  });

  it('si lo que pagó ya cubre la seña, lo dice en vez de pedirle nada', () => {
    const vista = esperando({
      pagos: [pago('grande', '2026-08-13', 70_000_000)],
      pago: { instancia: null, formas: [], monto: null, siguiente: null },
    });
    expect(vista.sena).toEqual({ situacion: 'cubierta', sena: SENA, aCuenta: 70_000_000 });
    expect(vista.comoPagar).toBeNull();
  });

  it('sin presupuesto elegido todavía no hay seña que calcular', () => {
    const vista = esperando({ precio: null, sena: null });
    expect(vista.sena).toEqual({ situacion: 'sin-presupuesto' });
  });

  it('un trabajo sin aprobar no tiene seña acordada, tenga los pagos que tenga', () => {
    for (const estado of ETAPAS_SIN_APROBAR) {
      const vista = vistaDelCliente(
        trabajo({
          estado,
          pagos: [
            pago('uno', '2026-08-13', RELEVAMIENTO, 'Seña'),
            pago('dos', '2026-08-20', RELEVAMIENTO),
          ],
        }),
        HOY,
      );
      expect('datos' in vista).toBe(false);
      expect(vista.eventos.every((evento) => evento.texto === RECIBIMOS_TU_PAGO)).toBe(true);
    }
  });

  it('al aprobar, lo pagado antes queda a cuenta y nada se cuenta dos veces', () => {
    const vista = aprobada(
      vistaDelCliente(
        trabajo({
          estado: 'en_curso',
          precio: centavos(PRESUPUESTO),
          sena: centavos(SENA),
          pago: PIDE_EL_SALDO,
          fechas: fechas({ aprobado: '2026-09-20' }),
          pagos: [
            pago('relevamiento', '2026-08-13', RELEVAMIENTO, 'Relevamiento Tecnico'),
            pago('sena', '2026-09-20', FALTA_DE_LA_SENA, 'Seña'),
          ],
        }),
        HOY,
      ),
    );
    expect(vista.pagado).toBe(SENA);
    expect(vista.saldo).toBe(PRESUPUESTO - SENA);
    expect(vista.datos.sena).toEqual({ situacion: 'cubierta', sena: SENA, aCuenta: SENA });
    expect(vista.comoPagar?.monto).toBe(vista.saldo);
  });
});

describe('la proyección: hasta cuándo señar y para cuándo podría estar', () => {
  it('con la fecha límite cargada: señar antes de esa fecha, y listo a 21 días hábiles de ella', () => {
    expect(proyeccionDeLaEntrega('2026-10-02', HOY)).toEqual({
      situacion: 'vigente',
      senarAntesDe: '2026-10-02',
      listoPara: '2026-11-02',
    });
  });

  it('la segunda fecha es la misma cuenta que la entrega estimada, contada desde la fecha límite y no desde hoy', () => {
    let dia = '2026-01-01';
    for (let i = 0; i < 400; i += 1) {
      const proyeccion = proyeccionDeLaEntrega(dia, '2026-01-01');
      expect(proyeccion).toEqual({
        situacion: 'vigente',
        senarAntesDe: dia,
        listoPara: entregaEstimada(dia),
      });
      expect(entregaEstimada(dia)).toBe(sumarDiasHabiles(dia, DIAS_HABILES_DE_ENTREGA));
      dia = sumarDias(dia, 1);
    }
  });

  it('el último día todavía vale', () => {
    expect(proyeccionDeLaEntrega(HOY, HOY).situacion).toBe('vigente');
  });

  it('con la fecha límite ya pasada no se recalcula ni se sigue prometiendo: venció', () => {
    expect(proyeccionDeLaEntrega('2026-09-17', HOY)).toEqual({
      situacion: 'vencida',
      vencio: '2026-09-17',
    });
  });

  it('sin fecha límite no hay promesa', () => {
    expect(proyeccionDeLaEntrega(null, HOY)).toEqual({ situacion: 'sin-fecha' });
  });

  it('los textos son los que pidió el dueño: el «podríamos» es suyo y se queda', () => {
    expect(
      textoDeLaProyeccion(proyeccionDeLaEntrega('2026-10-02', HOY), FORMATOS, 'falta'),
    ).toEqual([
      'Si dejás la seña antes del frase(2026-10-02), podríamos tenerlo listo para el frase(2026-11-02).',
      'Vamos tomando los trabajos a medida que entran las señas.',
    ]);
    expect(VAMOS_TOMANDO_LOS_TRABAJOS).toBe(
      'Vamos tomando los trabajos a medida que entran las señas.',
    );
    expect(textoDeLaProyeccion({ situacion: 'sin-fecha' }, FORMATOS, 'falta')).toEqual([
      'Cuando lo apruebes y dejes la seña, coordinamos la fecha de entrega.',
    ]);
    expect(COORDINAMOS_LA_ENTREGA).toBe(
      'Cuando lo apruebes y dejes la seña, coordinamos la fecha de entrega.',
    );
    expect(
      textoDeLaProyeccion(proyeccionDeLaEntrega('2026-09-17', HOY), FORMATOS, 'falta'),
    ).toEqual([
      'Este presupuesto venció el frase(2026-09-17). Hablá con el taller para actualizarlo.',
    ]);
  });

  it('con la seña ya cubierta no se la vuelve a pedir: lo que falta es aprobarlo', () => {
    expect(
      textoDeLaProyeccion(proyeccionDeLaEntrega('2026-10-02', HOY), FORMATOS, 'cubierta'),
    ).toEqual([
      'Si lo aprobás antes del frase(2026-10-02), podríamos tenerlo listo para el frase(2026-11-02).',
      VAMOS_TOMANDO_LOS_TRABAJOS,
    ]);
    expect(textoDeLaProyeccion({ situacion: 'sin-fecha' }, FORMATOS, 'cubierta')).toEqual([
      COORDINAMOS_LA_ENTREGA_AL_APROBAR,
    ]);
    expect(COORDINAMOS_LA_ENTREGA_AL_APROBAR).toBe(
      'Cuando lo apruebes, coordinamos la fecha de entrega.',
    );
    expect(textoDeLaProyeccion({ situacion: 'sin-fecha' }, FORMATOS, 'sin-presupuesto')).toEqual([
      COORDINAMOS_LA_ENTREGA,
    ]);
  });

  it('ningún texto de la proyección dice «arreglar» ni cuenta días', () => {
    for (const valeHasta of [null, '2026-09-17', '2026-10-02']) {
      for (const sena of ['falta', 'cubierta', 'sin-presupuesto'] as const) {
        const texto = textoDeLaProyeccion(
          proyeccionDeLaEntrega(valeHasta, HOY),
          FORMATOS,
          sena,
        ).join(' ');
        expect(texto).not.toMatch(/arregl/i);
        expect(texto).not.toMatch(HACE_TANTOS_DIAS);
      }
    }
  });

  it('la vista la trae solo esperando la seña, calculada con la fecha que mandó la base', () => {
    const vista = esperandoLaSena(
      vistaDelCliente(
        trabajo({ estado: 'presupuesto_enviado', fechas: fechas({ valeHasta: '2026-10-02' }) }),
        HOY,
      ),
    );
    expect(vista.proyeccion).toEqual(proyeccionDeLaEntrega('2026-10-02', HOY));
    for (const estado of ['a_presupuestar', 'en_curso'] as const) {
      const otra = vistaDelCliente(
        trabajo({ estado, fechas: fechas({ valeHasta: '2026-10-02' }) }),
        HOY,
      );
      expect('proyeccion' in otra).toBe(false);
    }
  });
});

describe('lo que marcó en verde queda idéntico', () => {
  it('con el presupuesto mandado, lo próximo es que lo apruebe y deje la seña, palabra por palabra', () => {
    expect(SIGUE_CON_EL_PRESUPUESTO_MANDADO).toBe('Lo próximo es que lo apruebes y dejes la seña.');
    const vista = vistaDelCliente(conTodoCargado('presupuesto_enviado'), HOY);
    expect(vista.sigue).toBe('Lo próximo es que lo apruebes y dejes la seña.');
  });

  it('y el pago del relevamiento llega con su nombre, tal como lo escribió el taller', () => {
    const vista = vistaDelCliente(conTodoCargado('presupuesto_enviado'), HOY);
    expect(vista.pagos).toEqual([
      {
        id: 'relevamiento',
        fecha: '2026-08-13',
        concepto: 'Relevamiento Tecnico',
        monto: 12_000_000,
      },
    ]);
  });
});

describe('hasta dónde llegó el trabajo', () => {
  it('compara por el paso, no por la posición: el estimativo no corre a los demás', () => {
    const conEstimativo = vistaDelCliente(
      trabajo({ estado: 'en_curso', fechas: fechas({ estimativo: '2026-08-01' }) }),
      HOY,
    );
    expect(llegoAl(conEstimativo, 'aprobado')).toBe(true);
    expect(llegoAl(conEstimativo, 'fabricacion')).toBe(false);

    const enElEstimativo = vistaDelCliente(
      trabajo({ estado: 'presupuesto_estimativo', precio: null }),
      HOY,
    );
    expect(llegoAl(enElEstimativo, 'estimativo')).toBe(true);
    expect(llegoAl(enElEstimativo, 'presupuesto')).toBe(false);
  });

  it('tuvo estimativo el que está en esa etapa o el que pasó por ella', () => {
    expect(tuvoEstimativo(trabajo({ estado: 'presupuesto_estimativo' }))).toBe(true);
    expect(tuvoEstimativo(trabajo({ fechas: fechas({ estimativo: '2026-08-01' }) }))).toBe(true);
    expect(tuvoEstimativo(trabajo({ estado: 'a_presupuestar' }))).toBe(false);
  });
});

describe('el mueble listo y la entrega que se coordina', () => {
  const LISTO_SIN_NADA = trabajo({ fechas: fechas({ inicio: INICIO, listo: LISTO }) });

  function listo(entrega: EntregaQueSeCoordina): VistaAprobada {
    return aprobada(
      vistaDelCliente(trabajo({ fechas: fechas({ inicio: INICIO, listo: LISTO }), entrega }), HOY),
    );
  }

  it('listo, la fabricación queda tildada con su día y la entrega en curso, sin fecha', () => {
    const vista = aprobada(vistaDelCliente(LISTO_SIN_NADA, HOY));
    expect(vista.hitos[2]).toMatchObject({ id: 'fabricacion', estado: 'pasado', fecha: INICIO });
    expect(vista.hitos[3]).toMatchObject({
      id: 'entregado',
      estado: 'actual',
      fecha: null,
      texto: LISTO_PARA_ENTREGAR,
    });
    expect(vista.hitoActual).toBe('fabricacion');
    expect(llegoAl(vista, 'fabricacion')).toBe(true);
    expect(llegoAl(vista, 'entregado')).toBe(false);
  });

  it('con la entrega comprometida, el paso en curso lleva el día acordado: es un acuerdo registrado', () => {
    const vista = listo({ ...SIN_COORDINAR, comprometida: COMPROMETIDA });
    expect(vista.hitos[3]).toMatchObject({
      estado: 'actual',
      fecha: COMPROMETIDA.fecha,
      texto: LO_LLEVAMOS_Y_LO_INSTALAMOS,
    });
    expect(vista.coordinacion).toBeNull();
  });

  it('en fabricación, aunque esté comprometida, la entrega es un paso que viene: sin fecha', () => {
    const vista = aprobada(
      vistaDelCliente(
        trabajo({
          fechas: fechas({ inicio: INICIO }),
          entrega: { ...SIN_COORDINAR, comprometida: COMPROMETIDA },
        }),
        HOY,
      ),
    );
    expect(vista.hitos[3]).toMatchObject({ estado: 'futuro', fecha: null });
    expect(vista.datos.entrega).toEqual({
      situacion: 'confirmada',
      fecha: COMPROMETIDA.fecha,
      franja: 'manana',
    });
  });

  it('una comprometida que ya pasó no se muestra en ningún lado', () => {
    const vista = listo({ ...SIN_COORDINAR, comprometida: { fecha: '2026-09-16', franja: null } });
    expect(vista.titular).toBe(TITULAR_LISTO);
    expect(vista.hitos[3]).toMatchObject({ fecha: null, texto: LISTO_PARA_ENTREGAR });
    expect(vista.datos.entrega).toEqual({ situacion: 'a-confirmar' });
    expect(JSON.stringify(vista)).not.toContain('2026-09-16');
  });

  it('la tarjeta dice la estimada mientras se fabrica, y ninguna fecha si ya pasó', () => {
    const conEstimada = (entregaPautada: string) =>
      aprobada(
        vistaDelCliente(trabajo({ fechas: fechas({ inicio: INICIO, entregaPautada }) }), HOY),
      ).datos.entrega;
    expect(conEstimada('2026-10-02')).toEqual({ situacion: 'estimada', fecha: '2026-10-02' });
    expect(conEstimada(HOY)).toEqual({ situacion: 'estimada', fecha: HOY });
    expect(conEstimada('2026-09-17')).toEqual({ situacion: 'estimada', fecha: null });
  });

  it('listo y sin comprometida, la tarjeta no compite con el día que se le propone: a coordinar', () => {
    const vista = listo(conPropuesta(UN_DIA));
    expect(vista.datos.entrega).toEqual({ situacion: 'a-coordinar' });
  });

  it('entregado sin fecha registrada, la tarjeta igual dice que se entregó', () => {
    const vista = aprobada(vistaDelCliente(trabajo({ estado: 'entregado' }), HOY));
    expect(vista.datos.entrega).toEqual({ situacion: 'entregado', fecha: null });
  });

  it('lo que hay para coordinar sale de la propuesta vigente y de lo último que contestó', () => {
    expect(listo(SIN_COORDINAR).coordinacion).toEqual({ situacion: 'sin-pedido' });
    expect(listo(conPropuesta(UN_DIA)).coordinacion).toEqual({
      situacion: 'un-dia',
      propuesta: UN_DIA,
      respuesta: null,
    });
    expect(listo(conPropuesta(SUS_DIAS, SUS_DIAS_MANDADOS)).coordinacion).toEqual({
      situacion: 'sus-dias',
      propuesta: SUS_DIAS,
      respuesta: SUS_DIAS_MANDADOS,
    });
    expect(listo(conPropuesta({ ...UN_DIA, fecha: null })).coordinacion).toEqual({
      situacion: 'sin-pedido',
    });
    expect(
      aprobada(vistaDelCliente(trabajo({ fechas: fechas({ inicio: INICIO }) }), HOY)).coordinacion,
    ).toBeNull();
  });

  it('en lo que fue pasando, «Terminamos tu mueble» con el día en que quedó listo', () => {
    const vista = vistaDelCliente(
      trabajo({ fechas: fechas({ inicio: LISTO, listo: LISTO }) }),
      HOY,
    );
    expect(vista.eventos.map((evento) => [evento.texto, evento.fecha])).toEqual([
      [TERMINAMOS_TU_MUEBLE, LISTO],
      [EMPEZAMOS_A_FABRICARLO, LISTO],
    ]);
  });

  it('un inicio cargado después del día en que quedó listo no se cuenta como el arranque', () => {
    const vista = vistaDelCliente(trabajo({ fechas: fechas({ inicio: HOY, listo: LISTO }) }), HOY);
    expect(vista.eventos.map((evento) => evento.texto)).toEqual([TERMINAMOS_TU_MUEBLE]);
  });

  it('no le cuenta cuánto hace que está listo', () => {
    const vista = listo(conPropuesta(SUS_DIAS, SUS_DIAS_MANDADOS));
    expect(JSON.stringify(vista)).not.toMatch(HACE_TANTOS_DIAS);
  });

  it('una vista guardada por la versión anterior, sin el listo ni la entrega, se lee como que no hubo', () => {
    const { entrega: _entrega, ...viejo } = trabajo({ fechas: fechas({ inicio: INICIO }) });
    const { listo: _listo, ...fechasViejas } = viejo.fechas;
    const comoLoGuardoLaVersionVieja = {
      ...viejo,
      fechas: fechasViejas,
    } as unknown as TrabajoDelCliente;
    const vista = aprobada(vistaDelCliente(comoLoGuardoLaVersionVieja, HOY));
    expect(vista.etapa).toBe('fabricacion');
    expect(vista.coordinacion).toBeNull();
    expect(vista.titular).toBe('Lo estamos fabricando');
  });
});

const TOTAL_DEL_PRESUPUESTO = 218_100_000;
const SENA_DEL_PRESUPUESTO = 109_050_000;
const VALE_HASTA = '2026-09-25';

const OPCION_A = {
  id: '0199a1b2-0000-7000-8000-00000000000a',
  descripcion: 'Frentes en melamina Blanco (Egger).',
  monto: centavos(218_100_000),
};

const OPCION_B = {
  id: '0199a1b2-0000-7000-8000-00000000000b',
  descripcion: 'Frentes laqueados blanco mate.',
  monto: centavos(274_000_000),
};

const BORRADOR_DEL_PRESUPUESTO: BorradorDelPresupuesto = {
  forma: 1,
  titulo: 'Cocina',
  obra: 'Arenales 1840, Palermo',
  descripcion: '',
  muebles: [{ id: 'm1', nombre: 'Bajomesada en L', descripcion: 'Bajomesada en L 2.07 x 1.83.' }],
  herrajes: { mostrar: true, lista: [] },
  aTenerEnCuenta: { tildadas: [], propias: [] },
  incluye: tildadasPorDefecto(PLANTILLA_DE_SIEMPRE.incluye),
  formaDePago: { plantillaId: 'sena-y-entrega', texto: null },
  plazoDeFabricacion: 35,
  validezDias: 15,
  avisos: tildadasPorDefecto(PLANTILLA_DE_SIEMPRE.avisos),
  condiciones: tildadasPorDefecto(PLANTILLA_DE_SIEMPRE.condiciones),
  clausulaDeLaMoneda: null,
  modificacion: null,
  monedaDeLoAbonado: null,
};

function documentoMandado(conOpciones: boolean): DocumentoDelPresupuesto {
  return documentoDelPresupuesto(
    {
      borrador: BORRADOR_DEL_PRESUPUESTO,
      plantilla: PLANTILLA_DE_SIEMPRE,
      taller: {
        nombre: 'Taller MAUN',
        titular: 'Julián Ferro',
        cuit: '20-12345678-6',
        condicionFiscal: 'monotributo',
        domicilio: 'Pasaje Los Robles 450, CABA',
        telefono: '11 4000-1234',
        email: '',
      },
      cliente: 'Paula Benítez',
      moneda: 'ARS',
      cobraEn: null,
      valores: valoresDelTrabajo(
        centavos(TOTAL_DEL_PRESUPUESTO),
        conOpciones ? [OPCION_B, OPCION_A] : [],
      ),
      senaBp: puntosBasicos(5_000),
      abonado: centavos(RELEVAMIENTO),
    },
    {
      plata: (importe) => `$${String(importe / 100)}`,
      porcentaje: (puntos) => String(puntos / 100),
      modificaciones: (cantidad) => `${String(cantidad)} modificaciones`,
      meses: (cantidad) => `${String(cantidad)} meses`,
    },
  );
}

function mandado(
  cambios: Partial<TrabajoDelCliente> = {},
  revision = 2,
  conOpciones = false,
): TrabajoDelCliente {
  return trabajo({
    estado: 'presupuesto_enviado',
    precio: conOpciones ? null : centavos(TOTAL_DEL_PRESUPUESTO),
    sena: conOpciones ? null : centavos(SENA_DEL_PRESUPUESTO),
    pago: {
      instancia: 'sena',
      formas: ['transferencia', 'efectivo'],
      monto: conOpciones ? null : centavos(SENA_DEL_PRESUPUESTO - RELEVAMIENTO - 8_000_000),
      siguiente: null,
    },
    cobro: { alias: 'taller.prueba', cbu: null, titular: null, cuit: null, link: null },
    fechas: fechas({ presupuesto: '2026-08-26', valeHasta: VALE_HASTA }),
    pagos: [
      pago('relevamiento', '2026-08-19', RELEVAMIENTO, 'Relevamiento técnico'),
      pago('otro', '2026-09-01', 8_000_000),
    ],
    presupuesto: {
      numero: '20260826-01',
      revision,
      mandadoEl: '2026-09-02',
      queCambio: 'Pasamos la alacena a Gris Grafito.',
      documento: documentoMandado(conOpciones),
      idioma: 'es',
      aceptadoEl: null,
      letra: null,
    },
    ...cambios,
  });
}

describe('el presupuesto en la página del cliente', () => {
  it('esperando la seña trae la última revisión, con su número y las cuentas con los pagos de hoy', () => {
    const vista = esperandoLaSena(vistaDelCliente(mandado(), HOY));
    expect(vista.elPresupuesto).toMatchObject({
      etapa: 'mandado',
      numero: '20260826-01',
      revision: 2,
      idioma: 'es',
      mandadoEl: '2026-09-02',
      queCambio: 'Pasamos la alacena a Gris Grafito.',
      valeHasta: VALE_HASTA,
      vencio: null,
      pideLaSena: true,
    });
    expect(vista.elPresupuesto?.documento.abonado).toBe(RELEVAMIENTO);
    expect(vista.elPresupuesto?.cuentas).toEqual([
      {
        id: null,
        letra: null,
        descripcion: '',
        total: TOTAL_DEL_PRESUPUESTO,
        sena: SENA_DEL_PRESUPUESTO,
        pagado: RELEVAMIENTO + 8_000_000,
        faltaParaLaSena: SENA_DEL_PRESUPUESTO - RELEVAMIENTO - 8_000_000,
        saldo: TOTAL_DEL_PRESUPUESTO - SENA_DEL_PRESUPUESTO,
      },
    ]);
    expect(vista.opciones).toBe(0);
  });

  it('la primera revisión no dice qué cambió', () => {
    const vista = esperandoLaSena(vistaDelCliente(mandado({}, 1), HOY));
    expect(vista.elPresupuesto).toMatchObject({ revision: 1, queCambio: null });
  });

  it('el presupuesto va en el idioma de su revisión, aunque los clientes ya lean en otro', () => {
    const base = mandado();
    const enIngles = mandado({
      idioma: 'pt-BR',
      presupuesto: { ...(base.presupuesto as PresupuestoDelTrabajo), idioma: 'en' },
    });
    expect(esperandoLaSena(vistaDelCliente(enIngles, HOY)).elPresupuesto?.idioma).toBe('en');
    const deAntes = mandado({
      presupuesto: { ...(base.presupuesto as PresupuestoDelTrabajo), idioma: 'fr' as Idioma },
    });
    expect(esperandoLaSena(vistaDelCliente(deAntes, HOY)).elPresupuesto?.idioma).toBe('es');
  });

  it('con la seña ya cubierta no la pide', () => {
    const cubierta = mandado({
      pagos: [pago('todo', '2026-09-01', SENA_DEL_PRESUPUESTO)],
      pago: { instancia: 'saldo', formas: ['efectivo'], monto: null, siguiente: null },
    });
    expect(esperandoLaSena(vistaDelCliente(cubierta, HOY)).elPresupuesto?.pideLaSena).toBe(false);
  });

  it('con opciones, «Tu mueble» cuenta las opciones y el presupuesto las trae a todas', () => {
    const vista = esperandoLaSena(vistaDelCliente(mandado({}, 1, true), HOY));
    expect(vista.opciones).toBe(2);
    expect(vista.elPresupuesto?.cuentas.map(({ letra, total }) => [letra, total])).toEqual([
      ['A', OPCION_A.monto],
      ['B', OPCION_B.monto],
    ]);
    expect(vista.elPresupuesto?.pideLaSena).toBe(false);
  });

  it('«Para cuándo» cuenta con el plazo de la última revisión, no con los 21 días hábiles', () => {
    const vista = esperandoLaSena(vistaDelCliente(mandado(), HOY));
    expect(vista.proyeccion).toEqual({
      situacion: 'vigente',
      senarAntesDe: VALE_HASTA,
      listoPara: sumarDiasHabiles(VALE_HASTA, 35),
    });
  });

  it('sin presupuesto armado en la app, «Para cuándo» sigue con los 21 días hábiles', () => {
    const vista = esperandoLaSena(vistaDelCliente(mandado({ presupuesto: null }), HOY));
    expect(vista.proyeccion).toMatchObject({
      listoPara: sumarDiasHabiles(VALE_HASTA, DIAS_HABILES_DE_ENTREGA),
    });
    expect(vista.elPresupuesto).toBeNull();
  });

  it('vencido: la sección lo marca, «Cómo pagar» deja de pedir la seña y lo próximo es escribirle al taller', () => {
    const vencio = '2026-09-26';
    const vista = esperandoLaSena(vistaDelCliente(mandado(), vencio));
    expect(vista.elPresupuesto).toMatchObject({ vencio: VALE_HASTA, pideLaSena: false });
    expect(vista.comoPagar).toMatchObject({
      instancia: 'sena',
      monto: null,
      montoParaPegar: null,
      transferencia: false,
      efectivo: false,
      link: null,
      siguiente: null,
      vencio: VALE_HASTA,
    });
    expect(vista.proyeccion).toEqual({ situacion: 'vencida', vencio: VALE_HASTA });
    expect(vista.sigue).toBe('Lo próximo es que le escribas al taller para actualizarlo.');
  });

  it('vencido, lo próximo ya no es dejar la seña: es escribirle al taller', () => {
    const vista = vistaDelCliente(mandado({ presupuesto: null }), '2026-09-26');
    expect(vista.sigue).toBe('Lo próximo es que le escribas al taller para actualizarlo.');
  });

  it('vencido sin presupuesto armado en la app, «Cómo pagar» tampoco pide la seña', () => {
    const vista = esperandoLaSena(vistaDelCliente(mandado({ presupuesto: null }), '2026-09-26'));
    expect(vista.comoPagar?.monto).toBeNull();
    expect(vista.comoPagar?.vencio).toBe(VALE_HASTA);
  });

  it('el día mismo del vencimiento todavía vale', () => {
    const vista = esperandoLaSena(vistaDelCliente(mandado(), VALE_HASTA));
    expect(vista.comoPagar?.vencio).toBeNull();
    expect(vista.elPresupuesto?.vencio).toBeNull();
  });

  it('aprobado, una fecha de vigencia que ya pasó no le saca la seña a «Cómo pagar»', () => {
    const vista = vistaDelCliente(mandado({ estado: 'en_curso' }), '2026-09-26');
    expect(vista.comoPagar?.vencio).toBeNull();
    expect(vista.comoPagar?.monto).not.toBeNull();
  });

  it('aprobado, trae la revisión con la opción aceptada, el día y la letra', () => {
    const aceptado = mandado(
      {
        estado: 'en_curso',
        precio: OPCION_A.monto,
        presupuesto: {
          numero: '20260826-01',
          revision: 2,
          mandadoEl: '2026-09-02',
          queCambio: null,
          documento: soloLaAceptada(documentoMandado(true), OPCION_A.id),
          idioma: 'es',
          aceptadoEl: '2026-09-04',
          letra: 'A',
        },
      },
      2,
      true,
    );
    const vista = aprobada(vistaDelCliente(aceptado, HOY));
    expect(vista.elPresupuesto).toMatchObject({
      etapa: 'aceptado',
      aceptadoEl: '2026-09-04',
      letra: 'A',
      acordado: null,
      numero: '20260826-01',
      revision: 2,
      idioma: 'es',
    });
    expect(vista.elPresupuesto?.cuentas).toHaveLength(1);
  });

  it('si se aprobó otro importe que el de lo mandado, dice lo acordado al aprobar', () => {
    const aceptado = mandado({ estado: 'en_curso', precio: centavos(200_000_000) });
    const vista = aprobada(vistaDelCliente(aceptado, HOY));
    expect(vista.elPresupuesto?.acordado).toBe(200_000_000);
  });

  it('una opción aprobada que no estaba en lo mandado: sin cuentas y con lo acordado', () => {
    const documento = soloLaAceptada(documentoMandado(true), 'otra-opcion');
    const aceptado = mandado({
      estado: 'en_curso',
      precio: centavos(250_000_000),
      presupuesto: {
        numero: '20260826-01',
        revision: 2,
        mandadoEl: '2026-09-02',
        queCambio: null,
        documento,
        idioma: 'es',
        aceptadoEl: '2026-09-04',
        letra: null,
      },
    });
    const vista = aprobada(vistaDelCliente(aceptado, HOY));
    expect(vista.elPresupuesto?.cuentas).toEqual([]);
    expect(vista.elPresupuesto?.acordado).toBe(250_000_000);
  });

  it('una vista de antes, sin la fecha de vigencia, no da el presupuesto por vencido', () => {
    const { valeHasta: _valeHasta, ...fechasViejas } = fechas({ presupuesto: '2026-08-26' });
    const viejo = { ...mandado(), fechas: fechasViejas } as unknown as TrabajoDelCliente;
    const vista = esperandoLaSena(vistaDelCliente(viejo, HOY));
    expect(vista.elPresupuesto).toMatchObject({ valeHasta: null, vencio: null, pideLaSena: true });
  });

  it('antes del presupuesto no hay sección', () => {
    const vista = vistaDelCliente(mandado({ estado: 'a_presupuestar' }), HOY);
    expect(vista.etapa).toBe('antes-del-presupuesto');
    expect('elPresupuesto' in vista).toBe(false);
  });

  it('una vista sin la clave del presupuesto se lee como sin presupuesto', () => {
    const { presupuesto: _presupuesto, ...viejo } = mandado();
    const vista = esperandoLaSena(vistaDelCliente(viejo, HOY));
    expect(vista.elPresupuesto).toBeNull();
    expect(vista.opciones).toBe(0);
    const aprobado = aprobada(vistaDelCliente({ ...viejo, estado: 'en_curso' }, HOY));
    expect(aprobado.elPresupuesto).toBeNull();
  });
});

const DOLAR_DE_HOY: ReferenciaEnPesos = { cotizacion: cotizacion(145_000), fecha: HOY };

const DOLAR_DE_AYER: ReferenciaEnPesos = { cotizacion: cotizacion(144_000), fecha: '2026-09-17' };

const REFERENCIA_DEL_PRESUPUESTO: ReferenciaEnPesos = {
  cotizacion: cotizacion(140_000),
  fecha: '2026-09-14',
};

const CUENTA_EN_PESOS: CobroDelTaller = {
  alias: 'maun.muebles',
  cbu: '0110001312345678901233',
  titular: 'Ana Gutiérrez',
  cuit: '27-30123456-4',
  link: 'https://mpago.la/2vXyZ1',
};

const CUENTA_EN_DOLARES: CuentaParaTransferir = {
  alias: 'maun.dolares',
  cbu: '0110001322345678901234',
  titular: 'Ana Gutiérrez',
  cuit: '27-30123456-4',
};

const LA_VISITA_EN_PESOS: PagoDelCliente = {
  id: 'visita',
  fecha: '2026-09-10',
  concepto: 'Relevamiento',
  monto: centavosEn('USD', 8_276),
  pagado: { moneda: 'ARS', monto: centavos(12_000_000), cotizacion: cotizacion(145_000) },
};

const LA_SENA_EN_DOLARES: PagoDelCliente = {
  id: 'sena',
  fecha: '2026-09-15',
  concepto: 'Seña',
  monto: centavosEn('USD', 91_724),
  pagado: { moneda: 'USD', monto: centavosEn('USD', 91_724), cotizacion: cotizacion(145_000) },
};

function formasPara(
  recibe: readonly Moneda[] | null,
  formas: readonly FormaDeCobro[],
): Pick<PagoPendiente, 'formas' | 'formasEnDolares'> {
  const monedas = recibe ?? ['ARS'];
  return {
    formas: monedas.includes('ARS') ? formas : [],
    formasEnDolares: monedas.includes('USD') ? formas : [],
  };
}

function enDolares(
  recibe: readonly Moneda[] | null,
  cambios: Partial<TrabajoDelCliente> = {},
): TrabajoDelCliente {
  return trabajo({
    estado: 'presupuesto_enviado',
    moneda: 'USD',
    cobraEn: recibe,
    precio: centavosEn('USD', 200_000),
    sena: centavosEn('USD', 100_000),
    dolarDelDia: DOLAR_DE_HOY,
    fechas: fechas({ presupuesto: '2026-09-14' }),
    cobro: CUENTA_EN_PESOS,
    cobroEnDolares: CUENTA_EN_DOLARES,
    pagos: [LA_VISITA_EN_PESOS],
    pago: {
      instancia: 'sena',
      ...formasPara(recibe, ['transferencia', 'efectivo']),
      monto: centavosEn('USD', 91_724),
      siguiente: {
        instancia: 'saldo',
        ...formasPara(recibe, ['efectivo']),
        monto: centavosEn('USD', 100_000),
      },
    },
    ...cambios,
  });
}

function enPesos(
  recibe: readonly Moneda[] | null,
  cambios: Partial<TrabajoDelCliente> = {},
): TrabajoDelCliente {
  return trabajo({
    moneda: 'ARS',
    cobraEn: recibe,
    sena: centavos(62_000_000),
    cobro: CUENTA_EN_PESOS,
    cobroEnDolares: CUENTA_EN_DOLARES,
    pagos: [pago('p1', '2026-08-04', 40_000_000)],
    pago: {
      instancia: 'sena',
      ...formasPara(recibe, ['transferencia', 'efectivo']),
      monto: centavos(22_000_000),
      siguiente: {
        instancia: 'saldo',
        ...formasPara(recibe, ['efectivo']),
        monto: centavos(62_000_000),
      },
    },
    ...cambios,
  });
}

const TALLER_DEL_DOCUMENTO = {
  nombre: 'Taller MAUN',
  titular: 'Julián Ferro',
  cuit: '20-12345678-6',
  condicionFiscal: 'monotributo',
  domicilio: 'Pasaje Los Robles 450, CABA',
  telefono: '11 4000-1234',
  email: '',
} as const;

const FORMATOS_DEL_DOCUMENTO = {
  plata: (importe: number) => `$${String(importe / 100)}`,
  porcentaje: (puntos: number) => String(puntos / 100),
  modificaciones: (cantidad: number) => `${String(cantidad)} modificaciones`,
  meses: (cantidad: number) => `${String(cantidad)} meses`,
};

function documentoEnDolares(): DocumentoDelPresupuesto {
  const entrada: EntradaDelDocumento = {
    borrador: BORRADOR_DEL_PRESUPUESTO,
    plantilla: PLANTILLA_DE_SIEMPRE,
    taller: TALLER_DEL_DOCUMENTO,
    cliente: 'Paula Benítez',
    moneda: 'USD',
    cobraEn: ['ARS'],
    valores: valoresDelTrabajo(centavosEn('USD', 200_000), []),
    senaBp: puntosBasicos(5_000),
    abonado: centavosEn('USD', 8_276),
    referencia: REFERENCIA_DEL_PRESUPUESTO,
  };
  return documentoDelPresupuesto(entrada, FORMATOS_DEL_DOCUMENTO);
}

function conElPresupuesto(documento: DocumentoDelPresupuesto): PresupuestoDelTrabajo {
  return {
    numero: '20260914-01',
    revision: 1,
    mandadoEl: '2026-09-14',
    queCambio: null,
    documento,
    idioma: 'es',
    aceptadoEl: null,
    letra: null,
  };
}

describe('un trabajo en dólares, o que se paga en dólares', () => {
  it('pesos en pesos, con las claves nuevas, se ve igual que hoy', () => {
    const deHoy = trabajo({
      cobro: CUENTA_EN_PESOS,
      sena: centavos(62_000_000),
      pagos: [pago('p1', '2026-08-04', 40_000_000)],
      pago: PIDE_LA_SENA,
    });
    const conLasClaves: TrabajoDelCliente = {
      ...deHoy,
      moneda: 'ARS',
      cobraEn: ['ARS'],
      dolarDelDia: DOLAR_DE_HOY,
      cobroEnDolares: CUENTA_EN_DOLARES,
      pago: { ...PIDE_LA_SENA, formasEnDolares: [] },
    };

    expect(vistaDelCliente(conLasClaves, HOY)).toEqual(vistaDelCliente(deHoy, HOY));
    expect(comoPagar(conLasClaves, HOY)).toMatchObject({
      moneda: 'ARS',
      monto: FALTA_DE_LA_SENA,
      montoParaPegar: '504000',
      transferencia: true,
      mercadoPago: true,
      enLaOtraMoneda: null,
    });
    expect(aprobada(vistaDelCliente(conLasClaves, HOY))).toMatchObject({
      moneda: 'ARS',
      precioEnPesos: null,
    });
  });

  it('dólares en pesos, con el dólar del día de hoy: la seña en dólares, y lo que son hoy en pesos para pegar', () => {
    const vista = esperandoLaSena(vistaDelCliente(enDolares(['ARS']), HOY));

    expect(vista.moneda).toBe('USD');
    expect(vista.pagado).toBe(8_276);
    expect(vista.sena).toEqual({
      situacion: 'falta',
      sena: 100_000,
      aCuenta: 8_276,
      falta: 91_724,
    });
    expect(vista.comoPagar).toMatchObject({
      moneda: 'USD',
      monto: 91_724,
      montoParaPegar: null,
      transferencia: false,
      efectivo: false,
      faltanLosDatos: false,
    });
    expect(vista.comoPagar?.enLaOtraMoneda).toEqual({
      moneda: 'ARS',
      transferencia: true,
      cuenta: {
        alias: 'maun.muebles',
        cbu: '0110001312345678901233',
        titular: 'Ana Gutiérrez',
        cuit: '27-30123456-4',
      },
      link: 'https://mpago.la/2vXyZ1',
      mercadoPago: true,
      efectivo: true,
      faltanLosDatos: false,
      enEfectivo: TEXTOS.comoPagar.tambienEfectivo.sena,
      importe: {
        situacion: 'convertido',
        monto: 132_999_800,
        montoParaPegar: '1329998',
        cotizacion: 145_000,
      },
    });
  });

  it('dólares en pesos, con el dólar del día de ayer: el importe en dólares, y los pesos los pasa el taller', () => {
    const como = comoPagar(enDolares(['ARS'], { dolarDelDia: DOLAR_DE_AYER }), HOY);
    expect(como?.monto).toBe(91_724);
    expect(como?.montoParaPegar).toBeNull();
    expect(como?.enLaOtraMoneda?.importe).toEqual({ situacion: 'te-lo-pasa-el-taller' });
  });

  it('dólares en pesos, sin dólar del día: tampoco inventa una cotización', () => {
    const como = comoPagar(enDolares(['ARS'], { dolarDelDia: null }), HOY);
    expect(como?.enLaOtraMoneda?.importe).toEqual({ situacion: 'te-lo-pasa-el-taller' });
    const { dolarDelDia: _dolar, ...deAntes } = enDolares(['ARS']);
    expect(comoPagar(deAntes, HOY)?.enLaOtraMoneda?.importe).toEqual({
      situacion: 'te-lo-pasa-el-taller',
    });
  });

  it('dólares en dólares: el importe para pegar en dólares, a la cuenta en dólares y sin Mercado Pago', () => {
    const como = comoPagar(enDolares(['USD']), HOY);
    expect(como).toMatchObject({
      moneda: 'USD',
      monto: 91_724,
      montoParaPegar: '917,24',
      transferencia: true,
      cuenta: CUENTA_EN_DOLARES,
      link: null,
      mercadoPago: false,
      efectivo: true,
      faltanLosDatos: false,
      enEfectivo: TEXTOS.comoPagar.tambienEfectivo.sena,
      enLaOtraMoneda: null,
    });
  });

  it('dólares en pesos o dólares: el bloque en dólares primero, y el de pesos con los de hoy', () => {
    const como = comoPagar(enDolares(['ARS', 'USD']), HOY);
    expect(como).toMatchObject({
      moneda: 'USD',
      montoParaPegar: '917,24',
      transferencia: true,
      cuenta: CUENTA_EN_DOLARES,
      mercadoPago: false,
    });
    expect(como?.enLaOtraMoneda).toMatchObject({
      moneda: 'ARS',
      transferencia: true,
      link: 'https://mpago.la/2vXyZ1',
      mercadoPago: true,
      importe: { situacion: 'convertido', monto: 132_999_800, montoParaPegar: '1329998' },
    });
  });

  it('pesos en dólares: ningún importe en dólares, se acuerda con el taller el día que paga', () => {
    const como = comoPagar(enPesos(['USD']), HOY);
    expect(como).toMatchObject({
      moneda: 'ARS',
      monto: 22_000_000,
      montoParaPegar: null,
      transferencia: false,
      efectivo: false,
      faltanLosDatos: false,
      mercadoPago: false,
      link: null,
    });
    expect(como?.enLaOtraMoneda).toEqual({
      moneda: 'USD',
      transferencia: true,
      cuenta: CUENTA_EN_DOLARES,
      link: null,
      mercadoPago: false,
      efectivo: true,
      faltanLosDatos: false,
      enEfectivo: TEXTOS.comoPagar.tambienEfectivo.sena,
      importe: { situacion: 'lo-acordas-con-el-taller' },
    });
  });

  it('pesos en pesos o dólares: el bloque de pesos de siempre, y el de dólares sin importe', () => {
    const como = comoPagar(enPesos(['ARS', 'USD']), HOY);
    expect(como).toMatchObject({
      moneda: 'ARS',
      montoParaPegar: '220000',
      transferencia: true,
      link: 'https://mpago.la/2vXyZ1',
      mercadoPago: true,
    });
    expect(como?.enLaOtraMoneda).toMatchObject({
      moneda: 'USD',
      importe: { situacion: 'lo-acordas-con-el-taller' },
    });
  });

  it('sin cuenta en dólares, pedir la transferencia en dólares dice que faltan los datos', () => {
    const { cobroEnDolares: _cuenta, ...sinCuenta } = enDolares(['USD']);
    const como = comoPagar(sinCuenta, HOY);
    expect(como).toMatchObject({
      transferencia: false,
      faltanLosDatos: true,
      efectivo: true,
      cuenta: { alias: null, cbu: null, titular: null, cuit: null },
      enEfectivo: TEXTOS.comoPagar.soloEfectivo.sena,
    });
  });

  it('una respuesta sin las formas en dólares no ofrece nada en dólares', () => {
    const viejo = enDolares(['USD'], {
      pago: { instancia: 'sena', formas: [], monto: centavosEn('USD', 91_724), siguiente: null },
    });
    const como = comoPagar(viejo, HOY);
    expect(como).toMatchObject({ transferencia: false, efectivo: false, faltanLosDatos: false });
    expect(hayComoPagar(como)).toBe(false);
  });

  it('sin el importe todavía, los pesos de hoy no se calculan', () => {
    const como = comoPagar(
      enDolares(['ARS'], {
        pago: { instancia: 'sena', formas: ['efectivo'], monto: null, siguiente: null },
      }),
      HOY,
    );
    expect(como?.monto).toBeNull();
    expect(como?.enLaOtraMoneda?.importe).toEqual({ situacion: 'te-lo-pasa-el-taller' });
  });

  it('el pago que sigue nombra las formas de las dos monedas', () => {
    const como = comoPagar(
      enDolares(['ARS', 'USD'], {
        pago: {
          instancia: 'sena',
          formas: ['transferencia'],
          formasEnDolares: ['efectivo'],
          monto: centavosEn('USD', 91_724),
          siguiente: {
            instancia: 'saldo',
            formas: ['transferencia'],
            formasEnDolares: ['efectivo'],
            monto: centavosEn('USD', 100_000),
          },
        },
      }),
      HOY,
    );
    expect(como?.siguiente).toEqual({
      instancia: 'saldo',
      monto: 100_000,
      nombre: 'el saldo',
      comoSePaga: 'por transferencia o en efectivo',
    });
  });

  it('vencido, en dólares tampoco pide nada', () => {
    const como = comoPagar(
      enDolares(['ARS', 'USD'], {
        fechas: fechas({ presupuesto: '2026-09-01', valeHasta: '2026-09-17' }),
      }),
      HOY,
    );
    expect(como).toMatchObject({
      moneda: 'USD',
      monto: null,
      montoParaPegar: null,
      transferencia: false,
      efectivo: false,
      vencio: '2026-09-17',
      enLaOtraMoneda: null,
    });
  });

  it('hay cómo pagar si alguna de las dos monedas tiene una forma concreta', () => {
    expect(hayComoPagar(null)).toBe(false);
    expect(hayComoPagar(comoPagar(enPesos(null), HOY))).toBe(true);
    expect(hayComoPagar(comoPagar(enDolares(['USD']), HOY))).toBe(true);

    const soloEfectivo = enPesos(null);
    expect(
      hayComoPagar(
        comoPagar({ ...soloEfectivo, pago: { ...soloEfectivo.pago, formas: ['efectivo'] } }, HOY),
      ),
    ).toBe(true);

    const enDolaresPorTransferencia = enPesos(['USD']);
    expect(
      hayComoPagar(
        comoPagar(
          {
            ...enDolaresPorTransferencia,
            pago: { ...enDolaresPorTransferencia.pago, formasEnDolares: ['transferencia'] },
          },
          HOY,
        ),
      ),
    ).toBe(true);

    const enDolaresEnEfectivo = enPesos(['USD']);
    expect(
      hayComoPagar(
        comoPagar(
          {
            ...enDolaresEnEfectivo,
            pago: { ...enDolaresEnEfectivo.pago, formasEnDolares: ['efectivo'] },
          },
          HOY,
        ),
      ),
    ).toBe(true);

    const { cobroEnDolares: _cuenta, ...sinCuenta } = enPesos(['USD']);
    const pidiendoLosDatos = comoPagar(
      { ...sinCuenta, pago: { ...sinCuenta.pago, formasEnDolares: ['transferencia'] } },
      HOY,
    );
    expect(hayComoPagar(pidiendoLosDatos)).toBe(false);
    const otra = pidiendoLosDatos?.enLaOtraMoneda ?? null;
    expect(otra === null ? null : seOfrece(otra)).toBe(true);
  });

  it('se ofrece una moneda con transferencia, con efectivo o pidiendo los datos', () => {
    const como = comoPagar(enPesos(null), HOY);
    if (como === null) throw new Error('Se esperaba cómo pagar.');
    expect(seOfrece(como)).toBe(true);
    expect(seOfrece({ ...como, transferencia: false })).toBe(true);
    expect(seOfrece({ ...como, transferencia: false, efectivo: false })).toBe(false);
    expect(seOfrece({ ...como, transferencia: false, efectivo: false, faltanLosDatos: true })).toBe(
      true,
    );
  });

  it('lo pagado y el saldo de un trabajo en dólares suman lo que descontó cada pago, en dólares', () => {
    const vista = aprobada(
      vistaDelCliente(
        enDolares(['ARS', 'USD'], {
          estado: 'en_curso',
          fechas: fechas({ presupuesto: '2026-09-14', aprobado: '2026-09-15' }),
          pagos: [LA_VISITA_EN_PESOS, LA_SENA_EN_DOLARES],
        }),
        HOY,
      ),
    );
    expect(vista.moneda).toBe('USD');
    expect(vista.pagado).toBe(100_000);
    expect(vista.saldo).toBe(100_000);
    expect(vista.pagos).toEqual([LA_VISITA_EN_PESOS, LA_SENA_EN_DOLARES]);
    expect(vista.eventos.filter(({ monto }) => monto !== null).map(({ monto }) => monto)).toEqual([
      91_724, 8_276,
    ]);
  });

  it('de cada pago en la otra moneda, cuánto se pagó y a qué dólar', () => {
    expect(loQueSePagoEnOtraMoneda(LA_VISITA_EN_PESOS, 'USD')).toEqual({
      pagado: { importe: 12_000_000, moneda: 'ARS' },
      cotizacion: 145_000,
    });
    expect(
      loQueSePagoEnOtraMoneda(
        {
          id: 'dolares',
          fecha: '2026-09-15',
          concepto: 'Saldo',
          monto: centavos(154_000_000),
          pagado: {
            moneda: 'USD',
            monto: centavosEn('USD', 100_000),
            cotizacion: cotizacion(154_000),
          },
        },
        'ARS',
      ),
    ).toEqual({ pagado: { importe: 100_000, moneda: 'USD' }, cotizacion: 154_000 });
  });

  it('un pago en la moneda del trabajo, o sin su dólar, no dice nada más', () => {
    expect(loQueSePagoEnOtraMoneda(LA_SENA_EN_DOLARES, 'USD')).toBeNull();
    expect(loQueSePagoEnOtraMoneda(pago('p1', '2026-08-04', 40_000_000), 'ARS')).toBeNull();
    expect(
      loQueSePagoEnOtraMoneda(
        {
          ...LA_VISITA_EN_PESOS,
          pagado: { moneda: 'ARS', monto: centavos(12_000_000), cotizacion: null },
        },
        'USD',
      ),
    ).toBeNull();
  });
});

describe('el precio de un trabajo en dólares, con su referencia en pesos', () => {
  it('con el dólar del día de hoy, los pesos de hoy', () => {
    expect(esperandoLaSena(vistaDelCliente(enDolares(['ARS']), HOY)).precioEnPesos).toEqual({
      pesos: 290_000_000,
      cotizacion: 145_000,
      fecha: HOY,
      deHoy: true,
    });
  });

  it('con el de ayer y el presupuesto mandado en dólares, la referencia del presupuesto con su fecha', () => {
    const vista = esperandoLaSena(
      vistaDelCliente(
        enDolares(['ARS'], {
          dolarDelDia: DOLAR_DE_AYER,
          presupuesto: conElPresupuesto(documentoEnDolares()),
        }),
        HOY,
      ),
    );
    expect(vista.precioEnPesos).toEqual({
      pesos: 280_000_000,
      cotizacion: 140_000,
      fecha: '2026-09-14',
      deHoy: false,
    });
  });

  it('el dólar del día de hoy le gana a la referencia del presupuesto', () => {
    const vista = esperandoLaSena(
      vistaDelCliente(
        enDolares(['ARS'], { presupuesto: conElPresupuesto(documentoEnDolares()) }),
        HOY,
      ),
    );
    expect(vista.precioEnPesos).toMatchObject({ cotizacion: 145_000, deHoy: true });
  });

  it('sin presupuesto mandado, el último dólar del día cargado, con su fecha', () => {
    const vista = esperandoLaSena(
      vistaDelCliente(enDolares(['ARS'], { dolarDelDia: DOLAR_DE_AYER }), HOY),
    );
    expect(vista.precioEnPesos).toEqual({
      pesos: 288_000_000,
      cotizacion: 144_000,
      fecha: '2026-09-17',
      deHoy: false,
    });
  });

  it('un presupuesto en pesos no le da referencia a un trabajo que pasó a dólares', () => {
    const vista = esperandoLaSena(
      vistaDelCliente(
        enDolares(['ARS'], {
          dolarDelDia: DOLAR_DE_AYER,
          presupuesto: conElPresupuesto(documentoMandado(false)),
        }),
        HOY,
      ),
    );
    expect(vista.precioEnPesos).toMatchObject({ cotizacion: 144_000, fecha: '2026-09-17' });
  });

  it('sin ningún dólar cargado no hay pesos: nunca un importe en pesos sin su cotización', () => {
    expect(
      esperandoLaSena(vistaDelCliente(enDolares(['ARS'], { dolarDelDia: null }), HOY))
        .precioEnPesos,
    ).toBeNull();
  });

  it('aprobado, el precio también va con su referencia', () => {
    const vista = aprobada(vistaDelCliente(enDolares(['ARS'], { estado: 'en_curso' }), HOY));
    expect(vista.precio).toBe(200_000);
    expect(vista.precioEnPesos).toMatchObject({ pesos: 290_000_000, deHoy: true });
  });

  it('sin precio, o en pesos, no hay referencia', () => {
    expect(
      aprobada(vistaDelCliente(enDolares(['ARS'], { estado: 'en_curso', precio: null }), HOY))
        .precioEnPesos,
    ).toBeNull();
    expect(aprobada(vistaDelCliente(enPesos(null), HOY)).precioEnPesos).toBeNull();
  });
});

describe('el presupuesto mandado en otra moneda que la del trabajo', () => {
  it('en la misma moneda, sus cuentas descuentan lo pagado en dólares', () => {
    const vista = esperandoLaSena(
      vistaDelCliente(
        enDolares(['ARS'], { presupuesto: conElPresupuesto(documentoEnDolares()) }),
        HOY,
      ),
    );
    expect(vista.elPresupuesto?.cuentas).toEqual([
      {
        id: null,
        letra: null,
        descripcion: '',
        total: 200_000,
        sena: 100_000,
        pagado: 8_276,
        faltaParaLaSena: 91_724,
        saldo: 100_000,
      },
    ]);
  });

  it('en otra moneda, sus cuentas no mezclan lo pagado con sus importes', () => {
    const vista = esperandoLaSena(
      vistaDelCliente(
        enDolares(['ARS'], { presupuesto: conElPresupuesto(documentoMandado(false)) }),
        HOY,
      ),
    );
    expect(vista.elPresupuesto?.cuentas.map(({ pagado }) => pagado)).toEqual([0]);
  });

  it('aprobado, lo acordado se dice solo en la moneda del presupuesto', () => {
    const enOtra = aprobada(
      vistaDelCliente(
        enDolares(['ARS'], {
          estado: 'en_curso',
          precio: centavosEn('USD', 150_000),
          presupuesto: conElPresupuesto(documentoMandado(false)),
        }),
        HOY,
      ),
    );
    expect(enOtra.elPresupuesto?.acordado).toBeNull();

    const enLaMisma = aprobada(
      vistaDelCliente(
        enDolares(['ARS'], {
          estado: 'en_curso',
          precio: centavosEn('USD', 150_000),
          presupuesto: conElPresupuesto(documentoEnDolares()),
        }),
        HOY,
      ),
    );
    expect(enLaMisma.elPresupuesto?.acordado).toBe(150_000);
  });
});
