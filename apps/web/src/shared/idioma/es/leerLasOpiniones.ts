export const leerLasOpiniones = {
  yaNoEsta: 'Esta respuesta ya no está',
  yaNoEstaDetalle:
    'Puede que hayan borrado el trabajo desde otro lado. Lo que contestaron los demás sigue en Resultados.',
  unCliente: 'Un cliente',
  contestoEl: (dia: string): string => `Contestó el ${dia}`,
  abrirElTrabajo: 'Abrir el trabajo',
  escribirle: 'Escribirle',
} as const;
