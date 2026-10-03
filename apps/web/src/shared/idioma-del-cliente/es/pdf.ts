export const pdf = {
  titulo: {
    sinNumero: 'Presupuesto (borrador)',
    numero: (numero: string) => `Presupuesto ${numero}`,
    conRevision: (numero: string, revision: number) =>
      `Presupuesto ${numero} · Rev. ${String(revision)}`,
    enBorrador: (titulo: string) => `${titulo} (borrador)`,
  },
  archivo: {
    sinNumero: 'Presupuesto (borrador)',
    numero: (numero: string) => `Presupuesto ${numero}`,
    conRevision: (numero: string, revision: number) =>
      `Presupuesto ${numero} Rev ${String(revision)}`,
  },
  pagina: (titulo: string, pagina: number, total: number) =>
    `${titulo} · Página ${String(pagina)} de ${String(total)}`,
  palabrasClave: {
    presupuesto: 'Presupuesto',
    borrador: 'borrador',
  },
  marcaDeAgua: 'BORRADOR',
  datos: {
    cliente: 'Cliente',
    obra: 'Obra',
    trabajo: 'Trabajo',
  },
  rotulo: {
    validez: 'Validez',
    sinVencimiento: 'Sin venc.',
    dias: (dias: number) => `${String(dias)} días`,
  },
  valores: {
    relevamientoAbonado: 'Relevamiento técnico y diseño 3D ya abonado',
    senaAAbonar: 'Seña a abonar',
    cubierta: 'Cubierta',
    saldo: 'Saldo',
    elegiConLoAbonado: (monto: string) =>
      `La seña a abonar descuenta los ${monto} ya abonados por el relevamiento técnico y diseño 3D. Elegí la opción que prefieras y avisale al taller.`,
  },
  plazo: (dias: number) => `${String(dias)} días hábiles desde la seña.`,
  validez: {
    sinVencimiento: 'Sin vencimiento.',
    dias: (dias: number) => `${String(dias)} días desde que se manda.`,
    hasta: (fecha: string) => `Hasta el ${fecha}.`,
  },
  aceptado: {
    sinFecha: 'Aceptado',
    sinFechaConOpcion: (letra: string) => `Aceptado · Opción ${letra}`,
    el: (fecha: string) => `Aceptado el ${fecha}`,
    elConOpcion: (fecha: string, letra: string) => `Aceptado el ${fecha} · Opción ${letra}`,
  },
} as const;
