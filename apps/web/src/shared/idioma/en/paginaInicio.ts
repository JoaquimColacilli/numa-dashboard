import { ETIQUETAS_DE_IDIOMA } from '@maun/domain';

import { formatearPorcentaje } from '@/shared/lib';

import type { Mensajes } from '../es';
import { plural } from './plural';

const LISTA = new Intl.ListFormat(ETIQUETAS_DE_IDIOMA.en, { type: 'conjunction' });

function porciento(porcentaje: number): string {
  return formatearPorcentaje(porcentaje * 100, 'en');
}

export const paginaInicio = {
  titulo: 'Home',
  agenda: 'Calendar',
  tuCuenta: 'Your account',
  tuCuentaConOpinionesNuevas: (nuevas) =>
    plural(nuevas, {
      one: 'Your account. # new feedback response',
      other: 'Your account. # new feedback responses',
    }),
  lista: (partes) => LISTA.format(partes),
  mensajeDelMes: {
    hogarEnNegativo: (monto) =>
      `The household is in the red: ${monto}. Spending went over what came in.`,
    sinMovimiento: (mes) => `${mes} has no transactions yet.`,
    compromisosYAhorrosCubiertos: (mes) => `Bills and savings for ${mes} are covered.`,
    faltanParaLlenar: (monto, mes) =>
      `You still need ${monto} to fill bills and savings for ${mes}.`,
    sueldoCubierto: (mes) => `Owner's pay for ${mes} is covered.`,
    facturoYNoEntro: (monto, mes) =>
      `The shop billed ${monto} in ${mes} and nothing has gone to the household yet: owner's pay moves over when you get paid for a job.`,
    faltanParaElSueldo: (monto, mes) => `You still need ${monto} to cover owner's pay for ${mes}.`,
  },
  comparacion: {
    subio: (porcentaje, mes) => `+${porciento(porcentaje)}% vs. ${mes}`,
    bajo: (porcentaje, mes) => `−${porciento(porcentaje)}% vs. ${mes}`,
  },
  accesos: 'Shortcuts',
  entregaMasProxima: 'Next delivery',
  sinEntregasProgramadas: 'No deliveries scheduled',
  comprometida: (cuando) => `${cuando}, confirmed`,
  pendienteDeCobro: 'Awaiting payment',
  proyectosEnCurso: (proyectos) =>
    plural(proyectos, {
      '=0': 'No jobs in progress',
      one: '# job in progress',
      other: '# jobs in progress',
    }),
  diezmo: 'Tithe',
  proyeccionDeCocos: 'Cocos projection',
  cocosEnUnAnio: 'Cocos in a year',
  conLaTasaQueCargaste: 'at the rate you entered, with no new contributions',
  faltaParaLaMeta: 'still needed for the goal',
  diaDelMes: (dia, dias) => `day ${String(dia)} of ${String(dias)}`,
  panorama: {
    titulo: 'Overview',
    queEs: 'What the overview is',
    ayuda: 'Where your money is and what you can use it for.',
    paraPagar: 'To pay',
    nadaPendiente: 'nothing pending',
    ahorros: 'Savings',
    todaviaSinAhorros: 'no savings yet',
    superavit: 'Surplus',
    enElTesoro: (tesoro) => `in ${tesoro}`,
    enElTesoroQueNoAlcanza: (tesoro) => `in ${tesoro}, which isn't enough`,
    insumos: 'Job supplies',
    sinTrabajosEnCurso: 'no jobs in progress',
    deTrabajos: (trabajos) => plural(trabajos, { one: 'from one job', other: 'from # jobs' }),
    enTesoros: (tesoros) => plural(tesoros, { one: 'in one bucket', other: 'in # buckets' }),
    enDolares: 'In dollars',
  },
  laFila: {
    titulo: (mes) => `${mes} waterfall`,
    queEs: "What the month's waterfall is",
    ayuda:
      "Here's how the month is going: each payment sets aside the obligations, fills the bills and savings in this order, and what's left gets split. The thin line marks today.",
    verLaFila: 'View the waterfall',
    loQueSobra: "What's left",
    tesoro: 'Bucket',
    sinCobros: 'No payments yet this month',
    ingresoEnCobros: (ingreso, cobros) =>
      plural(cobros, {
        one: `${ingreso} in income from one payment`,
        other: `${ingreso} in income from # payments`,
      }),
    regla: {
      cobrado: (porcentaje) => `${porcentaje}% of what you collect`,
      ingreso: (porcentaje) => `${porcentaje}% of income`,
    },
    apartado: (monto) => `${monto} set aside`,
    aPagar: (monto) => `To pay: ${monto}`,
    alDia: 'Up to date',
    sueldo: "owner's pay",
    costosFijos: 'fixed costs',
    hastaLaMeta: (modo) => `${modo} · up to the goal`,
    paso: (numero, tesoro) => `Step ${String(numero)}: ${tesoro}`,
    porCobro: (monto) => `${monto} per payment`,
    deTope: (lleva, tope) => `${lleva} of ${tope}`,
    cubierto: 'Covered',
    esperaSuTurno: 'Waiting its turn',
    llegoALaMeta: 'Reached its goal',
    recibioEsteMes: (monto) => `Got ${monto} this month`,
    recibeEnCadaCobro: 'Gets its amount with each payment',
    faltan: (monto) => `Still needs ${monto}`,
    sobra: {
      cuandoSeLlenan: {
        queda: {
          ambos: (tesoro, falta) =>
            `Once bills and fixed savings are full, what's left stays in ${tesoro}: you still need ${falta}.`,
          compromisos: (tesoro, falta) =>
            `Once bills are full, what's left stays in ${tesoro}: you still need ${falta}.`,
          ahorros: (tesoro, falta) =>
            `Once fixed savings are full, what's left stays in ${tesoro}: you still need ${falta}.`,
        },
        va: {
          ambos: (tesoro, falta) =>
            `Once bills and fixed savings are full, what's left goes to ${tesoro}: you still need ${falta}.`,
          compromisos: (tesoro, falta) =>
            `Once bills are full, what's left goes to ${tesoro}: you still need ${falta}.`,
          ahorros: (tesoro, falta) =>
            `Once fixed savings are full, what's left goes to ${tesoro}: you still need ${falta}.`,
        },
      },
      deCadaCobro: {
        queda: (tesoro) => `What's left from each payment stays in ${tesoro}.`,
        va: (tesoro) => `What's left from each payment goes to ${tesoro}.`,
      },
      yaLlenos: {
        queda: {
          ambos: (tesoro) =>
            `Bills and fixed savings are full: what's left from each payment stays in ${tesoro}.`,
          compromisos: (tesoro) =>
            `Bills are full: what's left from each payment stays in ${tesoro}.`,
          ahorros: (tesoro) =>
            `Fixed savings are full: what's left from each payment stays in ${tesoro}.`,
        },
        va: {
          ambos: (tesoro) =>
            `Bills and fixed savings are full: what's left from each payment goes to ${tesoro}.`,
          compromisos: (tesoro) =>
            `Bills are full: what's left from each payment goes to ${tesoro}.`,
          ahorros: (tesoro) =>
            `Fixed savings are full: what's left from each payment goes to ${tesoro}.`,
        },
      },
      yaSeRepartieron: {
        queda: (repartido, lista, tesoro) =>
          `${repartido} has already been split: ${lista}. The rest stayed in ${tesoro}.`,
        va: (repartido, lista, tesoro) =>
          `${repartido} has already been split: ${lista}. The rest went to ${tesoro}.`,
      },
      seReparteCuandoSeLlenan: {
        ambos: (falta) =>
          `It's split once bills and fixed savings are full: you still need ${falta}.`,
        compromisos: (falta) => `It's split once bills are full: you still need ${falta}.`,
        ahorros: (falta) => `It's split once fixed savings are full: you still need ${falta}.`,
      },
      elProximoCobroSeReparte: 'Whatever the next payment leaves gets split.',
      yaLlenosYSeReparte: {
        ambos: 'Bills and fixed savings are full: whatever the next payment leaves gets split.',
        compromisos: 'Bills are full: whatever the next payment leaves gets split.',
        ahorros: 'Fixed savings are full: whatever the next payment leaves gets split.',
      },
      reparto: (lista) => `${lista}.`,
      parte: (tesoro, porcentaje) => `${tesoro} ${porcentaje}%`,
      parteHastaSuMeta: (tesoro, porcentaje) => `${tesoro} ${porcentaje}% up to its goal`,
      elResto: (tesoro) => `the rest to ${tesoro}`,
      recibio: (tesoro, monto) => `${tesoro} ${monto}`,
    },
    diasQueQuedan: (quedan) =>
      plural(quedan, {
        '=0': "Today's the last day of the month.",
        one: "There's one day left in the month.",
        other: 'There are # days left in the month.',
      }),
    elProximoCobroLosLlena:
      'The next payment fills them first, or you can cover them now from another bucket.',
    tesoroEnLaFrase: (tesoro) => tesoro,
    losCostosFijos: 'fixed costs',
  },
  faltante: {
    faltaPara: (tesoro) => `Still needed for ${tesoro}`,
    elegirDeQueTesoroSacar: 'Choose which bucket to take it from',
  },
  perfil: {
    nadaAgendado: 'Nothing scheduled for now',
    hoy: 'Today',
    manana: 'Tomorrow',
    proximo: (cuando, evento) => `${cuando}: ${evento}`,
    loQueNoEntraEnLaBarra: "What doesn't fit in the bar",
    opiniones: 'Feedback',
    loQueContestaron: 'What your clients said',
    nuevas: (nuevas) => plural(nuevas, { other: '# new' }),
    opino: (cliente) => `${cliente} left feedback`,
    opinaron: (clientes) => `${clientes} left feedback`,
    yMas: (mas) => plural(mas, { one: '# other', other: '# others' }),
    estadisticas: 'Stats',
    comoVieneElTaller: 'How the shop is doing',
    tesoros: 'Buckets',
    comoSeReparte: 'How each payment is split',
    diezmo: 'Tithe',
    agenda: 'Calendar',
    laApp: 'The app',
    ajustes: 'Settings',
    tuTaller: 'Your shop, how clients pay you, and your showcase',
  },
  estadisticas: {
    comoVieneElTaller: 'How the shop is doing',
    verLasEstadisticas: 'See your stats',
  },
  hoyEnLaAgenda: {
    titulo: 'Today on the calendar',
    verLaAgenda: 'View calendar',
    nadaParaHoy: 'Nothing scheduled for today.',
    yMas: (mas) => plural(mas, { other: 'and # more' }),
  },
  metas: {
    titulo: 'Goals',
    diezmoPagado: 'Tithe paid',
    deLaMeta: (saldo, meta) => `${saldo} of ${meta}`,
  },
  portada: {
    arrancaAca: 'Your shop starts here',
    cargaElSueldo:
      "Add the owner's pay you set for yourself and your fixed costs so Home can tell you how much you still need each month. Then, your first job.",
    cargarSueldoYCostosFijos: "Add owner's pay and fixed costs",
    cargarElPrimerProyecto: 'Add your first job',
    elCorte: (mes) => `${mes}'s cut`,
  },
  respuestas: {
    loQueContestaron: 'Delivery replies',
    laEntregaDeSu: (trabajo) => `Delivery of “${trabajo}”`,
    tePasoSusDias: (cliente) => `${cliente} sent the days that work for them`,
    tuClienteTePasoSusDias: 'Your client sent the days that work for them',
    aceptoElDiaQueLePropusiste: (cliente) => `${cliente} accepted the day you suggested`,
    tuClienteAceptoElDiaQueLePropusiste: 'Your client accepted the day you suggested',
    aceptoEl: (cliente, fecha) => `${cliente} accepted ${fecha}`,
    tuClienteAceptoEl: (fecha) => `Your client accepted ${fecha}`,
  },
  ultimaOpinion: {
    opinoDeSu: (cliente, trabajo) => `${cliente} left feedback on “${trabajo}”`,
    unClienteOpinoDeSu: (trabajo) => `A client left feedback on “${trabajo}”`,
    comentario: (comentario) => `“${comentario}”`,
  },
  tarjetas: {
    titulo: 'Buckets',
    gastoMasDeLoQueEntro: 'spent more than came in',
    enNegativo: 'in the red',
    tipos: (tipos) => LISTA.format(tipos),
    pusoEnLosTrabajos: (monto) => `put ${monto} into jobs`,
    noAlcanzaParaLosInsumos: (monto) => `not enough for ${monto} in supplies`,
    sonInsumos: (monto) => `${monto} is for supplies`,
    deLaMeta: (porcentaje) => `${porciento(porcentaje)}% of the goal`,
  },
} satisfies Mensajes['paginaInicio'];
