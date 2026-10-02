import type { Envoltorio } from '@/shared/lib';

export const paginaDiezmo = {
  titulo: 'Diezmo',
  registrarDiezmo: 'Registrar diezmo',
  estadoDelDiezmo: 'Estado del diezmo',
  debesElImporte: (importe: string, Importe: Envoltorio) => (
    <>
      Debés <Importe>{importe}</Importe>
    </>
  ),
  pagasteElImporteDeMas: (importe: string, Importe: Envoltorio) => (
    <>
      Pagaste <Importe>{importe}</Importe> de más
    </>
  ),
  generadoYPagado: 'Generado y pagado',
  generadoEnTotal: 'Generado en total',
  pagadoEnTotal: 'Pagado en total',
  pagadoSobreLoGenerado: 'Pagado sobre lo generado',
  yaEstaPagado: (porcentaje: number) => `${String(porcentaje)}% de lo generado ya está pagado`,
  loGeneradoYLoPagado: 'Lo generado y lo pagado',
  regla: {
    cobrado: (porcentaje: string) => `El ${porcentaje}% de lo que cobrás de cada trabajo`,
    ingreso: (porcentaje: string) =>
      `El ${porcentaje}% del ingreso de cada trabajo (lo cobrado menos los gastos)`,
  },
  todaviaSinDiezmo: {
    cobrado: (porcentaje: string) =>
      `Todavía no se generó diezmo. El ${porcentaje}% de lo que cobrás de cada trabajo se anota acá solo, cuando lo cobrás. Después lo vas cancelando con pagos.`,
    ingreso: (porcentaje: string) =>
      `Todavía no se generó diezmo. El ${porcentaje}% del ingreso de cada trabajo (lo cobrado menos los gastos) se anota acá solo, cuando lo cobrás. Después lo vas cancelando con pagos.`,
  },
  todaviaSinDiezmoNiRegla:
    'Todavía no se generó diezmo. Lo que corresponde al diezmo de cada trabajo se anota acá solo, cuando lo cobrás. Después lo vas cancelando con pagos.',
} as const;
