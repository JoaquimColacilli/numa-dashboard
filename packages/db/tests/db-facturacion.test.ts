import { describe, expect, it } from 'vitest';

import { CUIT_DE_PRUEBA, cuitTapado, leerElPedido } from '../scripts/facturacion/pedido.ts';

const ENTORNO = { emailDeLosE2e: 'pruebas@numa.test', hoy: '2026-10-03' };

describe('db:facturacion conecta en prueba solo el taller de los e2e (traba 2)', () => {
  it('con --ambiente produccion se niega siempre, aunque el mail sea el de los e2e', () => {
    expect(() =>
      leerElPedido(
        [
          '--conectar',
          '--email',
          'pruebas@numa.test',
          '--ambiente',
          'produccion',
          '--punto-de-venta',
          '2',
        ],
        ENTORNO,
      ),
    ).toThrow(/La producción no se conecta desde acá/);
  });

  it('en homologación se niega con un mail que no es el E2E_EMAIL, y sin E2E_EMAIL también', () => {
    const otro = [
      '--conectar',
      '--email',
      'eliseo@maun.test',
      '--ambiente',
      'homologacion',
      '--punto-de-venta',
      '2',
    ];
    expect(() => leerElPedido(otro, ENTORNO)).toThrow(/E2E_EMAIL/);
    expect(() =>
      leerElPedido(
        [
          '--conectar',
          '--email',
          'pruebas@numa.test',
          '--ambiente',
          'homologacion',
          '--punto-de-venta',
          '2',
        ],
        { emailDeLosE2e: undefined, hoy: '2026-10-03' },
      ),
    ).toThrow(/E2E_EMAIL/);
  });

  it('con el mail de los e2e conecta en homologación, desde hoy si no se dice otra fecha', () => {
    expect(
      leerElPedido(
        [
          '--conectar',
          '--email',
          'Pruebas@NUMA.test',
          '--ambiente',
          'homologacion',
          '--punto-de-venta',
          '2',
        ],
        ENTORNO,
      ),
    ).toEqual({
      tarea: 'conectar',
      email: 'Pruebas@NUMA.test',
      puntoDeVenta: 2,
      desde: '2026-10-03',
    });
  });

  it('no acepta otro CUIT: el taller de prueba se guarda con el inventado', () => {
    expect(CUIT_DE_PRUEBA).toBe('20-11111111-2');
    expect(() =>
      leerElPedido(
        [
          '--conectar',
          '--email',
          'pruebas@numa.test',
          '--ambiente',
          'homologacion',
          '--punto-de-venta',
          '2',
          '--cuit',
          '20-30123456-3',
        ],
        ENTORNO,
      ),
    ).toThrow();
  });

  it('sin ambiente, sin punto de venta o con uno fuera de rango, tampoco', () => {
    expect(() =>
      leerElPedido(
        ['--conectar', '--email', 'pruebas@numa.test', '--punto-de-venta', '2'],
        ENTORNO,
      ),
    ).toThrow(/homologacion/);
    expect(() =>
      leerElPedido(
        ['--conectar', '--email', 'pruebas@numa.test', '--ambiente', 'homologacion'],
        ENTORNO,
      ),
    ).toThrow(/punto-de-venta/);
    expect(() =>
      leerElPedido(
        [
          '--conectar',
          '--email',
          'pruebas@numa.test',
          '--ambiente',
          'homologacion',
          '--punto-de-venta',
          '99999',
        ],
        ENTORNO,
      ),
    ).toThrow(/punto-de-venta/);
  });
});

describe('db:facturacion, las otras tareas', () => {
  it('lista, carga Vault, desconecta y resuelve a mano', () => {
    expect(leerElPedido(['--listar'], ENTORNO)).toEqual({ tarea: 'listar' });
    expect(leerElPedido(['--vault'], ENTORNO)).toEqual({ tarea: 'vault' });
    expect(
      leerElPedido(['--desconectar', '--email', 'pruebas@numa.test', '--forzar'], ENTORNO),
    ).toEqual({
      tarea: 'desconectar',
      email: 'pruebas@numa.test',
      forzar: true,
    });
    expect(
      leerElPedido(
        [
          '--resolver',
          '0192a3b4-c5d6-7e8f-9a0b-0000000000a1',
          '--como',
          'autorizada',
          '--cae',
          '76398765432109',
          '--vence',
          '2026-10-13',
          '--fecha',
          '2026-10-03',
        ],
        ENTORNO,
      ),
    ).toEqual({
      tarea: 'resolver',
      id: '0192a3b4-c5d6-7e8f-9a0b-0000000000a1',
      resolucion: {
        como: 'autorizada',
        cae: '76398765432109',
        vence: '2026-10-13',
        fecha: '2026-10-03',
      },
    });
  });

  it('una sola tarea por vez, y resolver como autorizada exige el CAE', () => {
    expect(() => leerElPedido(['--listar', '--vault'], ENTORNO)).toThrow(/Uso/);
    expect(() => leerElPedido([], ENTORNO)).toThrow(/Uso/);
    expect(() =>
      leerElPedido(
        ['--resolver', '0192a3b4-c5d6-7e8f-9a0b-0000000000a1', '--como', 'autorizada'],
        ENTORNO,
      ),
    ).toThrow(/--cae/);
  });

  it('nunca muestra un CUIT entero', () => {
    expect(cuitTapado('20-30123456-3')).toBe('20-••••••••-3');
    expect(cuitTapado('')).toBe('');
  });
});
