import { describe, expect, it } from 'vitest';

import { intrusosDelMotorDelPdf } from './motor-del-pdf.ts';

const PDFKIT = 'C:/repo/node_modules/.pnpm/pdfkit@0.20.1/node_modules/pdfkit/js/pdfkit.js';
const REACT = 'C:/repo/node_modules/.pnpm/react@19.3.0/node_modules/react/index.js';

describe('el motor del PDF no entra en lo que baja al abrir la app', () => {
  it('nada que decir si el vendor y la entrada no lo traen', () => {
    expect(
      intrusosDelMotorDelPdf({
        'index.js': {
          type: 'chunk',
          fileName: 'index.js',
          isEntry: true,
          moduleIds: ['src/main.ts'],
        },
        'vendor.js': { type: 'chunk', fileName: 'vendor.js', name: 'vendor', moduleIds: [REACT] },
        'motor.js': {
          type: 'chunk',
          fileName: 'motor.js',
          name: 'motor-del-pdf',
          moduleIds: [PDFKIT],
        },
      }),
    ).toEqual([]);
  });

  it('el vendor con pdfkit, fontkit o yoga corta el build', () => {
    const intrusos = intrusosDelMotorDelPdf({
      'vendor.js': {
        type: 'chunk',
        fileName: 'vendor.js',
        name: 'vendor',
        moduleIds: [REACT, PDFKIT],
      },
    });
    expect(intrusos).toHaveLength(1);
    expect(intrusos[0]).toContain('vendor.js trae');
    expect(intrusos[0]).toContain('pdfkit');
  });

  it('la entrada tampoco', () => {
    for (const paquete of [
      'fontkit@2.0.4/node_modules/fontkit',
      'yoga-layout@3.2.1/node_modules/yoga-layout',
    ]) {
      expect(
        intrusosDelMotorDelPdf({
          'index.js': {
            type: 'chunk',
            fileName: 'index.js',
            isEntry: true,
            moduleIds: [`C:/repo/node_modules/.pnpm/${paquete}/dist/index.js`],
          },
        }),
      ).toHaveLength(1);
    }
  });

  it('un archivo que no es código, como el del Worker, no cuenta', () => {
    expect(
      intrusosDelMotorDelPdf({
        'trabajador.js': { type: 'asset', fileName: 'trabajador.js' },
      }),
    ).toEqual([]);
  });
});
