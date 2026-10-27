import { expect, test as base } from '@playwright/test';

import { sacarLosEscapados, trabarLaFacturacion } from './facturacion';
import { laSesionGuardadaVigente } from './sesion';

export const CLAVE_DE_LA_FORMA_NUEVA = 'maun:tesoros-forma-nueva-propuesta';

export const test = base.extend<{
  trabaDeLaFacturacion: undefined;
  laFormaNuevaYaSePropuso: boolean;
  marcaDeLaFormaNueva: undefined;
}>({
  storageState: [
    async ({ storageState }, use) => {
      await use(
        typeof storageState === 'string'
          ? await laSesionGuardadaVigente(storageState)
          : storageState,
      );
    },
    { scope: 'test' },
  ],
  laFormaNuevaYaSePropuso: [true, { option: true }],
  marcaDeLaFormaNueva: [
    async ({ context, laFormaNuevaYaSePropuso }, use) => {
      if (laFormaNuevaYaSePropuso) {
        await context.addInitScript((clave) => {
          try {
            globalThis.localStorage.setItem(clave, '1');
          } catch {
            return;
          }
        }, CLAVE_DE_LA_FORMA_NUEVA);
      }
      await use(undefined);
    },
    { auto: true },
  ],
  trabaDeLaFacturacion: [
    async ({ context }, use) => {
      sacarLosEscapados();
      await trabarLaFacturacion(context);
      await use(undefined);
      const escapados = sacarLosEscapados();
      expect(
        escapados,
        `Salieron pedidos a la facturación sin interceptar: ${escapados.join(', ')}. Ningún e2e le pide nada a ARCA: respondelos con servidorDeLaFacturacion (e2e/apoyo/facturacion.ts).`,
      ).toEqual([]);
    },
    { auto: true },
  ],
});
