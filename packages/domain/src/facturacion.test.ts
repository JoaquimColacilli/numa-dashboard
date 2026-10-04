import { describe, expect, it } from 'vitest';

import { PREFIJOS_DE_EMPRESA, PREFIJOS_DE_PERSONA, verificadorDeCuit } from './cuit.ts';
import {
  AMBIENTES_DE_ARCA,
  claseDelRechazo,
  CODIGO_DE_ARCA,
  CONCEPTO_POR_DEFECTO,
  conceptoLeido,
  CONDICIONES_DEL_RECEPTOR,
  condicionIvaDelReceptor,
  cuitValido,
  datosDelQr,
  detalleDeLaFactura,
  documentoDelReceptor,
  domicilioDelReceptor,
  ENLACE_DEL_QR,
  enlaceDelQr,
  esAmbienteDeArca,
  esCondicionDelReceptor,
  esEstadoDelComprobante,
  ESTADOS_DEL_COMPROBANTE,
  ESTADOS_VIVOS,
  estadoDelTope,
  esTipoDeComprobante,
  esUnaFacturaViva,
  facturadoEnLosUltimos12Meses,
  fechaDeArca,
  fechaParaArca,
  importeParaArca,
  LARGO_MAXIMO_DEL_DETALLE,
  LO_QUE_FALTA_PARA_FACTURAR,
  loQueFaltaParaFacturar,
  NOMBRE_DE_LA_CONDICION_DEL_RECEPTOR,
  nombreDelArchivoDeLaFactura,
  nombreDelComprobante,
  nombreDelReceptor,
  numeroConCeros,
  numeroDelComprobante,
  operacionDelTrabajo,
  proximaRecategorizacion,
  puntoDeVentaConCeros,
  revisarDni,
  TIPOS_DE_COMPROBANTE,
  UMBRAL_DE_IDENTIFICACION_CENTAVOS,
  type ComprobanteParaElQr,
  type ComprobanteQueSuma,
  type DatosParaFacturar,
} from './facturacion.ts';
import { centavos, type Money } from './money.ts';
import { ESCALAS_DEL_MONOTRIBUTO, type EscalaDelMonotributo } from './monotributo.ts';

const CUIT_DEL_TALLER = '20-30123456-3';
const CUIT_DE_EMPRESA = '30-71234567-1';
const CUIT_DE_PRUEBA = '20-11111111-2';

function laEscala(): EscalaDelMonotributo {
  const [escala] = ESCALAS_DEL_MONOTRIBUTO;
  if (escala === undefined) throw new Error('No hay escala del monotributo.');
  return escala;
}

const ESCALA = laEscala();

function conVerificador(diez: string): string {
  const digito = verificadorDeCuit(diez);
  if (digito === null) throw new Error(`${diez} cae en el caso ambiguo`);
  return `${diez.slice(0, 2)}-${diez.slice(2)}-${String(digito)}`;
}

function conOtroVerificador(cuit: string): string {
  const ultimo = Number(cuit.slice(-1));
  return `${cuit.slice(0, -1)}${String((ultimo + 1) % 10)}`;
}

function textoDeBase64(base64: string): string {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let bits = '';
  for (const letra of base64.replace(/=+$/, '')) {
    bits += alfabeto.indexOf(letra).toString(2).padStart(6, '0');
  }
  let texto = '';
  for (let indice = 0; indice + 8 <= bits.length; indice += 8) {
    texto += String.fromCharCode(parseInt(bits.slice(indice, indice + 8), 2));
  }
  return texto;
}

function datosCompletos(): DatosParaFacturar {
  return {
    taller: {
      condicion: 'monotributo',
      razonSocial: 'RIVAS MARTIN',
      domicilio: 'Pasaje Los Robles 450, Morón',
      ingresosBrutos: '20-30123456-3',
      inicioDeActividades: '2019-03-01',
    },
    trabajo: { moneda: 'ARS', borrado: false, precio: centavos(90_000_000), cobrado: centavos(0) },
    pago: { moneda: 'ARS', borrado: false, yaEnLaApertura: false },
    cliente: {
      condicion: 'consumidor_final',
      cuit: '',
      dni: '',
      domicilioFiscal: '',
      direccion: '',
    },
  };
}

function comprobante(parcial: Partial<ComprobanteQueSuma>): ComprobanteQueSuma {
  return {
    tipo: 'factura_c',
    ambiente: 'produccion',
    estado: 'autorizada',
    fecha: '2026-10-01',
    importe: centavos(100_000),
    ...parcial,
  };
}

