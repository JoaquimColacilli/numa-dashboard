export const archivo = {
  sinSenal:
    'Sin señal no se pueden subir archivos: se suben en el momento y no quedan anotados para después. Probá cuando vuelva la señal.',
  losVideosNoEntran:
    'Los videos no se pueden subir: uno del celular pesa entre 50 y 200 MB, y el espacio para los archivos de todo el taller es de 1 GB. Subí fotos o capturas del video, y los planos y presupuestos en PDF.',
  queSeSubeAUnTrabajo: 'fotos, capturas y PDF',
  noSePuedeSubir: (nombre: string, queSeSube: string): string =>
    `«${nombre}» no se puede subir: se pueden subir ${queSeSube}.`,
  pdfMuyPesado: (nombre: string, peso: string): string =>
    `«${nombre}» pesa ${peso}, y un PDF puede pesar hasta 10 MB. Si es un escaneo, guardalo con menos calidad y probá de nuevo.`,
  sinNombre: 'Archivo',
  navegadorSinLienzo: 'Este navegador no puede preparar la imagen.',
  noSePudoPreparar: 'No se pudo preparar la imagen. Probá de nuevo.',
  conElNombre: (nombre: string, motivo: string): string => `«${nombre}»: ${motivo}`,
  noSeSubio: (nombre: string, motivo: string): string => `«${nombre}» no se pudo subir. ${motivo}`,
} as const;
