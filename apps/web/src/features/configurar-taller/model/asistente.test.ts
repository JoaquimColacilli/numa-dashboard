import { describe, expect, it } from 'vitest';

import type { EstadoDeLaFacturacion } from '@/shared/api';

import {
  avanceDelAsistente,
  certificadoParaSubir,
  pasosALaVista,
  puntoDeVentaLeido,
} from './asistente';

const SIN_CONECTAR: EstadoDeLaFacturacion = {
  conectada: false,
  ambiente: null,
  prendido: true,
  servidor: null,
  login: null,
  esperarHasta: null,
  ultimoNumero: null,
  certificadoVence: null,
  certificado: null,
};

const EN_PRODUCCION: EstadoDeLaFacturacion = {
  ...SIN_CONECTAR,
  conectada: true,
  ambiente: 'produccion',
  certificadoVence: '2026-12-01',
};

function conCertificado(
  estado: EstadoDeLaFacturacion,
  certificado: NonNullable<EstadoDeLaFacturacion['certificado']>['estado'],
): EstadoDeLaFacturacion {
  return { ...estado, certificado: { estado: certificado, vence: '2028-10-03' } };
}

describe('el avance del asistente', () => {
  it('sin saber nada todavía, empieza por el paso 1', () => {
    expect(avanceDelAsistente(null)).toEqual({
      renovando: false,
      enPrueba: false,
      prendido: true,
      pedidoBajado: false,
      certificadoSubido: false,
      primero: 1,
      vence: null,
    });
  });

  it('se abre en el primer paso que falta', () => {
    expect(avanceDelAsistente(SIN_CONECTAR).primero).toBe(1);
    expect(avanceDelAsistente(conCertificado(SIN_CONECTAR, 'pedido'))).toMatchObject({
      pedidoBajado: true,
      certificadoSubido: false,
      primero: 2,
    });
    expect(avanceDelAsistente(conCertificado(SIN_CONECTAR, 'subido'))).toMatchObject({
      pedidoBajado: true,
      certificadoSubido: true,
      primero: 7,
      vence: '2028-10-03',
    });
    expect(avanceDelAsistente(conCertificado(SIN_CONECTAR, 'activo')).primero).toBe(11);
  });

  it('al renovar, el certificado que anda no cuenta como subido', () => {
    expect(avanceDelAsistente(conCertificado(EN_PRODUCCION, 'activo'))).toMatchObject({
      renovando: true,
      pedidoBajado: false,
      certificadoSubido: false,
      primero: 1,
    });
    expect(avanceDelAsistente(conCertificado(EN_PRODUCCION, 'pedido')).primero).toBe(2);
    expect(avanceDelAsistente(conCertificado(EN_PRODUCCION, 'subido')).primero).toBe(11);
  });

  it('el taller conectado en homologación está en prueba, no renovando', () => {
    expect(
      avanceDelAsistente({ ...SIN_CONECTAR, conectada: true, ambiente: 'homologacion' }),
    ).toMatchObject({ renovando: false, enPrueba: true });
  });

  it('con la facturación apagada lo dice', () => {
    expect(avanceDelAsistente({ ...SIN_CONECTAR, prendido: false }).prendido).toBe(false);
  });
});

describe('los pasos a la vista', () => {
  it('para conectar, los once', () => {
    const { enLaLista, plegados } = pasosALaVista(false);
    expect(enLaLista.map((paso) => paso.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(plegados).toEqual([]);
  });

  it('para renovar, del 1 al 6 y el 11, con el 7 y el 8 plegados', () => {
    const { enLaLista, plegados } = pasosALaVista(true);
    expect(enLaLista.map((paso) => paso.numero)).toEqual([1, 2, 3, 4, 5, 6, 11]);
    expect(plegados.map((paso) => paso.numero)).toEqual([7, 8]);
  });
});

describe('el punto de venta escrito', () => {
  it.each([
    ['3', 3],
    ['00003', 3],
    [' 12 ', 12],
    ['99998', 99_998],
  ])('«%s» es el %d', (escrito, numero) => {
    expect(puntoDeVentaLeido(escrito)).toBe(numero);
  });

  it.each(['', '0', '00000', '99999', '123456', '3a', '-3', '3.5'])('«%s» no es uno', (escrito) => {
    expect(puntoDeVentaLeido(escrito)).toBeNull();
  });
});

describe('el certificado para subir', () => {
  it('un PEM va como texto, tal cual', async () => {
    const pem = '-----BEGIN CERTIFICATE-----\nMIIC\n-----END CERTIFICATE-----\n';
    expect(await certificadoParaSubir(new Blob([pem]))).toBe(pem);
  });

  it('un DER va en base64', async () => {
    const der = new Uint8Array([0x30, 0x82, 0x01, 0xff, 0x00, 0xfe]);
    expect(await certificadoParaSubir(new Blob([der]))).toBe('MIIB/wD+');
  });
});