const PARA_EL_QR: ComprobanteParaElQr = {
  tipo: 'factura_c',
  cuitEmisor: CUIT_DEL_TALLER,
  puntoDeVenta: 3,
  numero: 42,
  fecha: '2026-10-03',
  importe: centavos(45_000_000),
  docTipo: 99,
  docNro: '0',
  cae: '76398765432109',
};

describe('los tipos y los códigos de ARCA', () => {
  it('la Factura C es el 11 y la Nota de Crédito C, el 13', () => {
    expect(CODIGO_DE_ARCA).toEqual({ factura_c: 11, nota_de_credito_c: 13 });
  });

  it('reconoce los valores de cada lista y nada más', () => {
    for (const tipo of TIPOS_DE_COMPROBANTE) expect(esTipoDeComprobante(tipo)).toBe(true);
    for (const ambiente of AMBIENTES_DE_ARCA) expect(esAmbienteDeArca(ambiente)).toBe(true);
    for (const estado of ESTADOS_DEL_COMPROBANTE) expect(esEstadoDelComprobante(estado)).toBe(true);
    for (const condicion of CONDICIONES_DEL_RECEPTOR) {
      expect(esCondicionDelReceptor(condicion)).toBe(true);
    }
    for (const otro of ['factura_b', 'testing', 'emitida', 'no_inscripto', 11, null]) {
      expect(esTipoDeComprobante(otro)).toBe(false);
      expect(esAmbienteDeArca(otro)).toBe(false);
      expect(esEstadoDelComprobante(otro)).toBe(false);
      expect(esCondicionDelReceptor(otro)).toBe(false);
    }
  });

  it('el concepto se lee como 1, 2 o 3, y productos si no se entiende', () => {
    expect(conceptoLeido(1)).toBe(1);
    expect(conceptoLeido(2)).toBe(2);
    expect(conceptoLeido(3)).toBe(3);
    expect(CONCEPTO_POR_DEFECTO).toBe(1);
    for (const raro of [0, 4, '2', null, undefined]) expect(conceptoLeido(raro)).toBe(1);
  });

  it('una factura viva es la pedida, la que se está emitiendo, la autorizada y la que hay que revisar', () => {
    expect(ESTADOS_VIVOS).toEqual(['pedida', 'emitiendo', 'autorizada', 'a_revisar']);
    expect(ESTADOS_DEL_COMPROBANTE.filter(esUnaFacturaViva)).toEqual(ESTADOS_VIVOS);
    expect(esUnaFacturaViva('anulada')).toBe(false);
    expect(esUnaFacturaViva('rechazada')).toBe(false);
  });
});

describe('condicionIvaDelReceptor', () => {
  it('manda el código de ARCA de cada condición, siempre', () => {
    expect(condicionIvaDelReceptor('consumidor_final')).toBe(5);
    expect(condicionIvaDelReceptor('monotributo')).toBe(6);
    expect(condicionIvaDelReceptor('responsable_inscripto')).toBe(1);
    expect(condicionIvaDelReceptor('exento')).toBe(4);
  });

  it('el nombre de cada condición para el PDF', () => {
    expect(NOMBRE_DE_LA_CONDICION_DEL_RECEPTOR).toEqual({
      consumidor_final: 'Consumidor Final',
      monotributo: 'Responsable Monotributo',
      responsable_inscripto: 'IVA Responsable Inscripto',
      exento: 'IVA Exento',
    });
  });
});

describe('cuitValido', () => {
  it('acepta cada prefijo válido con su verificador', () => {
    for (const prefijo of [...PREFIJOS_DE_PERSONA, ...PREFIJOS_DE_EMPRESA]) {
      const cuit = conVerificador(`${String(prefijo)}12345678`);
      expect(cuitValido(cuit)).toBe(true);
      expect(cuitValido(cuit.replaceAll('-', ''))).toBe(true);
    }
    expect(cuitValido(CUIT_DE_PRUEBA)).toBe(true);
  });

  it('frena el verificador mal, el largo, el prefijo, el vacío y el caso ambiguo', () => {
    for (const prefijo of [...PREFIJOS_DE_PERSONA, ...PREFIJOS_DE_EMPRESA]) {
      const cuit = conVerificador(`${String(prefijo)}12345678`);
      expect(cuitValido(conOtroVerificador(cuit))).toBe(false);
    }
    expect(cuitValido('20-1234567-8')).toBe(false);
    expect(cuitValido('21-12345678-4')).toBe(false);
    expect(cuitValido('')).toBe(false);
    expect(cuitValido('20-00000001-9')).toBe(false);
  });
});

