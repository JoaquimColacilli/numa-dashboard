export const atenderLaRespuesta = {
  titulo: 'La respuesta de tu cliente',
  aproboLaOpcion: (nombre: string, letra: string) => `${nombre} aprobó la opción ${letra}`,
  aproboElEstimativo: (nombre: string) => `${nombre} aprobó el estimativo`,
  aproboElPresupuesto: (nombre: string) => `${nombre} aprobó el presupuesto`,
  tuCliente: 'Tu cliente',
  respondioEl: (fecha: string) => `Lo aprobó desde su página el ${fecha}.`,
  propone: {
    manana: (dia: string) => `Propone el ${dia}, a la mañana, para medir.`,
    tarde: (dia: string) => `Propone el ${dia}, a la tarde, para medir.`,
    me_da_igual: (dia: string) => `Propone el ${dia} para medir. Le da igual el horario.`,
  },
  nota: 'Lo que te dejó',
  agendarElRelevamiento: 'Agendar el relevamiento',
  aprobarConLaSena: 'Aprobar con la seña',
  reactivar: 'Reactivar',
  escribirle: 'Escribirle',
  listo: 'Listo, ya lo hablé',
} as const;
