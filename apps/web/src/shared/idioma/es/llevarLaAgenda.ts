export const llevarLaAgenda = {
  deshacer: 'Deshacer',
  marcada: 'Marcado como importante.',
  desmarcada: 'Le sacaste la marca.',
  anotado: (dia: string): string => `Anotado para el ${dia}.`,
  listo: (texto: string): string => `Listo: ${texto}.`,
  borraste: (texto: string): string => `Borraste «${texto}».`,
  movida: {
    entrega: (nombre: string, dia: string): string =>
      `${nombre}: al ${dia}. Le cambiaste la entrega estimada del proyecto.`,
    visita: (nombre: string, dia: string): string =>
      `${nombre}: al ${dia}. Le cambiaste el día de la visita.`,
    presupuesto: (nombre: string, dia: string): string =>
      `${nombre}: al ${dia}. Le cambiaste el plazo del presupuesto.`,
    seguimiento: (nombre: string, dia: string): string =>
      `${nombre}: al ${dia}. Le cambiaste el día en que le volvés a escribir.`,
  },
  pasoAl: (nombre: string, dia: string): string => `${nombre} pasó al ${dia}.`,
  errores: {
    faltaElTexto: 'Escribí qué hay que hacer.',
    largoMaximo: (maximo: number): string => `No puede pasar de ${String(maximo)} caracteres.`,
    faltaElDia: 'Elegí el día.',
  },
  hoja: {
    titulo: 'Anotar algo',
    queHayQueHacer: 'Qué hay que hacer',
    ejemplo: 'Comprar melamina, retirar el pulpo, pintar la cajonera…',
    queEs: 'Qué es',
    cuando: 'Cuándo',
    hoy: 'Hoy',
    manana: 'Mañana',
    elDiaElegido: 'El día elegido',
    otroDia: 'Otro día',
    hora: 'Hora',
    horaOpcional: 'Opcional: el día es lo que manda.',
    trabajo: 'Trabajo',
    sinTrabajo: 'Sin trabajo',
    opcional: 'Opcional.',
    marcarlo: 'Marcarlo como importante',
    comoElCirculo: 'Como el círculo del cuaderno: lo importante de la semana.',
    anotarlo: 'Anotarlo',
  },
} as const;
