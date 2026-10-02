export const adjuntarArchivos = {
  titulo: 'Archivos',
  queVeElCliente: (total: number, compartidos: number): string =>
    total === 1
      ? `1 archivo · el cliente ve ${String(compartidos)}`
      : `${String(total)} archivos · el cliente ve ${String(compartidos)}`,
  queVeElClienteTodos: (total: number): string =>
    total === 1
      ? '1 archivo · el cliente ve todos'
      : `${String(total)} archivos · el cliente ve todos`,
  queSeSube: 'Fotos, capturas y PDF. Las fotos se achican antes de subirse. Los videos no entran.',
  noVeNinguno: 'El cliente no ve ninguno: un archivo sube privado y se comparte de a uno.',
  elegirCualesVe: 'Elegir cuáles ve',
  sinArchivos: 'Todavía no hay archivos de este trabajo.',
  fotosEImagenes: 'Fotos e imágenes',
  ver: (nombre: string): string => `Ver ${nombre}`,
  documentos: 'Documentos',
  borrarUno: (nombre: string): string => `Borrar «${nombre}»`,
  subir: 'Subir fotos o PDF',
  subiendo: (actual: number, total: number): string =>
    `Subiendo ${String(actual)} de ${String(total)}…`,
  recienSubidos: 'Recién subidos',
  borrar: 'Borrar',
  subidos: (cantidad: number): string =>
    cantidad === 1 ? 'Archivo subido.' : `Se subieron ${String(cantidad)} archivos.`,
  borraste: (nombre: string): string => `Borraste «${nombre}».`,
  deshacer: 'Deshacer',
} as const;
