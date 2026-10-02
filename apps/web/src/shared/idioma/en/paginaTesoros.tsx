import type { TipoDelPaso } from '@maun/domain';

import type { Mensajes } from '../es';

import { fila } from './fila';
import { ordinal } from './gramatica';
import { plural } from './plural';

type LugarQueSeMueve = 'obligacion' | TipoDelPaso;

const NOMBRE: Readonly<Record<LugarQueSeMueve, string>> = {
  obligacion: 'obligation',
  compromiso: 'bill',
  'ahorro-fijo': 'fixed savings',
};

export const paginaTesoros = {
  menu: {
    alPrincipio: (lugar) => `${lugar}, at the start`,
    despuesDe: (lugar, nombre) => `${lugar}, after ${nombre}`,
    cerrar: 'Close menu',
    sumarUnTesoro: (encabezado) => `Add a bucket: ${encabezado}`,
    comoEntra: 'How it joins',
    tiene: (saldo) => `has ${saldo}`,
    unTesoroNuevo: 'A new bucket',
  },
  union: {
    llevala: 'Drag it to a bucket',
    ahiNo: "It can't connect there",
    soltaParaCrear: 'Drop to create a bucket here',
    soltaAlReparto: (nombre) => `Drop: ${nombre} joins the split`,
    soltaYPasaASer: (nombre, lugar, numero) =>
      `Drop: ${nombre} becomes ${NOMBRE[lugar]} ${String(numero)}`,
    soltaYEntraComo: (nombre, lugar, numero) =>
      `Drop: ${nombre} joins as ${NOMBRE[lugar]} ${String(numero)}`,
    soloCambianDeLugar: 'Only obligations and waterfall steps can change place.',
    yaEsElPrimero: (nombre, grupo) => `${nombre} is already the first ${NOMBRE[grupo]}.`,
    yaEsElUltimo: (nombre, grupo) => `${nombre} is already the last ${NOMBRE[grupo]}.`,
    pasaASer: (nombre, grupo, numero, cuantos) =>
      `${nombre} becomes ${NOMBRE[grupo]} ${String(numero)} of ${String(cuantos)}.`,
  },
  rotulo: {
    deAjustes: 'from Settings',
    controles: 'Plan controls',
    alejar: 'Zoom out',
    acercar: 'Zoom in',
    verTodaLaFila: 'Fit the whole waterfall',
    rotuloDelPlano: 'Plan title block',
    plano: 'Plan',
    laFilaDeLosTesoros: 'The bucket waterfall',
    revision: 'Rev.',
    rige: 'In effect',
    escala: 'Scale',
  },
  plano: {
    eraEl: (numero) => `was ${String(numero)}`,
    flecha: 'Waterfall arrow',
    etiquetaDeLaObligacion: (numero, cuantos, nombre, porcentaje, base, aPagar) =>
      `Obligation ${String(numero)} of ${String(cuantos)}: ${nombre}, ${porcentaje} ${fila.base[base]}; to pay ${aPagar}`,
    etiquetaDelDiezmo: (numero, cuantos, nombre, porcentaje, base, aPagar) =>
      `Obligation ${String(numero)} of ${String(cuantos)}: ${nombre}, ${porcentaje} ${fila.base[base]}; to pay ${aPagar}; it can't be taken out of the waterfall`,
    etiquetaDelPaso: (encabezado, cifra, estado) => `${encabezado}, ${cifra}; ${estado}`,
    encabezadoDelPaso: (tipo, numero, cuantos, nombre) =>
      `${fila.tipos[tipo]} ${String(numero)} of ${String(cuantos)}: ${nombre}`,
    encabezadoDelSueldo: (tipo, numero, cuantos, nombre) =>
      `${fila.tipos[tipo]} ${String(numero)} of ${String(cuantos)}: ${nombre}, owner's pay`,
    cifraPorTrabajo: (tipo, tope) => `${tope} ${fila.modo[tipo].trabajo}`,
    cifraDelSaldo: (tipo, tope) => `up to ${tope}, ${fila.modo[tipo].saldo}`,
    cifraDelMes: (tipo, tope) => `up to ${tope} ${fila.modo[tipo].mes}`,
    enElMesRecibio: (recibido) => `${recibido} this month`,
    aPagarYFaltan: (lleva, falta) => `to pay ${lleva}, ${falta} to go`,
    aPagarCompleto: (lleva) => `to pay ${lleva}, complete`,
    tieneYFaltan: (lleva, falta) => `has ${lleva}, ${falta} to go`,
    tieneCompleto: (lleva) => `has ${lleva}, complete`,
    llevaYFaltan: (lleva, falta) => `${lleva} so far, ${falta} to go`,
    llevaCompleto: (lleva) => `${lleva} so far, complete`,
    etiquetaDeLaParte: (nombre, porcentaje) => `Savings: ${nombre}, ${porcentaje} of what's left`,
    etiquetaDeLaParteConMeta: (nombre, porcentaje, saldo, meta) =>
      `Savings: ${nombre}, ${porcentaje} of what's left; it has ${saldo} of its ${meta} goal`,
    etiquetaDeLaParteHastaLaMeta: (nombre, porcentaje, saldo, meta) =>
      `Savings: ${nombre}, ${porcentaje} of what's left, up to the goal; it has ${saldo} of its ${meta} goal`,
    pruebaDeUnTrabajo: (deja) => `Test: a job that nets ${deja}`,
    ingresoDelMes: (mes, ingreso, cobros) =>
      plural(cobros, {
        one: `Income for ${mes}: ${ingreso} from # payment`,
        other: `Income for ${mes}: ${ingreso} from # payments`,
      }),
    trabajosEnCurso: (trabajos) =>
      plural(trabajos, {
        '=0': 'No jobs in progress',
        one: '# job in progress',
        other: '# jobs in progress',
      }),
    etiquetaDeLosInsumos: (total, trabajos) =>
      plural(trabajos, {
        '=0': `Supplies: ${total}, no jobs in progress`,
        one: `Supplies: ${total}, # job in progress`,
        other: `Supplies: ${total}, # jobs in progress`,
      }),
    senaDeLosTrabajos: 'Deposits from jobs in progress',
    entrada: 'entry',
    rolDelReparto: 'split',
    parteDelReparto: (nombre, porcentaje) => `${nombre} ${porcentaje}`,
    etiquetaDelReparto: (partes) => `What's left gets split: ${partes.join(', ')}`,
    etiquetaDelResto: (nombre, porcentaje) =>
      `Surplus: ${nombre} gets the rest, ${porcentaje}, and the cents`,
    restoConPorcentaje: (porcentaje) => `rest ${porcentaje}`,
    estante: 'Shelf',
    todosEnLaFila: 'All in the waterfall',
    noRecibenDeLosCobros: 'They get nothing from payments',
    rolDelEstante: 'bucket on the shelf',
    etiquetaDelEstante: (nombre, saldo) => `${nombre}, on the shelf, has ${saldo}`,
  },
  fichas: {
    antes: (Tachado, valor) => (
      <>
        before <Tachado>{valor}</Tachado>
      </>
    ),
    ingreso: 'Income',
    insumos: 'Supplies',
    queda: 'Left',
    candado: "The tithe can't be taken out of the waterfall",
    aPagar: 'To pay',
    deEsteCobro: 'From this payment',
    sinMontoTodavia: 'no amount yet',
    completo: 'Complete',
    faltan: (falta) => `${falta} to go`,
    sinNombre: 'No name',
    venceEl: (dia) => `· due on the ${ordinal(dia)}`,
    pagado: 'paid',
    suMeta: (nombre) => `${nombre}, its goal`,
    avanceDeLaMeta: (avance, meta) => `${avance}% of ${meta}`,
    hastaLaMeta: 'up to the goal',
    enElMes: (mes) => `In ${mes}`,
    recibeEnCadaCobro: (monto) => `Gets ${monto} from each payment`,
    aPagarMonto: (monto) => `to pay ${monto}`,
    tieneMonto: (monto) => `has ${monto}`,
    llevaMonto: (monto) => `${monto} so far`,
    nivelDelSaldo: (nombre) => `${nombre}, what it has`,
    nivelDelMes: (nombre, mes) => `${nombre} in ${mes}`,
    sinMontoTodaviaDelNivel: 'No amount yet',
    deTotal: (parte, total) => `${parte} of ${total}`,
    yaEstabaCompleto: 'was already full',
    noLeLlegaNada: 'gets nothing',
    sueldo: "Owner's pay",
    renglonPorRenglon: 'Item by item',
    yMas: (cuantos) => `and ${String(cuantos)} more`,
    loQueSobra: "What's left",
    seReparte: 'Gets split',
    seReparteAsi: 'Split like this',
    noSobraNada: 'Nothing left',
    aAhorros: 'to savings',
    deEsteCobroUnidad: 'from this payment',
    elResto: 'The rest',
    hastaLaMetaUnidad: 'Up to the goal',
    tiene: 'Balance',
    sinDescripcion: 'No description',
    uniUnaFlecha: 'Draw an arrow here',
    nuevoTesoro: 'New bucket',
    seCobraElTrabajo: 'The job gets paid',
    ingresoLibre: 'Free income',
    ganancia: 'Profit',
  },
  bienvenida: {
    etiqueta: 'The waterfall, first time',
    titulo: 'Every payment flows down the waterfall',
    texto:
      "We built it from what you had in Settings: first the tithe, then your owner's pay and fixed costs, and what's left stays in Maun. Now you can add buckets, order the amounts and split what's left.",
    editarLaFila: 'Edit the waterfall',
    entendido: 'Got it',
  },
  planoCompleto: {
    titulo: 'The waterfall plan',
    comoSeMira: 'How to view the plan',
    ayuda:
      'Drag with one finger to move around and pinch to zoom in, or use the buttons below. To change the waterfall, close the plan and tap Edit.',
    rotulo: (revision, rige) => `Rev. ${String(revision)} · In effect ${rige} · View only`,
    cerrar: 'Close plan',
  },
  planoVertical: {
    sumarAca: 'Add here',
    lugarDe: (nombre) => `Position of ${nombre}`,
    subir: 'Move up',
    bajar: 'Move down',
    editar: 'Edit',
    laFila: 'The waterfall',
    estante: 'Shelf',
  },
  celular: {
    insumos: 'Supplies',
    sinTrabajos: 'No jobs in progress',
    loQueQuedaDeLaSena: (trabajos) =>
      plural(trabajos, {
        one: "What's left of the deposit from # job in progress",
        other: "What's left of the deposits from # jobs in progress",
      }),
    unTrabajo: 'A job',
    comoSeReparte: 'How each payment gets split',
    tesoros: 'Buckets',
    verElPlanoCompleto: 'See the full plan',
    editar: 'Edit',
    probarUnCobro: 'Test a payment',
    probaUnCobro: 'Test a payment',
  },
  compu: {
    comoSeReparte: 'How what each job nets gets split',
    tesoros: 'Buckets',
    nuevoTesoro: 'New bucket',
    editarLaFila: 'Edit the waterfall',
    cerrarElDetalle: 'Close details',
    listo: 'Done',
    probarUnCobro: 'Test a payment',
    detalle: 'Details',
  },
  lienzo: {
    sumarUnTesoroAca: 'Add a bucket here',
    elegirLaFicha: 'Enter or Space selects the card and Escape lets it go.',
    elegirYMoverLaFicha:
      'Enter or Space selects the card and Escape lets it go. While you edit the waterfall, Alt with the up and down arrows moves the selected card within its kind, and Delete takes it out of the waterfall.',
    flecha: 'Arrow showing where the money flows down.',
    dejarDeMover: 'Stop moving the plan',
    croquis: 'Waterfall sketch',
    manija: 'Handle to connect to another bucket',
  },
} satisfies Mensajes['paginaTesoros'];