describe('revisarDni', () => {
  it('saca los puntos y los espacios y acepta 7 u 8 dígitos', () => {
    expect(revisarDni('28.456.789')).toEqual({ estado: 'valido', dni: '28456789' });
    expect(revisarDni(' 28 456 789 ')).toEqual({ estado: 'valido', dni: '28456789' });
    expect(revisarDni('2.845.678')).toEqual({ estado: 'valido', dni: '2845678' });
  });

  it('el campo vacío no es un error: el DNI es opcional', () => {
    expect(revisarDni('')).toEqual({ estado: 'vacio' });
    expect(revisarDni('  ')).toEqual({ estado: 'vacio' });
    expect(revisarDni('..')).toEqual({ estado: 'vacio' });
  });

  it('frena 6 y 9 dígitos, y lo que no son dígitos', () => {
    expect(revisarDni('284.567')).toEqual({ estado: 'invalido', motivo: 'largo' });
    expect(revisarDni('284.567.891')).toEqual({ estado: 'invalido', motivo: 'largo' });
    expect(revisarDni('28-456-789')).toEqual({ estado: 'invalido', motivo: 'caracteres' });
    expect(revisarDni('DNI 28456789')).toEqual({ estado: 'invalido', motivo: 'caracteres' });
  });
});

describe('operacionDelTrabajo', () => {
  it('es el precio del trabajo o lo cobrado, lo que sea más', () => {
    expect(operacionDelTrabajo(centavos(1_000), centavos(400))).toBe(1_000);
    expect(operacionDelTrabajo(centavos(1_000), centavos(1_200))).toBe(1_200);
    expect(operacionDelTrabajo(centavos(1_000), centavos(1_000))).toBe(1_000);
    expect(operacionDelTrabajo(null, centavos(700))).toBe(700);
  });
});

describe('documentoDelReceptor', () => {
  const debajo = centavos(UMBRAL_DE_IDENTIFICACION_CENTAVOS - 1);
  const justo = UMBRAL_DE_IDENTIFICACION_CENTAVOS;

  it('el umbral es $ 10.000.000', () => {
    expect(UMBRAL_DE_IDENTIFICACION_CENTAVOS).toBe(1_000_000_000);
  });

  it('un consumidor final sin CUIT, por debajo del umbral, va sin identificar', () => {
    const cliente = { condicion: 'consumidor_final', cuit: '', dni: '28456789' } as const;
    expect(documentoDelReceptor(cliente, debajo)).toEqual({ docTipo: 99, docNro: '0' });
    expect(documentoDelReceptor({ ...cliente, dni: '' }, centavos(0))).toEqual({
      docTipo: 99,
      docNro: '0',
    });
  });

  it('justo en el umbral, el consumidor final va con su DNI, y si no lo tiene falta', () => {
    const cliente = { condicion: 'consumidor_final', cuit: '', dni: '28456789' } as const;
    expect(documentoDelReceptor(cliente, justo)).toEqual({ docTipo: 96, docNro: '28456789' });
    expect(documentoDelReceptor({ ...cliente, dni: '' }, justo)).toEqual({ falta: 'dni' });
    expect(documentoDelReceptor({ ...cliente, dni: '28.456.789' }, justo)).toEqual({
      falta: 'dni',
    });
    expect(documentoDelReceptor({ ...cliente, dni: '123456' }, justo)).toEqual({ falta: 'dni' });
  });

  it('un consumidor final con un CUIT válido va con su CUIT, sin importar el monto', () => {
    const cliente = { condicion: 'consumidor_final', cuit: CUIT_DE_PRUEBA, dni: '' } as const;
    expect(documentoDelReceptor(cliente, centavos(100))).toEqual({
      docTipo: 80,
      docNro: '20111111112',
    });
    expect(documentoDelReceptor({ ...cliente, dni: '28456789' }, justo)).toEqual({
      docTipo: 80,
      docNro: '20111111112',
    });
  });

  it('un consumidor final con un CUIT que no da no se factura, aunque tenga DNI', () => {
    const cliente = {
      condicion: 'consumidor_final',
      cuit: conOtroVerificador(CUIT_DE_PRUEBA),
      dni: '28456789',
    } as const;
    expect(documentoDelReceptor(cliente, debajo)).toEqual({ falta: 'cuit-invalido' });
    expect(documentoDelReceptor({ ...cliente, cuit: '20-00000001-9' }, debajo)).toEqual({
      falta: 'cuit-invalido',
    });
  });

  it('monotributo, responsable inscripto y exento van siempre con su CUIT', () => {
    for (const condicion of ['monotributo', 'responsable_inscripto', 'exento'] as const) {
      expect(documentoDelReceptor({ condicion, cuit: CUIT_DE_EMPRESA, dni: '' }, debajo)).toEqual({
        docTipo: 80,
        docNro: '30712345671',
      });
      expect(documentoDelReceptor({ condicion, cuit: '', dni: '28456789' }, debajo)).toEqual({
        falta: 'cuit',
      });
      expect(
        documentoDelReceptor(
          { condicion, cuit: conOtroVerificador(CUIT_DE_EMPRESA), dni: '' },
          justo,
        ),
      ).toEqual({ falta: 'cuit-invalido' });
    }
  });
});

