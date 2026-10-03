import { readFileSync } from 'node:fs';
import path from 'node:path';

import { IPC } from '@maun/domain';
import * as prettier from 'prettier';
import { describe, expect, it } from 'vitest';

import { RAIZ } from '../scripts/conexion.ts';
import {
  ENCABEZADO_DEL_CSV,
  FormaInesperada,
  leerElCsv,
  leerLaApi,
  textoDelIndice,
} from '../scripts/lector-del-ipc.ts';

const ENCABEZADO = ENCABEZADO_DEL_CSV.join(';');
const REGIONES = ['GBA', 'Pampeana', 'Noreste', 'Noroeste', 'Cuyo', 'Patagonia', 'Nacional'];

function renglonesDelMes(periodo: string, nacional: string): string[] {
  return [
    ...REGIONES.map(
      (region) =>
        `0;NIVEL GENERAL;Nivel general y divisiones COICOP;${periodo};${region === 'Nacional' ? nacional : '99,1'};1,6;NA;${region}`,
    ),
    `01;Alimentos y bebidas no alcohólicas;Nivel general y divisiones COICOP;${periodo};98,7;NA;NA;Nacional`,
    `Núcleo;Núcleo;Categorias;${periodo};97,2;NA;NA;Nacional`,
    `B;Bienes;Bienes y servicios;${periodo};96,4;NA;NA;Nacional`,
  ];
}

function csv(...renglones: string[]): string {
  return [ENCABEZADO, ...renglones, ''].join('\r\n');
}

const MUESTRA = csv(
  ...renglonesDelMes('201612', '100'),
  ...renglonesDelMes('201702', '103,6859'),
  ...renglonesDelMes('201701', '101,5859'),
);

describe('leerElCsv', () => {
  it('se queda con el nivel general nacional, mes por mes y en orden', () => {
    expect(leerElCsv(MUESTRA)).toEqual({
      desde: '2016-12',
      hasta: '2017-02',
      valores: [100, 101.5859, 103.6859],
    });
  });

  it('acepta el CSV con BOM y con finales de línea de Unix', () => {
    expect(leerElCsv(`\uFEFF${MUESTRA.replaceAll('\r\n', '\n')}`).hasta).toBe('2017-02');
  });

  it('falla en voz alta si cambia el encabezado', () => {
    const otro = MUESTRA.replace('Indice_IPC', 'Indice');
    expect(() => leerElCsv(otro)).toThrow(FormaInesperada);
    expect(() => leerElCsv(otro)).toThrow(/encabezado/);
  });

  it('falla si un renglón no tiene los ocho campos', () => {
    expect(() =>
      leerElCsv(csv(...renglonesDelMes('201612', '100'), '0;NIVEL GENERAL;201701;101,5;Nacional')),
    ).toThrow(/renglón 12 del CSV tiene 5 campos/);
  });

  it('falla si el período no es AAAAMM', () => {
    expect(() => leerElCsv(csv(...renglonesDelMes('2016-12', '100')))).toThrow(/AAAAMM/);
    expect(() => leerElCsv(csv(...renglonesDelMes('201613', '100')))).toThrow(/AAAAMM/);
  });

  it('falla si el índice no es un número con coma decimal', () => {
    expect(() =>
      leerElCsv(csv(...renglonesDelMes('201612', '100'), ...renglonesDelMes('201701', 'NA'))),
    ).toThrow(/2017-01: el índice «NA»/);
    expect(() =>
      leerElCsv(csv(...renglonesDelMes('201612', '100'), ...renglonesDelMes('201701', '1.101,5'))),
    ).toThrow(/coma decimal/);
    expect(() =>
      leerElCsv(csv(...renglonesDelMes('201612', '100'), ...renglonesDelMes('201701', '0'))),
    ).toThrow(/no es positivo/);
  });

  it('falla si la serie no empieza en la base, diciembre de 2016 con 100', () => {
    expect(() => leerElCsv(csv(...renglonesDelMes('201701', '101,5859')))).toThrow(
      /empezar en 2016-12 con 100/,
    );
    expect(() => leerElCsv(csv(...renglonesDelMes('201612', '100,5')))).toThrow(
      /empezar en 2016-12 con 100/,
    );
  });

  it('falla si falta un mes o si se repite', () => {
    expect(() =>
      leerElCsv(csv(...renglonesDelMes('201612', '100'), ...renglonesDelMes('201702', '103,6859'))),
    ).toThrow(/se esperaba 2017-01 y vino 2017-02/);
    expect(() =>
      leerElCsv(
        csv(
          ...renglonesDelMes('201612', '100'),
          ...renglonesDelMes('201701', '101,5859'),
          ...renglonesDelMes('201701', '101,5859'),
        ),
      ),
    ).toThrow(/se esperaba 2017-02 y vino 2017-01/);
  });

  it('falla si no trae ningún mes del nivel general nacional', () => {
    const sinNacional = csv(
      ...renglonesDelMes('201612', '100').filter((renglon) => !renglon.endsWith(';Nacional')),
    );
    expect(() => leerElCsv(sinNacional)).toThrow(/no trajo ningún mes/);
  });
});

describe('leerLaApi', () => {
  it('lee la serie de datos.gob.ar', () => {
    expect(
      leerLaApi({
        data: [
          ['2017-01-01', 101.5859],
          ['2016-12-01', 100.0],
        ],
        count: 2,
      }),
    ).toEqual({ desde: '2016-12', hasta: '2017-01', valores: [100, 101.5859] });
  });

  it('falla en voz alta si cambia la forma de la respuesta', () => {
    expect(() => leerLaApi(null)).toThrow(/`data`/);
    expect(() => leerLaApi({ datos: [] })).toThrow(/`data`/);
    expect(() => leerLaApi({ data: [] })).toThrow(/no trajo ningún mes/);
    expect(() => leerLaApi({ data: [['2016-12', 100]] })).toThrow(/AAAA-MM-01/);
    expect(() => leerLaApi({ data: ['2016-12-01'] })).toThrow(/AAAA-MM-01/);
    expect(() => leerLaApi({ data: [['2016-12-01', '100']] })).toThrow(/no es positivo/);
    expect(() => leerLaApi({ data: [['2016-12-01', 0]] })).toThrow(/no es positivo/);
  });
});

describe('textoDelIndice', () => {
  it('el índice del dominio es lo que escribe el generador, con el formato de prettier', async () => {
    const destino = path.join(RAIZ, 'packages', 'domain', 'src', 'ipc.ts');
    const opciones = (await prettier.resolveConfig(destino)) ?? {};
    const generado = await prettier.format(
      textoDelIndice({ desde: IPC.desde, hasta: IPC.hasta, valores: [...IPC.valores] }, IPC.fuente),
      { ...opciones, filepath: destino },
    );
    expect(generado).toBe(readFileSync(destino, 'utf8'));
  });
});
