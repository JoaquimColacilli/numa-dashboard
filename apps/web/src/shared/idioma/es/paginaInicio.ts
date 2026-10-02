import { elMueble } from '@maun/domain';

export const paginaInicio = {
  titulo: 'Inicio',
  agenda: 'Agenda',
  tuCuenta: 'Tu cuenta',
  tuCuentaConOpinionesNuevas: (nuevas: number) =>
    nuevas === 1 ? 'Tu cuenta. 1 opinión nueva' : `Tu cuenta. ${String(nuevas)} opiniones nuevas`,
  lista: (partes: readonly string[]) => {
    const ultima = partes.at(-1) ?? '';
    return partes.length < 2 ? ultima : `${partes.slice(0, -1).join(', ')} y ${ultima}`;
  },
  mensajeDelMes: {
    hogarEnNegativo: (monto: string) =>
      `El hogar está en negativo: ${monto}. Los gastos pasaron a lo que entró.`,
    sinMovimiento: (mes: string) => `${mes} todavía no tiene movimiento.`,
    compromisosYAhorrosCubiertos: (mes: string) =>
      `Los compromisos y los ahorros de ${mes} ya están cubiertos.`,
    faltanParaLlenar: (monto: string, mes: string) =>
      `Faltan ${monto} para llenar los compromisos y los ahorros de ${mes}.`,
    sueldoCubierto: (mes: string) => `El sueldo de ${mes} ya está cubierto.`,
    facturoYNoEntro: (monto: string, mes: string) =>
      `El taller facturó ${monto} en ${mes} y al hogar todavía no entró nada: el sueldo se transfiere cuando cobrás un trabajo.`,
    faltanParaElSueldo: (monto: string, mes: string) =>
      `Faltan ${monto} para cubrir el sueldo de ${mes}.`,
  },
  comparacion: {
    subio: (porcentaje: number, mes: string) => `+${String(porcentaje)}% vs. ${mes}`,
    bajo: (porcentaje: number, mes: string) => `−${String(porcentaje)}% vs. ${mes}`,
  },
  accesos: 'Accesos',
  entregaMasProxima: 'Entrega más próxima',
  sinEntregasProgramadas: 'Sin entregas programadas',
  comprometida: (cuando: string) => `${cuando}, comprometida`,
  pendienteDeCobro: 'Pendiente de cobro',
  proyectosEnCurso: (proyectos: number) => `${String(proyectos)} proyectos en curso`,
  diezmo: 'Diezmo',
  proyeccionDeCocos: 'Proyección de Cocos',
  cocosEnUnAnio: 'Cocos en un año',
  conLaTasaQueCargaste: 'con la tasa que cargaste, sin aportes nuevos',
  faltaParaLaMeta: 'falta para la meta',
  diaDelMes: (dia: number, dias: number) => `día ${String(dia)} de ${String(dias)}`,
  panorama: {
    titulo: 'Panorama',
    queEs: 'Qué es el panorama',
    ayuda: 'Dónde está la plata y para qué la podés usar.',
    paraPagar: 'Para pagar',
    nadaPendiente: 'nada pendiente',
    ahorros: 'Ahorros',
    todaviaSinAhorros: 'todavía sin ahorros',
    superavit: 'Superávit',
    enElTesoro: (tesoro: string) => `en ${tesoro}`,
    enElTesoroQueNoAlcanza: (tesoro: string) => `en ${tesoro}, que no alcanza`,
    insumos: 'Insumos de los trabajos',
    sinTrabajosEnCurso: 'sin trabajos en curso',
    deTrabajos: (trabajos: number) =>
      trabajos === 1 ? 'de un trabajo' : `de ${String(trabajos)} trabajos`,
    enTesoros: (tesoros: number) =>
      tesoros === 1 ? 'en un tesoro' : `en ${String(tesoros)} tesoros`,
    enDolares: 'En dólares',
  },
  laFila: {
    titulo: (mes: string) => `La fila de ${mes}`,
    queEs: 'Qué es la fila del mes',
    ayuda:
      'Así va el mes: cada cobro aparta las obligaciones, llena los compromisos y los ahorros en este orden, y lo que sobra se reparte. La raya fina marca el día de hoy.',
    verLaFila: 'Ver la fila',
    loQueSobra: 'Lo que sobra',
    tesoro: 'Tesoro',
    sinCobros: 'Todavía no hubo cobros este mes',
    ingresoEnCobros: (ingreso: string, cobros: number) =>
      cobros === 1
        ? `${ingreso} de ingreso en un cobro`
        : `${ingreso} de ingreso en ${String(cobros)} cobros`,
    regla: {
      cobrado: (porcentaje: string) => `${porcentaje}% sobre lo que cobrás`,
      ingreso: (porcentaje: string) => `${porcentaje}% sobre el ingreso`,
    },
    apartado: (monto: string) => `${monto} apartado`,
    aPagar: (monto: string) => `A pagar ${monto}`,
    alDia: 'Al día',
    sueldo: 'sueldo',
    costosFijos: 'costos fijos',
    hastaLaMeta: (modo: string) => `${modo} · hasta la meta`,
    paso: (numero: number, tesoro: string) => `Paso ${String(numero)}: ${tesoro}`,
    porCobro: (monto: string) => `${monto} por cobro`,
    deTope: (lleva: string, tope: string) => `${lleva} de ${tope}`,
    cubierto: 'Cubierto',
    esperaSuTurno: 'Espera su turno',
    llegoALaMeta: 'Llegó a la meta',
    recibioEsteMes: (monto: string) => `Recibió ${monto} este mes`,
    recibeEnCadaCobro: 'Recibe su monto en cada cobro',
    faltan: (monto: string) => `Faltan ${monto}`,
    sobra: {
      cuandoSeLlenan: {
        queda: {
          ambos: (tesoro: string, falta: string) =>
            `Cuando se llenan los compromisos y los ahorros fijos, lo que sobra queda en ${tesoro}: faltan ${falta}.`,
          compromisos: (tesoro: string, falta: string) =>
            `Cuando se llenan los compromisos, lo que sobra queda en ${tesoro}: faltan ${falta}.`,
          ahorros: (tesoro: string, falta: string) =>
            `Cuando se llenan los ahorros fijos, lo que sobra queda en ${tesoro}: faltan ${falta}.`,
        },
        va: {
          ambos: (tesoro: string, falta: string) =>
            `Cuando se llenan los compromisos y los ahorros fijos, lo que sobra va a ${tesoro}: faltan ${falta}.`,
          compromisos: (tesoro: string, falta: string) =>
            `Cuando se llenan los compromisos, lo que sobra va a ${tesoro}: faltan ${falta}.`,
          ahorros: (tesoro: string, falta: string) =>
            `Cuando se llenan los ahorros fijos, lo que sobra va a ${tesoro}: faltan ${falta}.`,
        },
      },
      deCadaCobro: {
        queda: (tesoro: string) => `Lo que sobra de cada cobro queda en ${tesoro}.`,
        va: (tesoro: string) => `Lo que sobra de cada cobro va a ${tesoro}.`,
      },
      yaLlenos: {
        queda: {
          ambos: (tesoro: string) =>
            `Los compromisos y los ahorros fijos ya están llenos: lo que sobra de cada cobro queda en ${tesoro}.`,
          compromisos: (tesoro: string) =>
            `Los compromisos ya están llenos: lo que sobra de cada cobro queda en ${tesoro}.`,
          ahorros: (tesoro: string) =>
            `Los ahorros fijos ya están llenos: lo que sobra de cada cobro queda en ${tesoro}.`,
        },
        va: {
          ambos: (tesoro: string) =>
            `Los compromisos y los ahorros fijos ya están llenos: lo que sobra de cada cobro va a ${tesoro}.`,
          compromisos: (tesoro: string) =>
            `Los compromisos ya están llenos: lo que sobra de cada cobro va a ${tesoro}.`,
          ahorros: (tesoro: string) =>
            `Los ahorros fijos ya están llenos: lo que sobra de cada cobro va a ${tesoro}.`,
        },
      },
      yaSeRepartieron: {
        queda: (repartido: string, lista: string, tesoro: string) =>
          `Ya se repartieron ${repartido}: ${lista}. El resto quedó en ${tesoro}.`,
        va: (repartido: string, lista: string, tesoro: string) =>
          `Ya se repartieron ${repartido}: ${lista}. El resto fue a ${tesoro}.`,
      },
      seReparteCuandoSeLlenan: {
        ambos: (falta: string) =>
          `Se reparte cuando se llenan los compromisos y los ahorros fijos: faltan ${falta}.`,
        compromisos: (falta: string) =>
          `Se reparte cuando se llenan los compromisos: faltan ${falta}.`,
        ahorros: (falta: string) =>
          `Se reparte cuando se llenan los ahorros fijos: faltan ${falta}.`,
      },
      elProximoCobroSeReparte: 'Lo que deje el próximo cobro se reparte.',
      yaLlenosYSeReparte: {
        ambos:
          'Los compromisos y los ahorros fijos ya están llenos: lo que deje el próximo cobro se reparte.',
        compromisos: 'Los compromisos ya están llenos: lo que deje el próximo cobro se reparte.',
        ahorros: 'Los ahorros fijos ya están llenos: lo que deje el próximo cobro se reparte.',
      },
      reparto: (lista: string) => `${lista}.`,
      parte: (tesoro: string, porcentaje: string) => `${tesoro} ${porcentaje}%`,
      parteHastaSuMeta: (tesoro: string, porcentaje: string) =>
        `${tesoro} ${porcentaje}% hasta su meta`,
      elResto: (tesoro: string) => `${tesoro} el resto`,
      recibio: (tesoro: string, monto: string) => `${tesoro} ${monto}`,
    },
    diasQueQuedan: (quedan: number) =>
      quedan === 0
        ? 'Hoy es el último día del mes.'
        : quedan === 1
          ? 'Queda un día del mes.'
          : `Quedan ${String(quedan)} días del mes.`,
    elProximoCobroLosLlena: 'El próximo cobro los llena primero, o cubrilos ahora con otro tesoro.',
    tesoroEnLaFrase: (tesoro: string) => {
      const [primera = '', segunda = ''] = tesoro;
      if (segunda !== segunda.toLowerCase()) return tesoro;
      return `${primera.toLowerCase()}${tesoro.slice(1)}`;
    },
    losCostosFijos: 'los costos fijos',
  },
  faltante: {
    faltaPara: (tesoro: string) => `Falta para ${tesoro}`,
    elegirDeQueTesoroSacar: 'Elegir de qué tesoro sacar',
  },
  perfil: {
    nadaAgendado: 'Nada agendado por ahora',
    hoy: 'Hoy',
    manana: 'Mañana',
    proximo: (cuando: string, evento: string) => `${cuando}: ${evento}`,
    loQueNoEntraEnLaBarra: 'Lo que no entra en la barra',
    opiniones: 'Opiniones',
    loQueContestaron: 'Lo que contestaron tus clientes',
    nuevas: (nuevas: number) => (nuevas === 1 ? '1 nueva' : `${String(nuevas)} nuevas`),
    opino: (cliente: string) => `${cliente} opinó`,
    opinaron: (clientes: string) => `${clientes} opinaron`,
    yMas: (mas: number) => `${String(mas)} más`,
    tesoros: 'Tesoros',
    comoSeReparte: 'Cómo se reparte cada cobro',
    diezmo: 'Diezmo',
    agenda: 'Agenda',
    laApp: 'La app',
    ajustes: 'Ajustes',
    tuTaller: 'Tu taller, cómo te pagan y la vidriera',
  },
  hoyEnLaAgenda: {
    titulo: 'Hoy en la agenda',
    verLaAgenda: 'Ver la agenda',
    nadaParaHoy: 'Nada agendado para hoy.',
    yMas: (mas: number) => `y ${String(mas)} más`,
  },
  metas: {
    titulo: 'Metas',
    diezmoPagado: 'Diezmo pagado',
    deLaMeta: (saldo: string, meta: string) => `${saldo} de ${meta}`,
  },
  portada: {
    arrancaAca: 'El taller arranca acá',
    cargaElSueldo:
      'Cargá el sueldo que te asignás y tus costos fijos para que Inicio te cuente cuánto te falta cada mes. Después, el primer proyecto.',
    cargarSueldoYCostosFijos: 'Cargar sueldo y costos fijos',
    cargarElPrimerProyecto: 'Cargar el primer proyecto',
    elCorte: (mes: string) => `El corte de ${mes}`,
  },
  respuestas: {
    loQueContestaron: 'Lo que contestaron de la entrega',
    laEntregaDeSu: (trabajo: string) => `La entrega de su ${elMueble(trabajo)}`,
    tePasoSusDias: (cliente: string) => `${cliente} te pasó sus días`,
    tuClienteTePasoSusDias: 'Tu cliente te pasó sus días',
    aceptoElDiaQueLePropusiste: (cliente: string) => `${cliente} aceptó el día que le propusiste`,
    tuClienteAceptoElDiaQueLePropusiste: 'Tu cliente aceptó el día que le propusiste',
    aceptoEl: (cliente: string, fecha: string) => `${cliente} aceptó el ${fecha}`,
    tuClienteAceptoEl: (fecha: string) => `Tu cliente aceptó el ${fecha}`,
  },
  ultimaOpinion: {
    opinoDeSu: (cliente: string, trabajo: string) => `${cliente} opinó de su ${elMueble(trabajo)}`,
    unClienteOpinoDeSu: (trabajo: string) => `Un cliente opinó de su ${elMueble(trabajo)}`,
    comentario: (comentario: string) => `«${comentario}»`,
  },
  tarjetas: {
    titulo: 'Tesoros',
    gastoMasDeLoQueEntro: 'gastó más de lo que entró',
    enNegativo: 'en negativo',
    tipos: (tipos: readonly string[]) => tipos.join(' y '),
    pusoEnLosTrabajos: (monto: string) => `puso ${monto} en los trabajos`,
    noAlcanzaParaLosInsumos: (monto: string) => `no alcanza para ${monto} de insumos`,
    sonInsumos: (monto: string) => `${monto} son insumos`,
    deLaMeta: (porcentaje: number) => `${String(porcentaje)}% de la meta`,
  },
} as const;