describe('el nombre y el domicilio del receptor', () => {
  const consumidor = {
    condicion: 'consumidor_final',
    nombre: '  Lucía Gómez ',
    razonSocial: 'Gómez Lucía SA',
    domicilioFiscal: 'Av. Fiscal 1',
    direccion: ' Olazábal 1240 ',
  } as const;

  it('del consumidor final va su nombre y su dirección', () => {
    expect(nombreDelReceptor(consumidor)).toBe('Lucía Gómez');
    expect(domicilioDelReceptor(consumidor)).toBe('Olazábal 1240');
    expect(domicilioDelReceptor({ ...consumidor, direccion: '' })).toBe('');
  });

  it('del resto, la razón social y el domicilio fiscal, o el nombre y la dirección si están vacíos', () => {
    const empresa = { ...consumidor, condicion: 'responsable_inscripto' } as const;
    expect(nombreDelReceptor(empresa)).toBe('Gómez Lucía SA');
    expect(domicilioDelReceptor(empresa)).toBe('Av. Fiscal 1');
    expect(nombreDelReceptor({ ...empresa, razonSocial: ' \t' })).toBe('Lucía Gómez');
    expect(domicilioDelReceptor({ ...empresa, domicilioFiscal: '' })).toBe('Olazábal 1240');
  });
});

describe('loQueFaltaParaFacturar', () => {
  it('con todo cargado no falta nada', () => {
    expect(loQueFaltaParaFacturar(datosCompletos())).toEqual([]);
  });

  it('cada falta del taller', () => {
    const datos = datosCompletos();
    const conTaller = (taller: Partial<DatosParaFacturar['taller']>) =>
      loQueFaltaParaFacturar({ ...datos, taller: { ...datos.taller, ...taller } });
    expect(conTaller({ condicion: 'responsable_inscripto' })).toEqual(['taller-no-monotributo']);
    expect(conTaller({ condicion: 'exento' })).toEqual(['taller-no-monotributo']);
    expect(conTaller({ condicion: null })).toEqual(['taller-no-monotributo']);
    expect(conTaller({ razonSocial: ' ' })).toEqual(['taller-sin-razon-social']);
    expect(conTaller({ domicilio: '' })).toEqual(['taller-sin-domicilio']);
    expect(conTaller({ ingresosBrutos: '\n' })).toEqual(['taller-sin-ingresos-brutos']);
    expect(conTaller({ inicioDeActividades: null })).toEqual(['taller-sin-inicio-de-actividades']);
  });

  it('cada falta del pago y del trabajo', () => {
    const datos = datosCompletos();
    expect(loQueFaltaParaFacturar({ ...datos, pago: { ...datos.pago, borrado: true } })).toEqual([
      'pago-borrado',
    ]);
    expect(
      loQueFaltaParaFacturar({ ...datos, trabajo: { ...datos.trabajo, borrado: true } }),
    ).toEqual(['pago-borrado']);
    expect(loQueFaltaParaFacturar({ ...datos, pago: { ...datos.pago, moneda: 'USD' } })).toEqual([
      'en-dolares',
    ]);
    expect(
      loQueFaltaParaFacturar({ ...datos, trabajo: { ...datos.trabajo, moneda: 'USD' } }),
    ).toEqual(['en-dolares']);
    expect(
      loQueFaltaParaFacturar({ ...datos, pago: { ...datos.pago, yaEnLaApertura: true } }),
    ).toEqual(['de-la-apertura']);
  });

  it('cada falta del cliente', () => {
    const datos = datosCompletos();
    const conCliente = (cliente: Partial<DatosParaFacturar['cliente']>) =>
      loQueFaltaParaFacturar({ ...datos, cliente: { ...datos.cliente, ...cliente } });
    expect(conCliente({ condicion: 'responsable_inscripto', direccion: 'Una calle 1' })).toEqual([
      'cliente-sin-cuit',
    ]);
    expect(conCliente({ cuit: '20-11111111-3' })).toEqual(['cliente-cuit-invalido']);
    expect(
      conCliente({
        condicion: 'monotributo',
        cuit: CUIT_DE_EMPRESA,
        direccion: '',
        domicilioFiscal: '',
      }),
    ).toEqual(['cliente-sin-domicilio']);
    expect(
      conCliente({ condicion: 'exento', cuit: CUIT_DE_EMPRESA, domicilioFiscal: 'Fiscal 9' }),
    ).toEqual([]);
    expect(conCliente({ domicilioFiscal: '', direccion: '' })).toEqual([]);
  });

  it('el DNI falta desde que el trabajo llega a $ 10.000.000, por su precio o por lo cobrado', () => {
    const datos = datosCompletos();
    const conTrabajo = (precio: Money | null, cobrado: Money) =>
      loQueFaltaParaFacturar({ ...datos, trabajo: { ...datos.trabajo, precio, cobrado } });
    expect(conTrabajo(centavos(999_999_999), centavos(0))).toEqual([]);
    expect(conTrabajo(UMBRAL_DE_IDENTIFICACION_CENTAVOS, centavos(0))).toEqual(['cliente-sin-dni']);
    expect(conTrabajo(null, UMBRAL_DE_IDENTIFICACION_CENTAVOS)).toEqual(['cliente-sin-dni']);
    expect(conTrabajo(centavos(500), UMBRAL_DE_IDENTIFICACION_CENTAVOS)).toEqual([
      'cliente-sin-dni',
    ]);
    expect(
      loQueFaltaParaFacturar({
        ...datos,
        trabajo: { ...datos.trabajo, precio: UMBRAL_DE_IDENTIFICACION_CENTAVOS },
        cliente: { ...datos.cliente, dni: '28456789' },
      }),
    ).toEqual([]);
  });

  it('todo lo que falta, en el orden de la lista', () => {
    expect(
      loQueFaltaParaFacturar({
        taller: {
          condicion: null,
          razonSocial: '',
          domicilio: '',
          ingresosBrutos: '',
          inicioDeActividades: null,
        },
        trabajo: { moneda: 'USD', borrado: true, precio: null, cobrado: centavos(0) },
        pago: { moneda: 'USD', borrado: true, yaEnLaApertura: true },
        cliente: {
          condicion: 'responsable_inscripto',
          cuit: '',
          dni: '',
          domicilioFiscal: '',
          direccion: '',
        },
      }),
    ).toEqual(
      LO_QUE_FALTA_PARA_FACTURAR.filter(
        (codigo) => codigo !== 'cliente-cuit-invalido' && codigo !== 'cliente-sin-dni',
      ),
    );
    expect(
      loQueFaltaParaFacturar({
        ...datosCompletos(),
        trabajo: {
          moneda: 'ARS',
          borrado: false,
          precio: UMBRAL_DE_IDENTIFICACION_CENTAVOS,
          cobrado: centavos(0),
        },
        taller: { ...datosCompletos().taller, ingresosBrutos: '' },
      }),
    ).toEqual(['taller-sin-ingresos-brutos', 'cliente-sin-dni']);
  });
});

