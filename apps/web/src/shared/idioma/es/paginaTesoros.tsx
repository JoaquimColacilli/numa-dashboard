import type { BaseDeLaObligacion, TipoDelPaso } from '@maun/domain';

import type { Envoltorio } from '@/shared/lib';

import { fila } from './fila';

type LugarQueSeMueve = 'obligacion' | TipoDelPaso;

const CON_ARTICULO: Readonly<Record<LugarQueSeMueve, string>> = {
  obligacion: 'la obligación',
  compromiso: 'el compromiso',
  'ahorro-fijo': 'el ahorro fijo',
};

const SIN_ARTICULO: Readonly<Record<LugarQueSeMueve, string>> = {
  obligacion: 'obligación',
  compromiso: 'compromiso',
  'ahorro-fijo': 'ahorro fijo',
};

const PRIMERO: Readonly<Record<LugarQueSeMueve, string>> = {
  obligacion: 'la primera obligación',
  compromiso: 'el primer compromiso',
  'ahorro-fijo': 'el primer ahorro fijo',
};

const ULTIMO: Readonly<Record<LugarQueSeMueve, string>> = {
  obligacion: 'la última obligación',
  compromiso: 'el último compromiso',
  'ahorro-fijo': 'el último ahorro fijo',
};

export const paginaTesoros = {
  menu: {
    alPrincipio: (lugar: string) => `${lugar}, al principio`,
    despuesDe: (lugar: string, nombre: string) => `${lugar}, después de ${nombre}`,
    cerrar: 'Cerrar el menú',
    sumarUnTesoro: (encabezado: string) => `Sumar un tesoro: ${encabezado}`,
    comoEntra: 'Cómo entra',
    tiene: (saldo: string) => `tiene ${saldo}`,
    unTesoroNuevo: 'Un tesoro nuevo',
  },
  union: {
    llevala: 'Llevala hasta un tesoro',
    ahiNo: 'Ahí no se puede unir',
    soltaParaCrear: 'Soltá para crear un tesoro acá',
    soltaAlReparto: (nombre: string) => `Soltá: ${nombre} entra al reparto`,
    soltaYPasaASer: (nombre: string, lugar: LugarQueSeMueve, numero: number) =>
      `Soltá: ${nombre} pasa a ser ${CON_ARTICULO[lugar]} ${String(numero)}`,
    soltaYEntraComo: (nombre: string, lugar: LugarQueSeMueve, numero: number) =>
      `Soltá: ${nombre} entra como ${SIN_ARTICULO[lugar]} ${String(numero)}`,
    soloCambianDeLugar: 'Solo las obligaciones y los pasos de la fila cambian de lugar.',
    yaEsElPrimero: (nombre: string, grupo: LugarQueSeMueve) => `${nombre} ya es ${PRIMERO[grupo]}.`,
    yaEsElUltimo: (nombre: string, grupo: LugarQueSeMueve) => `${nombre} ya es ${ULTIMO[grupo]}.`,
    pasaASer: (nombre: string, grupo: LugarQueSeMueve, numero: number, cuantos: number) =>
      `${nombre} pasa a ser ${CON_ARTICULO[grupo]} ${String(numero)} de ${String(cuantos)}.`,
  },
  rotulo: {
    deAjustes: 'de Ajustes',
    controles: 'Controles del plano',
    alejar: 'Alejar',
    acercar: 'Acercar',
    verTodaLaFila: 'Ver toda la fila',
    rotuloDelPlano: 'Rótulo del plano',
    plano: 'Plano',
    laFilaDeLosTesoros: 'La fila de los tesoros',
    revision: 'Rev.',
    rige: 'Rige',
    escala: 'Esc.',
  },
  plano: {
    eraEl: (numero: number) => `era el ${String(numero)}`,
    flecha: 'Flecha de la fila',
    etiquetaDeLaObligacion: (
      numero: number,
      cuantos: number,
      nombre: string,
      porcentaje: string,
      base: BaseDeLaObligacion,
      aPagar: string,
    ) =>
      `Obligación ${String(numero)} de ${String(cuantos)}: ${nombre}, ${porcentaje} ${fila.base[base]}; a pagar ${aPagar}`,
    etiquetaDelDiezmo: (
      numero: number,
      cuantos: number,
      nombre: string,
      porcentaje: string,
      base: BaseDeLaObligacion,
      aPagar: string,
    ) =>
      `Obligación ${String(numero)} de ${String(cuantos)}: ${nombre}, ${porcentaje} ${fila.base[base]}; a pagar ${aPagar}; no se puede sacar de la fila`,
    etiquetaDelPaso: (encabezado: string, cifra: string, estado: string) =>
      `${encabezado}, ${cifra}; ${estado}`,
    encabezadoDelPaso: (tipo: TipoDelPaso, numero: number, cuantos: number, nombre: string) =>
      `${fila.tipos[tipo]} ${String(numero)} de ${String(cuantos)}: ${nombre}`,
    encabezadoDelSueldo: (tipo: TipoDelPaso, numero: number, cuantos: number, nombre: string) =>
      `${fila.tipos[tipo]} ${String(numero)} de ${String(cuantos)}: ${nombre}, sueldo`,
    cifraPorTrabajo: (tipo: TipoDelPaso, tope: string) => `${tope} ${fila.modo[tipo].trabajo}`,
    cifraDelSaldo: (tipo: TipoDelPaso, tope: string) => `hasta ${tope}, ${fila.modo[tipo].saldo}`,
    cifraDelMes: (tipo: TipoDelPaso, tope: string) => `hasta ${tope} ${fila.modo[tipo].mes}`,
    enElMesRecibio: (recibido: string) => `en el mes ${recibido}`,
    aPagarYFaltan: (lleva: string, falta: string) => `a pagar ${lleva}, faltan ${falta}`,
    aPagarCompleto: (lleva: string) => `a pagar ${lleva}, completo`,
    tieneYFaltan: (lleva: string, falta: string) => `tiene ${lleva}, faltan ${falta}`,
    tieneCompleto: (lleva: string) => `tiene ${lleva}, completo`,
    llevaYFaltan: (lleva: string, falta: string) => `lleva ${lleva}, faltan ${falta}`,
    llevaCompleto: (lleva: string) => `lleva ${lleva}, completo`,
    etiquetaDeLaParte: (nombre: string, porcentaje: string) =>
      `Ahorro: ${nombre}, ${porcentaje} de lo que sobra`,
    etiquetaDeLaParteConMeta: (nombre: string, porcentaje: string, saldo: string, meta: string) =>
      `Ahorro: ${nombre}, ${porcentaje} de lo que sobra; tiene ${saldo} de su meta de ${meta}`,
    etiquetaDeLaParteHastaLaMeta: (
      nombre: string,
      porcentaje: string,
      saldo: string,
      meta: string,
    ) =>
      `Ahorro: ${nombre}, ${porcentaje} de lo que sobra, hasta la meta; tiene ${saldo} de su meta de ${meta}`,
    pruebaDeUnTrabajo: (deja: string) => `Prueba: un trabajo que deja ${deja}`,
    ingresoDelMes: (mes: string, ingreso: string, cobros: number) =>
      cobros === 1
        ? `Ingreso de ${mes}: ${ingreso} en 1 cobro`
        : `Ingreso de ${mes}: ${ingreso} en ${String(cobros)} cobros`,
    trabajosEnCurso: (trabajos: number) =>
      trabajos === 0
        ? 'Sin trabajos en curso'
        : trabajos === 1
          ? '1 trabajo en curso'
          : `${String(trabajos)} trabajos en curso`,
    etiquetaDeLosInsumos: (total: string, trabajos: number) =>
      trabajos === 0
        ? `Insumos: ${total}, sin trabajos en curso`
        : trabajos === 1
          ? `Insumos: ${total}, 1 trabajo en curso`
          : `Insumos: ${total}, ${String(trabajos)} trabajos en curso`,
    senaDeLosTrabajos: 'Seña de los trabajos en curso',
    entrada: 'entrada',
    rolDelReparto: 'reparto',
    parteDelReparto: (nombre: string, porcentaje: string) => `${nombre} ${porcentaje}`,
    etiquetaDelReparto: (partes: readonly string[]) =>
      `Lo que sobra se reparte: ${partes.join(', ')}`,
    etiquetaDelResto: (nombre: string, porcentaje: string) =>
      `Superávit: ${nombre} recibe el resto, ${porcentaje}, y los centavos`,
    restoConPorcentaje: (porcentaje: string) => `resto ${porcentaje}`,
    estante: 'Estante',
    todosEnLaFila: 'Todos están en la fila',
    noRecibenDeLosCobros: 'No reciben de los cobros',
    rolDelEstante: 'tesoro en el estante',
    etiquetaDelEstante: (nombre: string, saldo: string) =>
      `${nombre}, en el estante, tiene ${saldo}`,
  },
  fichas: {
    antes: (Tachado: Envoltorio, valor: string) => (
      <>
        antes <Tachado>{valor}</Tachado>
      </>
    ),
    ingreso: 'Ingreso',
    insumos: 'Insumos',
    queda: 'Queda',
    candado: 'El diezmo no se puede sacar de la fila',
    aPagar: 'A pagar',
    deEsteCobro: 'De este cobro',
    sinMontoTodavia: 'sin monto todavía',
    completo: 'Completo',
    faltan: (falta: string) => `faltan ${falta}`,
    sinNombre: 'Sin nombre',
    venceEl: (dia: number) => `· vence el ${String(dia)}`,
    pagado: 'pagado',
    suMeta: (nombre: string) => `${nombre}, su meta`,
    avanceDeLaMeta: (avance: string, meta: string) => `${avance}% de ${meta}`,
    hastaLaMeta: 'hasta la meta',
    enElMes: (mes: string) => `En ${mes}`,
    recibeEnCadaCobro: (monto: string) => `Recibe ${monto} en cada cobro`,
    aPagarMonto: (monto: string) => `a pagar ${monto}`,
    tieneMonto: (monto: string) => `tiene ${monto}`,
    llevaMonto: (monto: string) => `lleva ${monto}`,
    nivelDelSaldo: (nombre: string) => `${nombre}, lo que tiene`,
    nivelDelMes: (nombre: string, mes: string) => `${nombre} en ${mes}`,
    sinMontoTodaviaDelNivel: 'Sin monto todavía',
    deTotal: (parte: string, total: string) => `${parte} de ${total}`,
    yaEstabaCompleto: 'ya estaba completo',
    noLeLlegaNada: 'no le llega nada',
    sueldo: 'Sueldo',
    renglonPorRenglon: 'Renglón por renglón',
    yMas: (cuantos: number) => `y ${String(cuantos)} más`,
    loQueSobra: 'Lo que sobra',
    seReparte: 'Se reparte',
    seReparteAsi: 'Se reparte así',
    noSobraNada: 'No sobra nada',
    aAhorros: 'a ahorros',
    deEsteCobroUnidad: 'de este cobro',
    elResto: 'El resto',
    hastaLaMetaUnidad: 'Hasta la meta',
    tiene: 'Tiene',
    sinDescripcion: 'Sin descripción',
    uniUnaFlecha: 'Uní una flecha acá',
    nuevoTesoro: 'Nuevo tesoro',
    seCobraElTrabajo: 'Se cobra el trabajo',
    ingresoLibre: 'Ingreso libre',
    ganancia: 'Ganancia',
  },
  bienvenida: {
    etiqueta: 'La fila, la primera vez',
    titulo: 'Cada cobro baja por la fila',
    texto:
      'La armamos con lo que tenías en Ajustes: primero el diezmo, después tu sueldo y los costos fijos, y lo que sobra queda en Maun. Ahora podés sumar tesoros, ordenar los topes y repartir lo que sobra.',
    editarLaFila: 'Editar la fila',
    entendido: 'Entendido',
  },
  planoCompleto: {
    titulo: 'El plano de la fila',
    comoSeMira: 'Cómo se mira el plano',
    ayuda:
      'Arrastrá con un dedo para moverte y juntá dos dedos para acercar, o usá los botones de abajo. Para cambiar la fila, cerrá el plano y tocá Editar.',
    rotulo: (revision: number, rige: string) =>
      `Rev. ${String(revision)} · Rige ${rige} · Solo para mirar`,
    cerrar: 'Cerrar el plano',
  },
  planoVertical: {
    sumarAca: 'Sumar acá',
    lugarDe: (nombre: string) => `Lugar de ${nombre}`,
    subir: 'Subir',
    bajar: 'Bajar',
    editar: 'Editar',
    laFila: 'La fila',
    estante: 'Estante',
  },
  celular: {
    insumos: 'Insumos',
    sinTrabajos: 'Sin trabajos en curso',
    loQueQuedaDeLaSena: (trabajos: number) =>
      trabajos === 1
        ? 'Lo que queda de la seña de 1 trabajo en curso'
        : `Lo que queda de la seña de ${String(trabajos)} trabajos en curso`,
    unTrabajo: 'Un trabajo',
    comoSeReparte: 'Cómo se reparte cada cobro',
    tesoros: 'Tesoros',
    verElPlanoCompleto: 'Ver el plano completo',
    editar: 'Editar',
    probarUnCobro: 'Probar un cobro',
    probaUnCobro: 'Probá un cobro',
  },
  compu: {
    comoSeReparte: 'Cómo se reparte lo que deja cada trabajo',
    tesoros: 'Tesoros',
    nuevoTesoro: 'Nuevo tesoro',
    editarLaFila: 'Editar la fila',
    cerrarElDetalle: 'Cerrar el detalle',
    listo: 'Listo',
    probarUnCobro: 'Probar un cobro',
    detalle: 'Detalle',
  },
  lienzo: {
    sumarUnTesoroAca: 'Sumar un tesoro acá',
    elegirLaFicha: 'Enter o espacio elige la ficha y Escape la suelta.',
    elegirYMoverLaFicha:
      'Enter o espacio elige la ficha y Escape la suelta. Mientras editás la fila, Alt con las flechas de arriba y abajo cambia de lugar la ficha elegida adentro de su tipo y Suprimir la saca de la fila.',
    flecha: 'Flecha por donde baja la plata.',
    dejarDeMover: 'Dejar de mover el plano',
    croquis: 'Croquis de la fila',
    manija: 'Manija para unir con otro tesoro',
  },
} as const;
