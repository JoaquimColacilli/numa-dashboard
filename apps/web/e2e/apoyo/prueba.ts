import { expect, test as base } from '@playwright/test';

import { sacarLosEscapados, trabarLaFacturacion } from './facturacion';

export const test = base.extend<{ trabaDeLaFacturacion: undefined }>({
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