describe('importeParaArca', () => {
  it('escribe los centavos con dos decimales y punto, sin pasar por la división', () => {
    expect(importeParaArca(centavos(45_000_000))).toBe('450000.00');
    expect(importeParaArca(centavos(45_000_050))).toBe('450000.50');
    expect(importeParaArca(centavos(123))).toBe('1.23');
    expect(importeParaArca(centavos(5))).toBe('0.05');
    expect(importeParaArca(centavos(0))).toBe('0.00');
    expect(importeParaArca(centavos(9_007_199_254_740_991))).toBe('90071992547409.91');
  });

  it('no escribe un importe negativo', () => {
    expect(() => importeParaArca(centavos(-1))).toThrow(RangeError);
  });
});

describe('el número del comprobante', () => {
  it('el punto de venta va en cinco cifras y el número en ocho', () => {
    expect(puntoDeVentaConCeros(3)).toBe('00003');
    expect(puntoDeVentaConCeros(12_345)).toBe('12345');
    expect(numeroConCeros(42)).toBe('00000042');
    expect(numeroDelComprobante(3, 42)).toBe('00003-00000042');
    expect(numeroDelComprobante(99_998, 99_999_999)).toBe('99998-99999999');
  });

  it('frena un punto de venta o un número fuera de rango', () => {
    expect(() => puntoDeVentaConCeros(0)).toThrow(RangeError);
    expect(() => puntoDeVentaConCeros(99_999)).toThrow(RangeError);
    expect(() => puntoDeVentaConCeros(2.5)).toThrow(RangeError);
    expect(() => numeroConCeros(0)).toThrow(RangeError);
    expect(() => numeroConCeros(100_000_000)).toThrow(RangeError);
  });

  it('el nombre lleva el tipo y el número, igual en los tres idiomas', () => {
    expect(nombreDelComprobante('factura_c', 3, 42)).toBe('Factura C 00003-00000042');
    expect(nombreDelComprobante('nota_de_credito_c', 3, 7)).toBe(
      'Nota de crédito C 00003-00000007',
    );
  });
});

