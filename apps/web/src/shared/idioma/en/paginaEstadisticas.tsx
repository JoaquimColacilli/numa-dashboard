import { fechaConAnio, fechaEnUnaFrase } from '@/shared/lib';

import type { Mensajes } from '../es';
import type { FaltanParaLosTiempos } from '../es/paginaEstadisticas';
import { plural } from './plural';

function jobs(cantidad: number): string {
  return plural(cantidad, { one: '# job', other: '# jobs' });
}

function inquiries(cantidad: number): string {
  return plural(cantidad, { one: '# inquiry', other: '# inquiries' });
}

function theDay(fecha: string): string {
  return fechaEnUnaFrase(fecha, fecha, 'en');
}

const WHAT_THE_TIMES_NEED: Readonly<Record<FaltanParaLosTiempos, string>> = {
  ambos: 'how long you take to send them and how long clients take to answer',
  mandarlos: 'how long you take to send them',
  contesten: 'how long clients take to answer',
};

function casesForTheTimes(cual: FaltanParaLosTiempos, cantidad: number): string {
  return cual === 'contesten'
    ? plural(cantidad, { one: '# answer', other: '# answers' })
    : plural(cantidad, { one: '# quote', other: '# quotes' });
}

export const paginaEstadisticas = {
  titulo: 'Stats',
  bajada: 'How the shop is doing, from what you record in NUMA.',
  queEs: (que) => `What this is: ${que}`,
  vacio: {
    titulo: 'Nothing to show yet',
    detalle: "Once you get paid for your first job, you'll see how the shop is doing here.",
  },
  periodo: {
    leyenda: 'Period',
    largos: { tres: '3 months', seis: '6 months', doce: '12 months', todo: 'All' },
    anteriores: (meses) => `Previous ${String(meses)} months`,
    siguientes: (meses) => `Next ${String(meses)} months`,
    entre: (desde, hasta) => `${desde} – ${hasta}`,
    mesYAnio: (mes, anio) => `${mes} ${anio}`,
    mesDeOtroAnio: (mes, anio) => `${mes} ${anio}`,
    desde: (cuando) => `Since ${cuando}`,
    contra: (rango) => `vs. ${rango}`,
    contraHastaElMismoDia: (rango) => `vs. ${rango}, up to the same day`,
    enLaFrase: (desde, hasta) => `between ${desde} and ${hasta}`,
    desdeEnLaFrase: (cuando) => `since ${cuando}`,
    trimestre: (numero) => `Q${String(numero)}`,
  },
  meses: {
    m01: 'Jan',
    m02: 'Feb',
    m03: 'Mar',
    m04: 'Apr',
    m05: 'May',
    m06: 'Jun',
    m07: 'Jul',
    m08: 'Aug',
    m09: 'Sep',
    m10: 'Oct',
    m11: 'Nov',
    m12: 'Dec',
  },
  probaCon: {
    tres: 'Try 6 or 12 months.',
    seis: 'Try 12 months.',
    doce: 'Try All.',
  },
  ayudas: {
    dejaron: (hasta) =>
      `What you collected on each job minus what you spent on it, for the jobs you finished collecting in these months. It's the income from the waterfall, the same you see month by month on Home, and it includes the deposit you kept from a lost job. To compare months, it brings them to today's pesos with INDEC inflation data, which goes up to ${hasta}.`,
    dejaronConElIndiceViejo: (hasta) =>
      `What you collected on each job minus what you spent on it, for the jobs you finished collecting in these months. It's the income from the waterfall, the same you see month by month on Home, and it includes the deposit you kept from a lost job. The INDEC inflation data in this version goes up to ${hasta} and the last few months are missing, so each month stays in its own pesos.`,
    gastos:
      "Everything that left Maun as an expense: job expenses, by the category you chose, and shop expenses, by the transaction's category. What you pay from other buckets, like the bills in the waterfall, is in Finances.",
    loQueMasUsas:
      "How many jobs you listed each item on under “What's needed.” It counts times, not money or quantities, and it groups names that only differ in capitals or accents.",
    entregas:
      "Calendar days from when you started until you delivered. Half your jobs took less than that and half took more, so one job that dragged on doesn't move it. On time means on the confirmed delivery date or earlier. Jobs from the old system don't have a delivery date.",
    consultas: (desde) =>
      `The inquiries that came in during these months and where they stand today. Jobs you approved directly also count as quotes. NUMA has recorded the stages since ${fechaConAnio(desde, 'en')}.`,
    opiniones:
      "The surveys you sent in these months and what clients answered. The survey carries your name and the client's: it isn't anonymous, so scores tend to run high.",
    viene:
      "The jobs in progress, with the days since you started, and what you're owed on what you've already delivered (Home also adds what's in progress). How long you usually take comes from your deliveries over the last 12 months.",
    pesosDeHoy:
      "Amounts from other months brought to today's prices with INDEC inflation data, so you can compare them. The last two months stay as collected, because INDEC hasn't published their inflation yet.",
  },
  resumen: {
    loQueTeDejaron: 'What your jobs left you',
    mas: (porcentaje, rango) => `${porcentaje}% more than in ${rango}`,
    menos: (porcentaje, rango) => `${porcentaje}% less than in ${rango}`,
    igual: (rango) => `Same as in ${rango}`,
    contandoLaInflacion: 'counting inflation',
    enPesosDeCadaMes: "in each month's pesos",
    teDejaron: (rango, monto, cantidad) =>
      `In ${rango} your jobs left you ${monto}, from ${jobs(cantidad)}`,
    conCasosVas: (cantidad) =>
      `With ${jobs(cantidad)} in each period, you'll see how much it changed`,
    sinCobrarAntes: (rango) => `You didn't get paid for any job in ${rango}`,
    deCada100: (Fuerte, cien, quedaron) => (
      <>
        Of every <Fuerte>{cien}</Fuerte> you collected, you kept <Fuerte>{quedaron}</Fuerte>.
      </>
    ),
    seComieron: 'Expenses ate up what you collected in these months.',
    elPeriodo: 'the period',
    base: (cobrados, perdidos, enDolares) => {
      const deposits =
        perdidos === 0
          ? null
          : plural(perdidos, {
              one: 'the deposit from # lost job',
              other: 'the deposits from # lost jobs',
            });
      const dollars = enDolares === 0 ? '' : `, ${String(enDolares)} in dollars counted in pesos`;
      if (cobrados === 0) {
        return deposits === null
          ? ''
          : `${deposits.charAt(0).toUpperCase()}${deposits.slice(1)}${dollars}`;
      }
      const paid = plural(cobrados, { one: '# job paid', other: '# jobs paid' });
      return `${paid}${deposits === null ? '' : ` and ${deposits}`}${dollars}`;
    },
  },
  tarjetas: {
    nombre: 'The numbers for the period',
    sinDato: '—',
    kDeN: (Chico, cuantos, deCuantos) => (
      <>
        {String(cuantos)} <Chico>of {String(deCuantos)}</Chico>
      </>
    ),
    porcentaje: (porcentaje) => `${porcentaje}%`,
    gastaste: {
      etiqueta: 'You spent',
      debajo: 'on jobs and the shop',
      vacio: 'No expenses in these months',
    },
    entrega: {
      etiqueta: 'Delivery time',
      dias: (Chico, numero, cantidad) => (
        <>
          {numero} <Chico>{cantidad === 1 ? 'day' : 'days'}</Chico>
        </>
      ),
      entre: (Chico, desde, hasta) => (
        <>
          {desde} to {hasta} <Chico>days</Chico>
        </>
      ),
      aTiempo: (aTiempo, total) => `${String(aTiempo)} of ${String(total)} on time`,
      aTiempoConPorcentaje: (porcentaje, aTiempo, total) =>
        `${porcentaje}% on time (${String(aTiempo)} of ${String(total)})`,
      deAUna: (entregas) =>
        plural(entregas, { one: '1 delivery', other: '# deliveries, one by one' }),
      sinPromesas: 'no promised date',
      vacio: 'No deliveries in these months',
    },
    aprobaron: {
      etiqueta: 'Approved',
      debajo: (esperan) =>
        esperan === 0
          ? 'quotes'
          : plural(esperan, { one: 'quotes · 1 waiting', other: 'quotes · # waiting' }),
      debajoConCuenta: (cuantos, deCuantos, esperan) =>
        esperan === 0
          ? `${String(cuantos)} of ${String(deCuantos)} quotes`
          : `${String(cuantos)} of ${String(deCuantos)} quotes · ${String(esperan)} waiting`,
      vacio: 'No quotes in these months',
    },
    conformes: {
      etiqueta: 'Satisfied',
      debajo: 'clients who answered',
      debajoConCuenta: (cuantos, deCuantos) =>
        `${String(cuantos)} of ${String(deCuantos)} clients who answered`,
      vacio: 'No answers in these months',
    },
  },
  secciones: {
    dejaron: 'How much did my jobs leave me?',
    gastos: 'Where is my money going?',
    entregas: 'Am I on time?',
    consultas: 'How many of my quotes get approved?',
    opiniones: 'What do my clients think?',
    viene: "What's coming up?",
  },
  dejaron: {
    frase: (Fuerte, cobrados, total) => (
      <>
        You got paid for <Fuerte>{jobs(cobrados)}</Fuerte> and they left you{' '}
        <Fuerte>{total}</Fuerte>.
      </>
    ),
    fraseSoloSenas: (Fuerte, perdidos, total) => (
      <>
        You didn't get paid for any job, and you kept <Fuerte>{total}</Fuerte> from the{' '}
        {plural(perdidos, { one: 'deposit of 1 lost job', other: 'deposits of # lost jobs' })}.
      </>
    ),
    mejorMes: (Fuerte, mes, monto, cantidad) => (
      <>
        {mes} was your best month: <Fuerte>{monto}</Fuerte> from {jobs(cantidad)}.
      </>
    ),
    mejorTrimestre: (Fuerte, trimestre, monto, cantidad) => (
      <>
        Your best quarter was {trimestre}: <Fuerte>{monto}</Fuerte> from {jobs(cantidad)}.
      </>
    ),
    mejorAnio: (Fuerte, anio, monto, cantidad) => (
      <>
        {anio} was your best year: <Fuerte>{monto}</Fuerte> from {jobs(cantidad)}.
      </>
    ),
    subtitulo:
      "By the month you finished collecting each job. Earlier months are brought to today's pesos.",
    subtituloEnPesosDeCadaMes:
      "By the month you finished collecting each job, in each month's pesos.",
    figura: 'What your jobs left you, month by month',
    tocaUnMes: 'Tap a month to see what it left you and which jobs they were.',
    tocaUnaColumna: 'Tap a column to see what it left you and which jobs they were.',
    lectura: (Fuerte, monto, cuando, cantidad) => (
      <>
        <Fuerte>{monto}</Fuerte> in {cuando} · {jobs(cantidad)}
      </>
    ),
    lecturaConHoy: (Fuerte, deHoy, cuando, comoSeCobro, cantidad) => (
      <>
        <Fuerte>{deHoy}</Fuerte> in {cuando}, in today's pesos · {comoSeCobro} as collected ·{' '}
        {jobs(cantidad)}
      </>
    ),
    lecturaSinTrabajos: (cuando) => `You didn't get paid for any job in ${cuando}.`,
    verLosDe: (cantidad, cuando) =>
      cantidad === 1
        ? `See the job from ${cuando}`
        : `See the ${String(cantidad)} jobs from ${cuando}`,
    columna: (cuando, monto, cantidad) => `${cuando}: ${monto} in today's pesos, ${jobs(cantidad)}`,
    columnaEnPesosDeCadaMes: (cuando, monto, cantidad) => `${cuando}: ${monto}, ${jobs(cantidad)}`,
    columnaVacia: (cuando) => `${cuando}: no jobs paid`,
    sinRegistro: 'no records',
    hastaHoy: (cuando) => `* ${cuando}, up to today.`,
    trabajosDe: (cuando) => `The jobs from ${cuando}`,
    trabajosDelPeriodo: 'The jobs in the period',
    cobradoEl: (dia) => `paid on ${dia}`,
    senaDeUnPerdido: 'deposit from a lost job',
    cuenta: (cobrado, gastos) => `${cobrado} − ${gastos}`,
    totalDe: (cuando) => `Total for ${cuando}`,
    totalDelPeriodo: 'Total for the period',
    verLosDelPeriodo: (cantidad) =>
      cantidad === 1 ? 'See the job' : `See the ${String(cantidad)} jobs`,
    esconderLaLista: 'Hide the list',
    vacio: (rango) => `You didn't get paid for any job in ${rango}.`,
    vacioDeTodo: "You haven't been paid for any job yet.",
    estimado: {
      titulo: 'What you estimated and what you kept',
      deCadaCien: (cien) => `per ${cien} of each job`,
      loQueEstimaste: 'what you estimated',
      loQueTeQuedo: 'what you kept',
      descripcion: (titulo, estimado, real, cien) =>
        `${titulo}: you estimated ${estimado} per ${cien} and kept ${real}`,
      verTodos: (cantidad) => `See the ${String(cantidad)} jobs`,
      verMenos: 'See less',
      sinCostos:
        "Once you add a job's estimated costs, you'll see here what you kept against what you estimated.",
    },
    tabla: {
      titulo: {
        mes: 'What your jobs left you, by month.',
        trimestre: 'What your jobs left you, by quarter.',
        anio: 'What your jobs left you, by year.',
      },
      enNegrita: 'The chosen period is in bold.',
      cuando: { mes: 'Month', trimestre: 'Quarter', anio: 'Year' },
      trabajos: 'Jobs',
      comoSeCobro: 'As collected',
      enPesosDeHoy: "In today's pesos",
      hastaHoy: (cuando) => `${cuando} (up to today)`,
    },
  },
  gastos: {
    frase: (Fuerte, cuando, total, enLosTrabajos, enElTaller) => (
      <>
        {cuando} you spent <Fuerte>{total}</Fuerte>: <Fuerte>{enLosTrabajos}</Fuerte> on jobs and{' '}
        <Fuerte>{enElTaller}</Fuerte> on the shop.
      </>
    ),
    fraseSoloTrabajos: (Fuerte, cuando, total) => (
      <>
        {cuando} you spent <Fuerte>{total}</Fuerte>, all on jobs.
      </>
    ),
    fraseSoloTaller: (Fuerte, cuando, total) => (
      <>
        {cuando} you spent <Fuerte>{total}</Fuerte>, all on the shop.
      </>
    ),
    subtitulo:
      'By the day of each expense. Job expenses go by the category you chose when you added them.',
    figura: 'What you spent, by category',
    enLosTrabajos: 'On jobs',
    enElTaller: 'On the shop',
    sinCategoria: 'Uncategorized',
    falta: (monto) =>
      `${monto} are uncategorized expenses. From now on, when you add an expense to a job, you choose whether it was wood, hardware, freight, a helper or other.`,
    loQueMasUsas: 'What you use most',
    enCuantosTrabajos: "how many jobs you listed it on under “What's needed”",
    materiales: 'Materials',
    herrajes: 'Hardware',
    enTrabajos: (Chico, cantidad) => (
      <>
        {String(cantidad)} <Chico>{cantidad === 1 ? 'job' : 'jobs'}</Chico>
      </>
    ),
    yMas: (cantidad) => `and ${String(cantidad)} more`,
    sinMateriales: 'No materials in these months.',
    sinHerrajes: 'No hardware in these months.',
    sinNadaAnotado:
      "Once you list materials and hardware under “What's needed” on your jobs, you'll see here which ones you use most.",
    tabla: {
      titulo: 'What you spent, by category',
      categoria: 'Category',
      monto: 'Amount',
      deCadaCien: (cien) => `Per ${cien} spent`,
      enLosTrabajos: (categoria) => `${categoria}, on jobs`,
      enElTaller: (categoria) => `${categoria}, on the shop`,
    },
    irAFinanzas: 'See the expenses in Finances',
    vacio: (rango) => `You didn't record any expenses in ${rango}.`,
    vacioDeTodo: "You haven't recorded any expenses yet.",
  },
  entregas: {
    frase: (Fuerte, aTiempo, conFecha, tardas) => (
      <>
        You delivered{' '}
        <Fuerte>
          {String(aTiempo)} of {String(conFecha)}
        </Fuerte>{' '}
        jobs on the day you promised or earlier. You take <Fuerte>{tardas}</Fuerte>: half your jobs
        take less.
      </>
    ),
    fraseConPorcentaje: (Fuerte, aTiempo, conFecha, porcentaje, tardas) => (
      <>
        You delivered{' '}
        <Fuerte>
          {String(aTiempo)} of {String(conFecha)}
        </Fuerte>{' '}
        jobs ({porcentaje}%) on the day you promised or earlier. You take <Fuerte>{tardas}</Fuerte>:
        half your jobs take less.
      </>
    ),
    fraseSinPromesas: (Fuerte, tardas) => (
      <>
        You take <Fuerte>{tardas}</Fuerte>: half your jobs take less.
      </>
    ),
    fraseConPocos: (Fuerte, cantidad, tardaste, faltan) => (
      <>
        You delivered <Fuerte>{jobs(cantidad)}</Fuerte>: they took {tardaste}. With{' '}
        {plural(faltan, { one: '1 more delivery', other: '# more deliveries' })} you'll see how long
        you usually take.
      </>
    ),
    subtitulo: (cantidad, cuando) =>
      cantidad === 1
        ? `The job you delivered ${cuando}, from when you started until you delivered it, in calendar days.`
        : `The ${String(cantidad)} jobs you delivered ${cuando}, from when you started until you delivered them, in calendar days.`,
    subtituloSinEntregas: 'From when you started until you delivered, in calendar days.',
    aTiempo: 'on time',
    tarde: 'late',
    sinFecha: 'no promised date',
    figura: 'How many days each job took',
    mediana: (dias) => `half, in under ${dias}`,
    cota: (desde, hasta) => `${desde} to ${hasta} days`,
    diasCortos: (dias) => `${dias} d`,
    atraso: (dias) => `+${String(dias)}`,
    tardeDias: (dias) => plural(dias, { one: '1 day late', other: '# days late' }),
    punto: (titulo, dias, como) => `${titulo}: ${dias}, ${como}`,
    lectura: (Fuerte, titulo, dias, como) => (
      <>
        <Fuerte>{titulo}</Fuerte> · {dias} · {como}
      </>
    ),
    tocaUnPunto: 'Tap a dot to see which job it is.',
    verElTrabajo: 'See the job',
    porTipo: 'By job type',
    medianaDesde: (cantidad) => `median from ${String(cantidad)} jobs of a type`,
    deAUno: 'One by one:',
    tabla: {
      titulo: 'The deliveries in the period, one by one',
      trabajo: 'Job',
      arranco: 'Started',
      entrego: 'Delivered',
      dias: 'Days',
      prometida: 'Promised date',
      comoLlego: 'How it went',
      aTiempo: 'On time',
      tarde: (dias) => plural(dias, { one: '1 day late', other: '# days late' }),
      sinFecha: 'No promised date',
    },
    irAlAnalitico: 'See Delivery insights',
    vacio: (rango) => `You didn't deliver any jobs with a delivery date in ${rango}.`,
    vacioDeTodo: "You haven't delivered any jobs with a delivery date yet.",
  },
  consultas: {
    frase: (Fuerte, cuantas, presupuestos, trabajosHechos, esperan, desde) => (
      <>
        Of <Fuerte>{inquiries(cuantas)}</Fuerte> that came in
        {desde === null ? '' : ` since ${desde}`},{' '}
        {presupuestos === 0 ? (
          "you didn't send any quotes"
        ) : (
          <>
            you sent a quote to <Fuerte>{String(presupuestos)}</Fuerte>
          </>
        )}{' '}
        and{' '}
        {trabajosHechos === 0 ? (
          'none became a job.'
        ) : (
          <>
            <Fuerte>{String(trabajosHechos)}</Fuerte>{' '}
            {trabajosHechos === 1 ? 'became a job.' : 'became jobs.'}
          </>
        )}
        {esperan === 0
          ? ''
          : ` ${plural(esperan, { one: '1 quote is waiting for an answer.', other: '# quotes are waiting for an answer.' })}`}
      </>
    ),
    subtitulo: (cuando) => `The inquiries that came in ${cuando}, and where they stand today.`,
    antesDelRegistro: (desde) =>
      `NUMA has recorded the stages since ${fechaConAnio(desde, 'en')}: anything earlier has no date.`,
    figura: 'From inquiries to jobs',
    pasos: {
      consultas: 'Inquiries',
      presupuestos: 'Quotes sent',
      trabajos: 'Became jobs',
    },
    cuenta: (Fuerte, cuantas, deCuantas) => (
      <>
        <Fuerte>{String(cuantas)}</Fuerte> of {String(deCuantas)}
      </>
    ),
    primera: (Fuerte, cuantas) => <Fuerte>{String(cuantas)}</Fuerte>,
    perdiste: (perdidas, despues, antes) =>
      perdidas === 0
        ? "You didn't lose any."
        : `You lost ${String(perdidas)}: ${String(despues)} after the quote and ${String(antes)} before.`,
    siguenAbiertas: (abiertas) =>
      abiertas === 0
        ? ''
        : plural(abiertas, { one: ' 1 is still open.', other: ' # are still open.' }),
    presupuestosQueMandaste: 'The quotes you sent',
    unoPorPresupuesto: 'one per quote',
    aprobados: (Fuerte, cuantos) => (
      <>
        <Fuerte>{String(cuantos)}</Fuerte> approved
      </>
    ),
    perdidos: (Fuerte, cuantos) => (
      <>
        <Fuerte>{String(cuantos)}</Fuerte> lost
      </>
    ),
    esperan: (Fuerte, cuantos) => (
      <>
        <Fuerte>{String(cuantos)}</Fuerte> waiting for an answer
      </>
    ),
    sinCasos: '—',
    alPresupuesto: 'from inquiry to quote',
    aLaRespuesta: 'from quote to answer',
    medianaDe: (cuantos) => `median of ${String(cuantos)}`,
    faltan: (embudo, tiempos, casos) => {
      const forTheFunnel =
        embudo === null
          ? null
          : `With ${inquiries(embudo)} you'll see the path from inquiry to job`;
      if (tiempos === null) return `${forTheFunnel ?? ''}.`;
      const what = WHAT_THE_TIMES_NEED[tiempos];
      const howMany = casesForTheTimes(tiempos, casos);
      return forTheFunnel === null
        ? `With ${howMany} you'll see ${what}.`
        : `${forTheFunnel}, and with ${howMany}, ${what}.`;
    },
    tabla: {
      titulo: 'From inquiries to jobs',
      paso: 'Step',
      cuantas: 'How many',
      deCuantas: 'Out of',
      tiempos: 'How long each step takes',
      tiempo: 'Step',
      mediana: 'Half, in under',
      sobreCuantos: 'Out of how many',
      sinDato: '—',
    },
    verLas: (cuantas) =>
      cuantas === 1 ? 'See the inquiry' : `See the ${String(cuantas)} inquiries`,
    esconderLaLista: 'Hide the list',
    lasConsultas: 'The inquiries in the period',
    entro: (dia) => `came in on ${dia}`,
    donde: {
      trabajo: 'Became a job',
      perdida: 'Lost',
      abierta: 'Still open',
    },
    vacio: (rango) => `No inquiries came in in ${rango}.`,
    vacioDeTodo: 'No inquiries have come in since NUMA started recording the stages.',
  },
  opiniones: {
    frase: (Fuerte, conformes, contestaron) => (
      <>
        <Fuerte>
          {String(conformes)} of {String(contestaron)}
        </Fuerte>{' '}
        clients were satisfied or very satisfied with the furniture.
      </>
    ),
    fraseConPorcentaje: (Fuerte, conformes, contestaron, porcentaje) => (
      <>
        <Fuerte>
          {String(conformes)} of {String(contestaron)}
        </Fuerte>{' '}
        clients ({porcentaje}%) were satisfied or very satisfied with the furniture.
      </>
    ),
    fraseConPocos: (Fuerte, contestaron, conformes, todosMuyConformes) => {
      const how = todosMuyConformes ? 'very satisfied' : 'satisfied or very satisfied';
      if (contestaron === 1) {
        return conformes === 1 ? (
          <>
            <Fuerte>1 client</Fuerte> answered and was {how} with the furniture.
          </>
        ) : (
          <>
            <Fuerte>1 client</Fuerte> answered.
          </>
        );
      }
      const who =
        conformes === contestaron
          ? `all ${String(contestaron)} were ${how}`
          : conformes === 0
            ? 'none were satisfied or very satisfied'
            : `${String(conformes)} were satisfied or very satisfied`;
      return (
        <>
          <Fuerte>{`${String(contestaron)} clients`}</Fuerte> answered, and {who} with the
          furniture.
        </>
      );
    },
    fraseSinEscala: (Fuerte, contestaron) => (
      <>
        <Fuerte>{contestaron === 1 ? '1 client' : `${String(contestaron)} clients`}</Fuerte>{' '}
        answered.
      </>
    ),
    sinRespuestas: (enviadas) =>
      plural(enviadas, {
        one: 'You sent 1 survey and no one has answered yet.',
        other: 'You sent # surveys and no one has answered yet.',
      }),
    subtitulo: (enviadas, cuando, contestaron) =>
      enviadas === 1
        ? `Of the survey you sent ${cuando}, ${contestaron === 1 ? 'you got an answer' : 'no answer yet'}.`
        : `Of the ${String(enviadas)} surveys you sent ${cuando}, ${String(contestaron)} got an answer.`,
    subtituloSinEncuestas: (cuando) => `The surveys you sent ${cuando} and what clients answered.`,
    unPuntoPorPersona: 'one dot per person',
    losDosDeArriba: 'the top two of the scale',
    elResto: 'the rest',
    tiempos: 'Timing',
    trato: 'Service',
    kDeN: (cuantos, deCuantos) => `${String(cuantos)} of ${String(deCuantos)}`,
    kDeNConPorcentaje: (cuantos, deCuantos, porcentaje) =>
      `${String(cuantos)} of ${String(deCuantos)} (${porcentaje}%)`,
    irAOpiniones: 'See the answers in Feedback',
    vacio: (rango) => `You didn't send any surveys in ${rango}.`,
    vacioDeTodo: "You haven't sent any surveys yet.",
  },
  viene: {
    frase: (Fuerte, enCurso, listos, teDeben, entregados) => (
      <>
        {enCurso === 0 ? (
          "You don't have any jobs in progress."
        ) : (
          <>
            You have{' '}
            <Fuerte>
              {enCurso === 1 ? '1 job in progress' : `${String(enCurso)} jobs in progress`}
            </Fuerte>
            {listos === 0
              ? '.'
              : enCurso === 1
                ? ", and it's ready."
                : listos === 1
                  ? ', and 1 is ready.'
                  : `, and ${String(listos)} are ready.`}
          </>
        )}
        {teDeben === null ? null : (
          <>
            {' '}
            You're owed <Fuerte>{teDeben}</Fuerte> on{' '}
            {entregados === 1 ? '1 delivered job' : `${String(entregados)} delivered jobs`}.
          </>
        )}
      </>
    ),
    nada: "You don't have any jobs in progress or anything to collect.",
    yEnDolares: (pesos, dolares) => `${pesos} and ${dolares}`,
    subtitulo: (hoy) => `Today, ${hoy}. This doesn't change with the period.`,
    enCurso: 'In progress',
    diasContraLoNormal: 'days since you started, against how long you usually take',
    diasDesdeQueArrancaste: 'days since you started',
    loNormal: (dias) => `${dias}, how long you usually take`,
    hastaLaPromesa: 'until the promised date',
    detalle: (dias, cuando) => `${dias} · ${cuando}`,
    prometidoParaHoy: 'Promised for today',
    prometidoParaElDia: (fecha) => `Promised for ${theDay(fecha)}`,
    prometidoPara: (dia) => `Promised for ${dia}`,
    estimadoParaHoy: 'Estimated for today',
    estimadoParaElDia: (fecha) => `Estimated for ${theDay(fecha)}`,
    estimadoPara: (dia) => `Estimated for ${dia}`,
    sinFechaPrometida: 'No promised date',
    sinArranque: 'No start date',
    listo: 'Ready',
    atrasado: (dias) => plural(dias, { one: '1 day late', other: '# days late' }),
    paso: (dias) => `Over ${dias}`,
    porCobrar: 'Awaiting payment',
    delMasViejo: "on what you've already delivered, oldest first",
    entregado: (cuando) => `delivered ${cuando}`,
    sinDiaDeEntrega: 'no delivery date',
    teDeben: "You're owed",
    irAActivos: 'See active jobs',
  },
} satisfies Mensajes['paginaEstadisticas'];
