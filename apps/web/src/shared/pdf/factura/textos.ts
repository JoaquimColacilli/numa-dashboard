import type { TipoDeComprobante } from '@maun/domain';

export const TEXTOS_DE_LA_FACTURA = {
  letra: 'C',
  codigo: { factura_c: 'COD. 011', nota_de_credito_c: 'COD. 013' },
  tipo: { factura_c: 'FACTURA', nota_de_credito_c: 'NOTA DE CRÉDITO' },
  numero: (numero: string) => `Nº ${numero}`,
  fechaDeEmision: 'Fecha de emisión',
  cuit: (cuit: string) => `CUIT ${cuit}`,
  ingresosBrutos: (numero: string) => `Ingresos Brutos ${numero}`,
  inicioDeActividades: (fecha: string) => `Inicio de actividades ${fecha}`,
  responsableMonotributo: 'Responsable Monotributo',
  cliente: 'Cliente',
  condicionFrenteAlIva: 'Condición frente al IVA',
  documento: 'Documento',
  domicilio: 'Domicilio',
  sinDato: '—',
  documentoDelReceptor: { 80: 'CUIT', 96: 'DNI' },
  anula: (factura: string, fecha: string) => `Anula la factura C ${factura} del ${fecha}.`,
  descripcion: 'Descripción',
  cantidad: 'Cant.',
  precioUnitario: 'Precio unitario',
  importe: 'Importe',
  importeTotal: 'Importe total',
  cae: (cae: string) => `CAE Nº ${cae}`,
  venceElCae: (fecha: string) => `Vencimiento del CAE ${fecha}`,
  autorizado: 'Comprobante autorizado por ARCA',
  prueba: 'PRUEBA · SIN VALIDEZ FISCAL',
  palabraClave: { factura_c: 'Factura C', nota_de_credito_c: 'Nota de crédito C' },
} as const satisfies {
  codigo: Record<TipoDeComprobante, string>;
  tipo: Record<TipoDeComprobante, string>;
  palabraClave: Record<TipoDeComprobante, string>;
  [clave: string]: unknown;
};