describe('las fechas de ARCA', () => {
  it('van y vuelven entre AAAA-MM-DD y AAAAMMDD', () => {
    expect(fechaParaArca('2026-10-03')).toBe('20261003');
    expect(fechaDeArca('20261003')).toBe('2026-10-03');
    expect(fechaDeArca(fechaParaArca('2028-02-29'))).toBe('2028-02-29');
  });

  it('frenan lo que no es una fecha que existe', () => {
    expect(() => fechaParaArca('2026-02-30')).toThrow(RangeError);
    expect(() => fechaParaArca('20261003')).toThrow(RangeError);
    expect(() => fechaDeArca('2026-10-03')).toThrow(RangeError);
    expect(() => fechaDeArca('20261332')).toThrow(RangeError);
    expect(() => fechaDeArca('2026103')).toThrow(RangeError);
  });
});

describe('el QR', () => {
  it('lleva el JSON de la especificación de ARCA, con los números como números', () => {
    expect(datosDelQr(PARA_EL_QR)).toEqual({
      ver: 1,
      fecha: '2026-10-03',
      cuit: 20_301_234_563,
      ptoVta: 3,
      tipoCmp: 11,
      nroCmp: 42,
      importe: 450_000,
      moneda: 'PES',
      ctz: 1,
      tipoDocRec: 99,
      nroDocRec: 0,
      tipoCodAut: 'E',
      codAut: 76_398_765_432_109,
    });
    expect(Object.keys(datosDelQr(PARA_EL_QR))).toEqual([
      'ver',
      'fecha',
      'cuit',
      'ptoVta',
      'tipoCmp',
      'nroCmp',
      'importe',
      'moneda',
      'ctz',
      'tipoDocRec',
      'nroDocRec',
      'tipoCodAut',
      'codAut',
    ]);
  });

  it('el importe con centavos lleva sus decimales, y la nota de crédito su código', () => {
    const nota = datosDelQr({
      ...PARA_EL_QR,
      tipo: 'nota_de_credito_c',
      importe: centavos(45_000_050),
      docTipo: 96,
      docNro: '28456789',
    });
    expect(nota.importe).toBe(450_000.5);
    expect(nota.tipoCmp).toBe(13);
    expect(nota.nroDocRec).toBe(28_456_789);
  });

  it('el enlace es la URL de ARCA con el base64 del JSON, sin codificar', () => {
    for (const [importe, docNro, docTipo] of [
      [45_000_000, '0', 99],
      [45_000_050, '28456789', 96],
      [1, '30712345671', 80],
      [123_456_789, '0', 99],
    ] as const) {
      const comprobante = { ...PARA_EL_QR, importe: centavos(importe), docNro, docTipo };
      const enlace = enlaceDelQr(comprobante);
      expect(enlace.startsWith(ENLACE_DEL_QR)).toBe(true);
      const base64 = enlace.slice(ENLACE_DEL_QR.length);
      expect(base64).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
      expect(JSON.parse(textoDeBase64(base64))).toEqual(datosDelQr(comprobante));
    }
    expect(ENLACE_DEL_QR).toBe('https://www.arca.gob.ar/fe/qr/?p=');
  });

  it('el base64 rellena con uno o dos iguales según el largo del JSON', () => {
    const rellenos = new Set<number>();
    for (let numero = 1; numero <= 300; numero += 1) {
      const base64 = enlaceDelQr({ ...PARA_EL_QR, numero }).slice(ENLACE_DEL_QR.length);
      rellenos.add(base64.length - base64.replace(/=+$/, '').length);
      expect(JSON.parse(textoDeBase64(base64))).toEqual(datosDelQr({ ...PARA_EL_QR, numero }));
    }
    expect([...rellenos].sort()).toEqual([0, 1, 2]);
  });

  it('frena lo que el QR no puede llevar', () => {
    expect(() => datosDelQr({ ...PARA_EL_QR, importe: centavos(10_000_000_000_000) })).toThrow(
      RangeError,
    );
    expect(() => datosDelQr({ ...PARA_EL_QR, cae: '7639876543210' })).toThrow(RangeError);
    expect(() => datosDelQr({ ...PARA_EL_QR, docNro: '28.456.789' })).toThrow(RangeError);
    expect(() => datosDelQr({ ...PARA_EL_QR, cuitEmisor: '20-30123456-4' })).toThrow(RangeError);
    expect(() => datosDelQr({ ...PARA_EL_QR, fecha: '2026-13-01' })).toThrow(RangeError);
    expect(() => datosDelQr({ ...PARA_EL_QR, puntoDeVenta: 0 })).toThrow(RangeError);
    expect(() => datosDelQr({ ...PARA_EL_QR, numero: 0 })).toThrow(RangeError);
  });
});

