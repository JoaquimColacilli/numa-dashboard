import type { ModoDePaso, TipoDelPaso } from '@maun/domain';

import type { Mensajes } from '../es';

import { fila } from './fila';
import { ordinal } from './gramatica';
import { plural } from './plural';

const TIPO_EN_LA_FRASE: Readonly<Record<TipoDelPaso, string>> = {
  compromiso: 'bill',
  'ahorro-fijo': 'fixed savings',
};

const PASA_A_SER: Readonly<Record<TipoDelPaso, string>> = {
  compromiso: 'a bill',
  'ahorro-fijo': 'fixed savings',
};

const BASE_DEL_CALCULO = { cobrado: "what you're paid", ingreso: 'income' } as const;

function montoConSuModo(monto: string, tipo: TipoDelPaso, modo: ModoDePaso): string {
  return modo === 'saldo'
    ? `${monto}, ${fila.modo[tipo][modo]}`
    : `${monto} ${fila.modo[tipo][modo]}`;
}

export const armarLaFila = {
  problemas: {
    'forma-invalida': "The waterfall couldn't be read.",
    'demasiadas-obligaciones': 'Up to 6 obligations fit.',
    'demasiados-pasos': 'Up to 12 steps fit.',
    'demasiadas-partes': 'The split takes up to 8 buckets.',
    'tesoro-desconocido': "One of the buckets doesn't exist anymore.",
    'tesoro-en-otra-moneda': 'The waterfall only splits pesos: a dollar bucket stays on the shelf.',
    'obligacion-en-hogar-o-maun': "Hogar and Maun can't be obligations.",
    'obligacion-invalida':
      "Each obligation needs a percentage from 0.01% to 100% and what it's calculated on.",
    'sin-diezmo': 'The tithe is missing from the obligations.',
    'diezmo-en-la-fila': 'The tithe goes with the obligations.',
    'hogar-no-es-sueldo': "Hogar only gets the owner's pay.",
    'sueldo-no-es-hogar': "Owner's pay always goes to Hogar.",
    'maun-no-es-fijos': 'Maun can only be a fixed costs step.',
    'tope-fuera-de-rango': "The amount can't be negative or that large.",
    'renglones-en-otra-clase': 'Only fixed costs have items.',
    'fijos-sin-renglones': 'Fixed costs need at least one item.',
    'demasiados-renglones': 'Up to 12 items fit.',
    'renglon-sin-nombre': 'Each item needs a name.',
    'renglon-largo': "The item's name is too long: up to 40 characters.",
    'renglon-fuera-de-rango': 'Each item needs an amount greater than zero.',
    'dia-invalido': 'The due day goes from 1 to 31.',
    'tope-no-es-la-suma': 'The amount has to be the sum of the items.',
    'desde-invalido': "The amount's start date couldn't be read.",
    'meta-fuera-de-ahorro': 'Only savings go up to a goal.',
    'ahorro-antes-de-compromiso': 'Savings go after bills.',
    'maun-en-el-reparto':
      "Maun doesn't go in the split: to have it get what's left, choose it as the surplus.",
    'hogar-en-el-reparto': "Hogar doesn't go in the split: it gets the owner's pay.",
    'porcentaje-invalido': 'Each percentage goes from 0.01% to 100%.',
    'reparto-pasa-de-cien': 'The percentages add up to more than 100%.',
    'sueldo-por-trabajo': "The waterfall counts owner's pay per month.",
  },
  problemasConNombre: {
    'tesoro-archivado': (nombre) =>
      `${nombre ?? 'That bucket'} is archived: take it out of the waterfall.`,
    'tesoro-repetido': (nombre) =>
      `${nombre ?? 'That bucket'} is in there twice: each bucket goes in only once.`,
    'modo-invalido': (nombre) => `${nombre ?? 'That bucket'} can't fill up that way.`,
    'meta-sin-monto': (nombre) =>
      `${nombre ?? 'That bucket'} has no goal: set one or turn off “up to the goal.”`,
    'superavit-invalido': (nombre) => `What's left can't go to ${nombre ?? 'that bucket'}.`,
    'superavit-en-la-fila': (nombre) =>
      `${nombre ?? 'That bucket'} gets what's left: it can't also be in the waterfall.`,
  },
  cambios: {
    entraALasObligaciones: (Nombre, nombre, posicion, porcentaje, base) => (
      <>
        <Nombre>{nombre}</Nombre> joins as obligation {String(posicion)}, at {porcentaje}{' '}
        {fila.base[base]}.
      </>
    ),
    saleDeLasObligaciones: (Nombre, nombre) => (
      <>
        <Nombre>{nombre}</Nombre> leaves the obligations and goes back to the shelf.
      </>
    ),
    cambiaDeLugar: (Nombre, nombre, antes, despues) => (
      <>
        <Nombre>{nombre}</Nombre> moves from {String(antes)} to {String(despues)} in the waterfall.
      </>
    ),
    cambiaElPorcentajeDeLaObligacion: (Nombre, nombre, antes, despues) => (
      <>
        <Nombre>{nombre}</Nombre>: from {antes} to {despues}.
      </>
    ),
    cambiaLaBase: (Nombre, nombre, base) => (
      <>
        <Nombre>{nombre}</Nombre> is now calculated on {BASE_DEL_CALCULO[base]}.
      </>
    ),
    entraALaFila: (Nombre, nombre, tipo, numero, monto, modo) => (
      <>
        <Nombre>{nombre}</Nombre> joins as {TIPO_EN_LA_FRASE[tipo]} {String(numero)}, with{' '}
        {montoConSuModo(monto, tipo, modo)}.
      </>
    ),
    entraALaFilaHastaLaMeta: (Nombre, nombre, tipo, numero, monto, modo) => (
      <>
        <Nombre>{nombre}</Nombre> joins as {TIPO_EN_LA_FRASE[tipo]} {String(numero)}, with{' '}
        {montoConSuModo(monto, tipo, modo)}, up to the goal.
      </>
    ),
    saleDeLaFila: (Nombre, nombre) => (
      <>
        <Nombre>{nombre}</Nombre> goes back to the shelf with what it has.
      </>
    ),
    cambiaLaClase: (Nombre, nombre, tipo) => (
      <>
        <Nombre>{nombre}</Nombre> becomes {PASA_A_SER[tipo]}.
      </>
    ),
    cambiaElTope: (Nombre, nombre, antes, despues) => (
      <>
        <Nombre>{nombre}</Nombre>: from {antes} to {despues}.
      </>
    ),
    cambiaElTopeConSuModo: (Nombre, nombre, antes, despues, tipo, modo) => (
      <>
        <Nombre>{nombre}</Nombre>: from {antes} to {despues} {fila.modo[tipo][modo]}.
      </>
    ),
    cambianLosRenglones: (Nombre, nombre) => (
      <>
        <Nombre>{nombre}</Nombre> changes its items and the amount stays the same.
      </>
    ),
    cambianLosDias: (Nombre, nombre) => (
      <>
        <Nombre>{nombre}</Nombre> changes its due days.
      </>
    ),
    cambiaElModo: (Nombre, nombre, tipo, modo) =>
      modo === 'saldo' ? (
        <>
          <Nombre>{nombre}</Nombre> now {fila.modo[tipo][modo]}.
        </>
      ) : tipo === 'compromiso' ? (
        <>
          <Nombre>{nombre}</Nombre> now fills up {fila.modo[tipo][modo]}.
        </>
      ) : (
        <>
          <Nombre>{nombre}</Nombre> is now set aside {fila.modo[tipo][modo]}.
        </>
      ),
    juntaHastaLaMeta: (Nombre, nombre) => (
      <>
        <Nombre>{nombre}</Nombre> collects until it reaches its goal.
      </>
    ),
    juntaSinFin: (Nombre, nombre) => (
      <>
        <Nombre>{nombre}</Nombre> keeps collecting, even after it reaches its goal.
      </>
    ),
    entraAlReparto: (Nombre, nombre, porcentaje) => (
      <>
        <Nombre>{nombre}</Nombre> joins the split with {porcentaje} of what&apos;s left.
      </>
    ),
    entraAlRepartoHastaLaMeta: (Nombre, nombre, porcentaje) => (
      <>
        <Nombre>{nombre}</Nombre> joins the split with {porcentaje} of what&apos;s left, up to the
        goal.
      </>
    ),
    saleDelReparto: (Nombre, nombre) => (
      <>
        <Nombre>{nombre}</Nombre> leaves the split and goes back to the shelf.
      </>
    ),
    cambiaElPorcentaje: (Nombre, nombre, antes, despues) => (
      <>
        <Nombre>{nombre}</Nombre>: from {antes} to {despues} of what&apos;s left.
      </>
    ),
    cambiaElSuperavit: (Nombre, nombre, antes) => (
      <>
        <Nombre>{nombre}</Nombre> gets what&apos;s left, instead of {antes}.
      </>
    ),
  },
  cuantosCambios: (cuantos) =>
    plural(cuantos, {
      '=0': 'No changes yet',
      one: '# unsaved change',
      other: '# unsaved changes',
    }),
  cuantosCambiosYCuandoValen: (cuantos) =>
    plural(cuantos, {
      '=0': 'No changes yet · they apply from the next payment',
      one: '# unsaved change · it applies from the next payment',
      other: '# unsaved changes · they apply from the next payment',
    }),
  paraGuardar: (problema) => `To save: ${problema}`,
  cuantasCosas: (cuantas) =>
    plural(cuantas, { one: 'One thing changes', other: '# things change' }),
  clases: {
    sueldo: "Owner's pay",
    fijos: 'Fixed costs',
    prioridad: 'Priority',
  },
  prueba: {
    llegoALaMeta: 'reached its goal',
    yaEstabaCompleto: 'was already full',
    completaElMonto: 'fills the amount',
    leFaltan: (falta) => `still needs ${falta}`,
  },
  ficha: {
    tesoroQueYaNoEsta: "A bucket that's gone",
    laFila: 'The waterfall',
    comoSeReparte: 'How each payment gets split',
    enLaFila: 'In the waterfall',
    lugarEnLaFila: (numero, cuantos) => `${String(numero)} of ${String(cuantos)}`,
    delPaso: (tipo, lugar) => `${tipo} · ${lugar}`,
    delSueldo: (tipo, lugar) => `${tipo} · ${lugar} · Owner's pay`,
    loQueSobra: "What's left",
    ahorrosPorPorcentaje: 'Percentage savings',
    superavitElResto: 'Surplus · The rest',
    enElEstante: 'On the shelf',
    deLaObligacion: (lugar) => `Obligation · ${lugar}`,
    insumos: 'Supplies',
    loQueQuedaDeCadaSena: "What's left of each deposit",
  },
  barra: {
    editandoLaFila: 'Editing the waterfall',
    tesoros: 'Buckets',
    deshacer: 'Undo',
    rehacer: 'Redo',
    descartar: 'Discard',
    descartarLosCambios: 'Discard changes',
    guardarLaFila: 'Save the waterfall',
    guardar: 'Save',
  },
  editar: (nombre) => `Edit ${nombre}`,
  listo: 'Done',
  guardar: {
    titulo: 'Save the waterfall',
    revision: (numero) => `Becomes revision ${String(numero)}`,
    sueldoPorMes:
      "Owner's pay is now counted per month: the month's payments cover it up to the cap.",
    conUnCobroDe: (monto) => `With a payment of ${monto}`,
    deDondeSale: 'Where the comparison comes from',
    comparacion: (mes) =>
      `It's the same payment split with today's waterfall and with the one you're about to save, counting what already came in during ${mes}.`,
    igualQueHoy: 'That payment gets split the same as today.',
    tesoro: 'Bucket',
    hoy: 'Today',
    conLosCambios: 'With the changes',
    quedaEnCero: (Nombre, nombre, cero) => (
      <>
        <Nombre>{nombre}</Nombre> is left with an amount of {cero}: it gets nothing until you set
        one.
      </>
    ),
    cuandoValen: (mes) =>
      `Changes take effect from the next payment. The splits you already made don't change, and what already came in during ${mes} still counts.`,
    seguirEditando: 'Keep editing',
  },
  probador: {
    loQueDeja: 'Net (paid minus expenses)',
    conUnTrabajo: 'Try a job that nets',
    conQueSePrueba: 'What to test with',
    conLoDeHoy: 'As of today',
    todoEnCero: 'All at zero',
    seCobro: 'Client paid',
    ayudaDeLoCobrado:
      "Everything that came in from the job, for what's calculated on what you're paid.",
    loQueDejaElTrabajo: 'What the job nets',
    sobran: (Monto, monto) => (
      <>
        <Monto>{monto}</Monto> left to split.
      </>
    ),
    sobranYMira: (Monto, monto) => (
      <>
        <Monto>{monto}</Monto> left to split. Look at the waterfall.
      </>
    ),
    comoBaja: 'How this payment flows down',
    diezmo: 'Tithe',
    conPorcentaje: (nombre, porcentaje) => `${nombre} ${porcentaje}`,
    ingresoLibre: 'Free income',
    ganancia: 'Profit',
    loQueSobra: "What's left",
    elResto: (nombre, porcentaje) => `${nombre}, the rest ${porcentaje}`,
    suma: 'Total',
    daElIngreso: 'matches the income',
  },
  panel: {
    cerrarElDetalle: 'Close details',
    subir: 'Move up',
    bajar: 'Move down',
    lugarEnLaFila: 'Place in the waterfall',
    numeroDeCuantos: (Negrita, numero, cuantos) => (
      <>
        <Negrita>{String(numero)}</Negrita> of {String(cuantos)}
      </>
    ),
    vuelveAlEstante: 'It goes back to the shelf with what it has. Nothing gets deleted.',
    registrarElPago: 'Record payment',
    registrarElPagoDe: (nombre) => `Record payment for ${nombre}`,
    registrarElPagoDeEsteRenglon: 'Record payment for this item',
    porcentaje: 'Percentage',
    porcentajeDe: (nombre) => `Percentage for ${nombre}`,
    sobreQueSeCalcula: "What it's calculated on",
    sobreQueSeCalculaDe: (nombre) => `What ${nombre} is calculated on`,
    enElMes: (mes) => `In ${mes}`,
    apartado: 'Set aside',
    aPagar: 'To pay',
    candadoDelDiezmo:
      "The tithe can't be taken out of the waterfall: you can still change its percentage and place.",
    sacarDeLasObligaciones: 'Remove from obligations',
    venceEl: 'Due on',
    diaDePagoDe: (nombre) => `Due day for ${nombre}`,
    diaDePagoDeEsteRenglon: 'Due day for this item',
    sinDia: 'no day',
    renglones: 'Items',
    queSonLosRenglones: 'What items are',
    ayudaDeLosRenglones:
      "Each expense you pay every month. The bill's amount is the sum: when an item changes, the amount changes from the next payment.",
    renglonDe: (numero, nombre) => `Item ${String(numero)} of ${nombre}`,
    sacarElRenglon: (nombre) => `Remove item ${nombre}`,
    sacarElRenglonNumero: (numero) => `Remove item ${String(numero)}`,
    montoDe: (nombre) => `Amount for ${nombre}`,
    montoDelRenglon: (numero) => `Amount for item ${String(numero)}`,
    venceElDia: (dia) => `· due on the ${ordinal(dia)}`,
    sumarUnRenglon: 'Add an item',
    montoLaSuma: 'Amount, the sum',
    rigeDesdeElProximoCobro: 'In effect from the next payment',
    rigeDesde: (mes, anio) => `In effect from ${mes} ${anio}`,
    monto: 'Amount',
    comoSeLlenaDe: (tipo, nombre) =>
      tipo === 'compromiso' ? `How ${nombre} fills up` : `How ${nombre} is set aside`,
    sueldoPorMes:
      "Owner's pay for Hogar always goes per month: Hogar spends its balance all month long.",
    hastaLaMeta: 'Up to the goal',
    juntaHastaLaMeta: 'Collects until it reaches its goal.',
    juntaSinFin: 'Keeps collecting with no end.',
    llegoASuMeta: 'Reached its goal',
    leFaltan: (falta) => `${falta} to go`,
    deTotal: (parte, total) => `${parte} of ${total}`,
    recibio: 'Received',
    recibeEnCadaCobro: (monto) => `It gets ${monto} from each payment, whatever the month.`,
    loApartado: 'Set aside so far',
    nivelApartado: (nombre) => `${nombre}, set aside so far`,
    nivelDelMes: (nombre, mes) => `${nombre} in ${mes}`,
    sinMontoTodavia: 'No amount yet',
    poneElMonto: 'Set the amount',
    completo: 'Complete',
    faltan: (falta) => `${falta} to go`,
    cubrirDesdeOtroTesoro: 'Cover from another bucket',
    pagado: 'Paid',
    queEs: 'What it is',
    queEsDe: (nombre) => `What ${nombre} is`,
    tipoDelSueldo: (tipo) => `${tipo} · owner's pay for Hogar`,
    sacarDeLaFila: 'Remove from the waterfall',
    seRepartePorPorcentaje: 'Split by percentage',
    reparto: 'Split',
    sacarDelReparto: (nombre) => `Remove ${nombre} from the split`,
    hastaLaMetaDe: (nombre) => `${nombre} up to the goal`,
    elResto: (nombre) => `${nombre}, the rest`,
    repartoEnCien: (nombre) =>
      `The split reaches 100%: ${nombre} only keeps the cents left over from rounding.`,
    repartoConLibre: (suma, libre, nombre) =>
      `The percentages add up to ${suma}. The missing ${libre} goes to ${nombre}, which gets what's left.`,
    superavitRecibe: (libre) =>
      `It gets what's left after everything: ${libre} of what's split and the cents left over from rounding.`,
    dondeCaeLoQueSobra: "Where what's left lands",
    caeEn: (Negrita, nombre) => (
      <>
        It lands in <Negrita>{nombre}</Negrita>.
      </>
    ),
    tiene: 'Balance',
    deLaMeta: (porcentaje, meta) => `${porcentaje}% of the ${meta} goal`,
    sumarloALaFila: 'Add it to the waterfall',
    noRecibeYSeEdita:
      'It gets no money from payments right now. Choose where it goes: the waterfall switches to editing and nothing changes until you save it.',
    noRecibe: 'It gets no money from payments right now. Choose where it goes.',
    noRecibeConFlechas:
      'It gets no money from payments right now. Draw an arrow to its card or choose where it goes.',
    deLosTrabajosEnCurso: 'From jobs in progress',
    sinTrabajos: 'No jobs in progress with money.',
    enTrabajos: (cuantos) =>
      plural(cuantos, {
        one: 'From # job in progress. It stays in Maun until the job is paid.',
        other: 'From # jobs in progress. It stays in Maun until each job is paid.',
      }),
    porTrabajo: 'By job',
    unTrabajo: 'A job',
    entroYGastado: (entro, gastado) => `came in ${entro} · spent ${gastado}`,
    lugarDeLaObligacion: (porcentaje, base) => `${porcentaje} ${fila.base[base]}`,
    lugarDelSueldo: (modo) => `owner's pay, ${fila.modo.compromiso[modo]}`,
    lugarConElResto: (tipo, modo) => `${fila.modo[tipo][modo]}, and the rest`,
    lugarDeLaParte: (porcentaje) => `${porcentaje} of what's left`,
    lugarDeLaParteHastaLaMeta: (porcentaje) => `${porcentaje} of what's left, up to the goal`,
    lugarDelResto: 'the rest',
    lugarDelEstante: 'shelf',
    deMas: (monto) => `${monto} over`,
    estante: 'Shelf',
    listaDeTesoros: 'List of buckets',
    queEsLaLista: 'What the list of buckets is',
    ayudaDeLaLista:
      'Every bucket with what it has today, in waterfall order. Tap one to see it on the plan.',
    numeroEnLaFila: (numero) => `number ${String(numero)} in the waterfall, `,
    entreTodos: 'In total',
    tocaUnaFicha: 'Tap a card to see its rules, or test a payment and watch where the money flows.',
    probarUnCobro: 'Test a payment',
    ingresoEnCobros: (cobros) =>
      plural(cobros, { one: 'Income from # payment', other: 'Income from # payments' }),
    obligacionesApartadas: 'Obligations set aside',
    losCompromisos: 'Bills',
    faltaParaLosCompromisos: 'Still needed for bills',
    llenos: 'full',
    ahorrado: 'Saved',
    superavit: 'Surplus',
  },
} satisfies Mensajes['armarLaFila'];