describe('claseDelRechazo', () => {
  it('separa la numeración, la condición frente al IVA y el documento del resto', () => {
    expect(claseDelRechazo(10016)).toBe('numeracion');
    expect(claseDelRechazo(10242)).toBe('condicion-iva');
    expect(claseDelRechazo(10243)).toBe('condicion-iva');
    expect(claseDelRechazo(10246)).toBe('condicion-iva');
    expect(claseDelRechazo(10015)).toBe('documento');
    expect(claseDelRechazo(10071)).toBe('otro');
    expect(claseDelRechazo(600)).toBe('otro');
  });
});

describe('detalleDeLaFactura', () => {
  it('junta el concepto del pago y el trabajo', () => {
    expect(detalleDeLaFactura('Seña', 'Placard de pino')).toBe('Seña — Placard de pino');
    expect(detalleDeLaFactura('  Seña ', ' Placard de pino ')).toBe('Seña — Placard de pino');
  });

  it('si falta uno de los dos, va el otro solo', () => {
    expect(detalleDeLaFactura('', 'Placard de pino')).toBe('Placard de pino');
    expect(detalleDeLaFactura('Seña', ' ')).toBe('Seña');
    expect(detalleDeLaFactura('', '')).toBe('');
  });

  it('se corta en 200 letras, contadas como letras, sin dejar blancos en la punta', () => {
    const largo = detalleDeLaFactura('Seña', 'ñ'.repeat(300));
    expect(Array.from(largo)).toHaveLength(LARGO_MAXIMO_DEL_DETALLE);
    const conBlanco = detalleDeLaFactura('Saldo', `${'a'.repeat(191)} ${'b'.repeat(20)}`);
    expect(conBlanco).toBe(`Saldo — ${'a'.repeat(191)}`);
    expect(Array.from(conBlanco)).toHaveLength(LARGO_MAXIMO_DEL_DETALLE - 1);
    const emoji = detalleDeLaFactura('', '🪵'.repeat(250));
    expect(Array.from(emoji)).toHaveLength(LARGO_MAXIMO_DEL_DETALLE);
  });
});

describe('nombreDelArchivoDeLaFactura', () => {
  it('lleva el comprobante y el receptor como sale en la factura', () => {
    expect(
      nombreDelArchivoDeLaFactura({
        tipo: 'factura_c',
        puntoDeVenta: 3,
        numero: 42,
        receptorNombre: 'Lucía Gómez',
      }),
    ).toBe('Factura C 00003-00000042 - Lucía Gómez.pdf');
    expect(
      nombreDelArchivoDeLaFactura({
        tipo: 'nota_de_credito_c',
        puntoDeVenta: 3,
        numero: 7,
        receptorNombre: 'Lucía Gómez',
      }),
    ).toBe('Nota de crédito C 00003-00000007 - Lucía Gómez.pdf');
  });

  it('saca lo que no puede ir en el nombre de un archivo', () => {
    expect(
      nombreDelArchivoDeLaFactura({
        tipo: 'factura_c',
        puntoDeVenta: 1,
        numero: 1,
        receptorNombre: ' Pérez / Hijos: "SRL"  ',
      }),
    ).toBe('Factura C 00001-00000001 - Pérez Hijos SRL.pdf');
    expect(
      nombreDelArchivoDeLaFactura({
        tipo: 'factura_c',
        puntoDeVenta: 1,
        numero: 1,
        receptorNombre: '???',
      }),
    ).toBe('Factura C 00001-00000001.pdf');
  });
});

describe('facturadoEnLosUltimos12Meses', () => {
  it('suma las facturas autorizadas y anuladas y resta las notas autorizadas, solo de producción', () => {
    const resultado = facturadoEnLosUltimos12Meses(
      [
        comprobante({ importe: centavos(1_000) }),
        comprobante({ estado: 'anulada', importe: centavos(2_000) }),
        comprobante({ tipo: 'nota_de_credito_c', importe: centavos(2_000) }),
        comprobante({ estado: 'rechazada', importe: centavos(50) }),
        comprobante({ estado: 'pedida', fecha: null, importe: centavos(60) }),
        comprobante({ estado: 'emitiendo', importe: centavos(70) }),
        comprobante({ estado: 'a_revisar', importe: centavos(80) }),
        comprobante({ tipo: 'nota_de_credito_c', estado: 'rechazada', importe: centavos(90) }),
        comprobante({ tipo: 'nota_de_credito_c', estado: 'pedida', importe: centavos(95) }),
        comprobante({ ambiente: 'homologacion', importe: centavos(5_000) }),
      ],
      '2026-10-03',
    );
    expect(resultado).toEqual({ desde: '2025-11-01', hasta: '2026-10-03', centavos: 1_000 });
  });

  it('mira desde el primer día del mes de hace once meses hasta hoy, cruzando el año', () => {
    const comprobantes = [
      comprobante({ fecha: '2026-01-31', importe: centavos(1) }),
      comprobante({ fecha: '2026-02-01', importe: centavos(10) }),
      comprobante({ fecha: '2026-12-31', importe: centavos(100) }),
      comprobante({ fecha: '2027-01-15', importe: centavos(1_000) }),
      comprobante({ fecha: '2027-01-16', importe: centavos(10_000) }),
    ];
    expect(facturadoEnLosUltimos12Meses(comprobantes, '2027-01-15')).toEqual({
      desde: '2026-02-01',
      hasta: '2027-01-15',
      centavos: 1_110,
    });
  });

  it('sin nada facturado da cero', () => {
    expect(facturadoEnLosUltimos12Meses([], '2026-10-03').centavos).toBe(0);
  });
});

describe('estadoDelTope', () => {
  const topeD = ESCALA.topesCentavos.D;
  const topeK = ESCALA.topesCentavos.K;
  const porcentajeDe = (proporcion: number) => centavos(Math.floor((topeD * proporcion) / 100));

  it('debajo del 80 % está bien', () => {
    expect(estadoDelTope(porcentajeDe(79), 'D', ESCALA)).toMatchObject({
      tope: topeD,
      porcentaje: 78,
      nivel: 'bien',
    });
    expect(estadoDelTope(centavos(0), 'D', ESCALA)).toEqual({
      tope: topeD,
      proporcion: 0,
      porcentaje: 0,
      nivel: 'bien',
    });
  });

  it('desde el 80 % se acerca, hasta el tope justo', () => {
    expect(estadoDelTope(centavos(Math.ceil((topeD * 4) / 5)), 'D', ESCALA).nivel).toBe('cerca');
    expect(estadoDelTope(centavos(Math.ceil((topeD * 4) / 5) - 1), 'D', ESCALA).nivel).toBe('bien');
    const enElTope = estadoDelTope(topeD, 'D', ESCALA);
    expect(enElTope).toEqual({ tope: topeD, proporcion: 1, porcentaje: 100, nivel: 'cerca' });
  });

  it('pasado el tope de su categoría está pasado, y pasado el de la K está fuera', () => {
    expect(estadoDelTope(centavos(topeD + 1), 'D', ESCALA).nivel).toBe('pasado');
    expect(estadoDelTope(topeK, 'D', ESCALA).nivel).toBe('pasado');
    expect(estadoDelTope(topeK, 'K', ESCALA).nivel).toBe('cerca');
    expect(estadoDelTope(centavos(topeK + 1), 'K', ESCALA).nivel).toBe('fuera');
    expect(estadoDelTope(centavos(topeK + 1), 'A', ESCALA)).toMatchObject({ nivel: 'fuera' });
  });

  it('lo facturado en negativo cuenta como cero', () => {
    expect(estadoDelTope(centavos(-500), 'A', ESCALA)).toMatchObject({
      proporcion: 0,
      porcentaje: 0,
      nivel: 'bien',
    });
  });

  it('el porcentaje se trunca, para no decir 80 antes de llegar', () => {
    const casi = estadoDelTope(centavos(Math.floor((topeD * 4) / 5) - 1), 'D', ESCALA);
    expect(casi.porcentaje).toBe(79);
    expect(casi.nivel).toBe('bien');
  });
});

describe('proximaRecategorizacion', () => {
  it('es el próximo 5 de febrero o 5 de agosto, contando hoy', () => {
    expect(proximaRecategorizacion('2026-01-01')).toBe('2026-02-05');
    expect(proximaRecategorizacion('2026-02-05')).toBe('2026-02-05');
    expect(proximaRecategorizacion('2026-02-06')).toBe('2026-08-05');
    expect(proximaRecategorizacion('2026-08-05')).toBe('2026-08-05');
    expect(proximaRecategorizacion('2026-08-06')).toBe('2027-02-05');
    expect(proximaRecategorizacion('2026-12-31')).toBe('2027-02-05');
  });

  it('frena lo que no es una fecha', () => {
    expect(() => proximaRecategorizacion('2026-13-01')).toThrow(RangeError);
  });
});
