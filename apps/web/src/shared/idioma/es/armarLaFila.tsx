import type { BaseDeLaObligacion, ModoDePaso, TipoDelPaso } from '@maun/domain';

import type { Envoltorio } from '@/shared/lib';

import { fila } from './fila';

const TIPO_EN_LA_FRASE: Readonly<Record<TipoDelPaso, string>> = {
  compromiso: 'compromiso',
  'ahorro-fijo': 'ahorro fijo',
};

const VERBO_DEL_MODO: Readonly<Record<TipoDelPaso, string>> = {
  compromiso: 'se llena',
  'ahorro-fijo': 'se aparta',
};

function montoConSuModo(monto: string, tipo: TipoDelPaso, modo: ModoDePaso): string {
  return modo === 'saldo'
    ? `${monto}, ${fila.modo[tipo][modo]}`
    : `${monto} ${fila.modo[tipo][modo]}`;
}

export const armarLaFila = {
  problemas: {
    'forma-invalida': 'La fila no se pudo leer.',
    'demasiadas-obligaciones': 'Entran hasta 6 obligaciones.',
    'demasiados-pasos': 'Entran hasta 12 pasos.',
    'demasiadas-partes': 'El reparto admite hasta 8 tesoros.',
    'tesoro-desconocido': 'Uno de los tesoros ya no existe.',
    'tesoro-en-otra-moneda': 'La fila reparte pesos: un tesoro en dólares queda en el estante.',
    'obligacion-en-hogar-o-maun': 'Hogar y Maun no pueden ser obligación.',
    'obligacion-invalida':
      'Cada obligación necesita un porcentaje de 0,01% a 100% y sobre qué se calcula.',
    'sin-diezmo': 'Falta el diezmo entre las obligaciones.',
    'diezmo-en-la-fila': 'El diezmo va entre las obligaciones.',
    'hogar-no-es-sueldo': 'Hogar solo recibe el sueldo.',
    'sueldo-no-es-hogar': 'El sueldo va siempre a Hogar.',
    'maun-no-es-fijos': 'Maun solo puede ser un paso de gastos fijos.',
    'tope-fuera-de-rango': 'El tope no puede ser negativo ni tan grande.',
    'renglones-en-otra-clase': 'Solo los gastos fijos tienen renglones.',
    'fijos-sin-renglones': 'Los gastos fijos necesitan al menos un renglón.',
    'demasiados-renglones': 'Entran hasta 12 renglones.',
    'renglon-sin-nombre': 'Cada renglón necesita un nombre.',
    'renglon-largo': 'El nombre del renglón es muy largo: hasta 40 letras.',
    'renglon-fuera-de-rango': 'Cada renglón necesita un monto mayor que cero.',
    'dia-invalido': 'El día de pago va del 1 al 31.',
    'tope-no-es-la-suma': 'El tope tiene que ser la suma de los renglones.',
    'desde-invalido': 'La fecha del tope no se pudo leer.',
    'meta-fuera-de-ahorro': 'Solo los ahorros van hasta la meta.',
    'ahorro-antes-de-compromiso': 'Los ahorros van después de los compromisos.',
    'maun-en-el-reparto':
      'Maun no va en el reparto: para que reciba lo que sobra, elegilo como superávit.',
    'hogar-en-el-reparto': 'Hogar no va en el reparto: recibe el sueldo.',
    'porcentaje-invalido': 'Cada porcentaje va de 0,01% a 100%.',
    'reparto-pasa-de-cien': 'Los porcentajes suman más de 100%.',
    'sueldo-por-trabajo': 'La fila cuenta el sueldo por mes.',
  },
  problemasConNombre: {
    'tesoro-archivado': (nombre: string | null) =>
      `${nombre ?? 'Ese tesoro'} está archivado: sacalo de la fila.`,
    'tesoro-repetido': (nombre: string | null) =>
      `${nombre ?? 'Ese tesoro'} está dos veces: cada tesoro va una sola vez.`,
    'modo-invalido': (nombre: string | null) =>
      `${nombre ?? 'Ese tesoro'} no puede llenarse de esa forma.`,
    'meta-sin-monto': (nombre: string | null) =>
      `${nombre ?? 'Ese tesoro'} no tiene meta: ponele una o sacá «hasta la meta».`,
    'superavit-invalido': (nombre: string | null) =>
      `Lo que sobra no puede ir a ${nombre ?? 'Ese tesoro'}.`,
    'superavit-en-la-fila': (nombre: string | null) =>
      `${nombre ?? 'Ese tesoro'} recibe lo que sobra: no puede estar también en la fila.`,
  },
  cambios: {
    entraALasObligaciones: (
      Nombre: Envoltorio,
      nombre: string,
      posicion: number,
      porcentaje: string,
      base: BaseDeLaObligacion,
    ) => (
      <>
        <Nombre>{nombre}</Nombre> entra como obligación {String(posicion)}, con el {porcentaje}{' '}
        {fila.base[base]}.
      </>
    ),
    saleDeLasObligaciones: (Nombre: Envoltorio, nombre: string) => (
      <>
        <Nombre>{nombre}</Nombre> sale de las obligaciones y vuelve al estante.
      </>
    ),
    cambiaDeLugar: (Nombre: Envoltorio, nombre: string, antes: number, despues: number) => (
      <>
        <Nombre>{nombre}</Nombre> pasa del {String(antes)} al {String(despues)} en la fila.
      </>
    ),
    cambiaElPorcentajeDeLaObligacion: (
      Nombre: Envoltorio,
      nombre: string,
      antes: string,
      despues: string,
    ) => (
      <>
        <Nombre>{nombre}</Nombre>: de {antes} a {despues}.
      </>
    ),
    cambiaLaBase: (Nombre: Envoltorio, nombre: string, base: BaseDeLaObligacion) => (
      <>
        <Nombre>{nombre}</Nombre> pasa a calcularse {fila.base[base]}.
      </>
    ),
    entraALaFila: (
      Nombre: Envoltorio,
      nombre: string,
      tipo: TipoDelPaso,
      numero: number,
      monto: string,
      modo: ModoDePaso,
    ) => (
      <>
        <Nombre>{nombre}</Nombre> entra como {TIPO_EN_LA_FRASE[tipo]} {String(numero)}, con{' '}
        {montoConSuModo(monto, tipo, modo)}.
      </>
    ),
    entraALaFilaHastaLaMeta: (
      Nombre: Envoltorio,
      nombre: string,
      tipo: TipoDelPaso,
      numero: number,
      monto: string,
      modo: ModoDePaso,
    ) => (
      <>
        <Nombre>{nombre}</Nombre> entra como {TIPO_EN_LA_FRASE[tipo]} {String(numero)}, con{' '}
        {montoConSuModo(monto, tipo, modo)}, hasta la meta.
      </>
    ),
    saleDeLaFila: (Nombre: Envoltorio, nombre: string) => (
      <>
        <Nombre>{nombre}</Nombre> vuelve al estante con lo que tiene.
      </>
    ),
    cambiaLaClase: (Nombre: Envoltorio, nombre: string, tipo: TipoDelPaso) => (
      <>
        <Nombre>{nombre}</Nombre> pasa a ser {TIPO_EN_LA_FRASE[tipo]}.
      </>
    ),
    cambiaElTope: (Nombre: Envoltorio, nombre: string, antes: string, despues: string) => (
      <>
        <Nombre>{nombre}</Nombre>: de {antes} a {despues}.
      </>
    ),
    cambiaElTopeConSuModo: (
      Nombre: Envoltorio,
      nombre: string,
      antes: string,
      despues: string,
      tipo: TipoDelPaso,
      modo: ModoDePaso,
    ) => (
      <>
        <Nombre>{nombre}</Nombre>: de {antes} a {despues} {fila.modo[tipo][modo]}.
      </>
    ),
    cambianLosRenglones: (Nombre: Envoltorio, nombre: string) => (
      <>
        <Nombre>{nombre}</Nombre> cambia sus renglones y el tope sigue igual.
      </>
    ),
    cambianLosDias: (Nombre: Envoltorio, nombre: string) => (
      <>
        <Nombre>{nombre}</Nombre> cambia los días de pago.
      </>
    ),
    cambiaElModo: (Nombre: Envoltorio, nombre: string, tipo: TipoDelPaso, modo: ModoDePaso) =>
      modo === 'saldo' ? (
        <>
          <Nombre>{nombre}</Nombre> ahora {fila.modo[tipo][modo]}.
        </>
      ) : (
        <>
          <Nombre>{nombre}</Nombre> ahora {VERBO_DEL_MODO[tipo]} {fila.modo[tipo][modo]}.
        </>
      ),
    juntaHastaLaMeta: (Nombre: Envoltorio, nombre: string) => (
      <>
        <Nombre>{nombre}</Nombre> junta hasta llegar a su meta.
      </>
    ),
    juntaSinFin: (Nombre: Envoltorio, nombre: string) => (
      <>
        <Nombre>{nombre}</Nombre> junta sin fin, aunque llegue a su meta.
      </>
    ),
    entraAlReparto: (Nombre: Envoltorio, nombre: string, porcentaje: string) => (
      <>
        <Nombre>{nombre}</Nombre> entra al reparto con el {porcentaje} de lo que sobra.
      </>
    ),
    entraAlRepartoHastaLaMeta: (Nombre: Envoltorio, nombre: string, porcentaje: string) => (
      <>
        <Nombre>{nombre}</Nombre> entra al reparto con el {porcentaje} de lo que sobra, hasta la
        meta.
      </>
    ),
    saleDelReparto: (Nombre: Envoltorio, nombre: string) => (
      <>
        <Nombre>{nombre}</Nombre> sale del reparto y vuelve al estante.
      </>
    ),
    cambiaElPorcentaje: (Nombre: Envoltorio, nombre: string, antes: string, despues: string) => (
      <>
        <Nombre>{nombre}</Nombre>: de {antes} a {despues} de lo que sobra.
      </>
    ),
    cambiaElSuperavit: (Nombre: Envoltorio, nombre: string, antes: string) => (
      <>
        <Nombre>{nombre}</Nombre> recibe lo que sobra, en lugar de {antes}.
      </>
    ),
  },
  cuantosCambios: (cuantos: number) =>
    cuantos === 0
      ? 'Sin cambios todavía'
      : cuantos === 1
        ? '1 cambio sin guardar'
        : `${String(cuantos)} cambios sin guardar`,
  cuantosCambiosYCuandoValen: (cuantos: number) =>
    cuantos === 0
      ? 'Sin cambios todavía · valen desde el próximo cobro'
      : cuantos === 1
        ? '1 cambio sin guardar · valen desde el próximo cobro'
        : `${String(cuantos)} cambios sin guardar · valen desde el próximo cobro`,
  paraGuardar: (problema: string) => `Para guardar: ${problema}`,
  cuantasCosas: (cuantas: number) =>
    cuantas === 1 ? 'Cambia una cosa' : `Cambian ${String(cuantas)} cosas`,
  clases: {
    sueldo: 'Sueldo',
    fijos: 'Gastos fijos',
    prioridad: 'Prioridad',
  },
  prueba: {
    llegoALaMeta: 'llegó a la meta',
    yaEstabaCompleto: 'ya estaba completo',
    completaElMonto: 'completa el monto',
    leFaltan: (falta: string) => `le faltan ${falta}`,
  },
  ficha: {
    tesoroQueYaNoEsta: 'Un tesoro que ya no está',
    laFila: 'La fila',
    comoSeReparte: 'Cómo se reparte cada cobro',
    enLaFila: 'En la fila',
    lugarEnLaFila: (numero: number, cuantos: number) => `${String(numero)} de ${String(cuantos)}`,
    delPaso: (tipo: string, lugar: string) => `${tipo} · ${lugar}`,
    delSueldo: (tipo: string, lugar: string) => `${tipo} · ${lugar} · Sueldo`,
    loQueSobra: 'Lo que sobra',
    ahorrosPorPorcentaje: 'Ahorros por porcentaje',
    superavitElResto: 'Superávit · El resto',
    enElEstante: 'En el estante',
    deLaObligacion: (lugar: string) => `Obligación · ${lugar}`,
    insumos: 'Insumos',
    loQueQuedaDeCadaSena: 'Lo que queda de cada seña',
  },
  barra: {
    editandoLaFila: 'Editando la fila',
    tesoros: 'Tesoros',
    deshacer: 'Deshacer',
    rehacer: 'Rehacer',
    descartar: 'Descartar',
    descartarLosCambios: 'Descartar los cambios',
    guardarLaFila: 'Guardar la fila',
    guardar: 'Guardar',
  },
  editar: (nombre: string) => `Editar ${nombre}`,
  listo: 'Listo',
  guardar: {
    titulo: 'Guardar la fila',
    revision: (numero: number) => `Pasa a ser la revisión ${String(numero)}`,
    sueldoPorMes:
      'El sueldo pasa a contarse por mes: los cobros del mes lo van cubriendo hasta el tope.',
    conUnCobroDe: (monto: string) => `Con un cobro de ${monto}`,
    deDondeSale: 'De dónde sale la comparación',
    comparacion: (mes: string) =>
      `Es el mismo cobro repartido con la fila de hoy y con la que estás por guardar, teniendo en cuenta lo que ya entró en ${mes}.`,
    igualQueHoy: 'Ese cobro se reparte igual que hoy.',
    tesoro: 'Tesoro',
    hoy: 'Hoy',
    conLosCambios: 'Con los cambios',
    quedaEnCero: (Nombre: Envoltorio, nombre: string, cero: string) => (
      <>
        <Nombre>{nombre}</Nombre> queda con monto {cero}: no recibe nada hasta que le pongas uno.
      </>
    ),
    cuandoValen: (mes: string) =>
      `Los cambios valen desde el próximo cobro. Los repartos que ya hiciste no cambian, y lo que ya entró en ${mes} sigue contando.`,
    seguirEditando: 'Seguir editando',
  },
  probador: {
    loQueDeja: 'Deja (cobrado menos gastos)',
    conUnTrabajo: 'Probá con un trabajo que deje',
    conQueSePrueba: 'Con qué se prueba',
    conLoDeHoy: 'Con lo de hoy',
    todoEnCero: 'Todo en cero',
    seCobro: 'Se cobró',
    ayudaDeLoCobrado: 'Todo lo que entró del trabajo, para lo que se calcula sobre lo que cobrás.',
    loQueDejaElTrabajo: 'Lo que deja el trabajo',
    sobran: (Monto: Envoltorio, monto: string) => (
      <>
        Sobran <Monto>{monto}</Monto> para repartir.
      </>
    ),
    sobranYMira: (Monto: Envoltorio, monto: string) => (
      <>
        Sobran <Monto>{monto}</Monto> para repartir. Mirá la fila.
      </>
    ),
    comoBaja: 'Cómo baja este cobro',
    diezmo: 'Diezmo',
    conPorcentaje: (nombre: string, porcentaje: string) => `${nombre} ${porcentaje}`,
    ingresoLibre: 'Ingreso libre',
    ganancia: 'Ganancia',
    loQueSobra: 'Lo que sobra',
    elResto: (nombre: string, porcentaje: string) => `${nombre}, el resto ${porcentaje}`,
    suma: 'Suma',
    daElIngreso: 'da el ingreso',
  },
  panel: {
    cerrarElDetalle: 'Cerrar el detalle',
    subir: 'Subir',
    bajar: 'Bajar',
    lugarEnLaFila: 'Lugar en la fila',
    numeroDeCuantos: (Negrita: Envoltorio, numero: number, cuantos: number) => (
      <>
        <Negrita>{String(numero)}</Negrita> de {String(cuantos)}
      </>
    ),
    vuelveAlEstante: 'Vuelve al estante con lo que tiene. Nada se borra.',
    registrarElPago: 'Registrar el pago',
    registrarElPagoDe: (nombre: string) => `Registrar el pago de ${nombre}`,
    registrarElPagoDeEsteRenglon: 'Registrar el pago de este renglón',
    porcentaje: 'Porcentaje',
    porcentajeDe: (nombre: string) => `Porcentaje de ${nombre}`,
    sobreQueSeCalcula: 'Sobre qué se calcula',
    sobreQueSeCalculaDe: (nombre: string) => `Sobre qué se calcula ${nombre}`,
    enElMes: (mes: string) => `En ${mes}`,
    apartado: 'Apartado',
    aPagar: 'A pagar',
    candadoDelDiezmo:
      'El diezmo no se puede sacar de la fila: su porcentaje y su lugar sí se cambian.',
    sacarDeLasObligaciones: 'Sacar de las obligaciones',
    venceEl: 'Vence el',
    diaDePagoDe: (nombre: string) => `Día de pago de ${nombre}`,
    diaDePagoDeEsteRenglon: 'Día de pago de este renglón',
    sinDia: 'sin día',
    renglones: 'Renglones',
    queSonLosRenglones: 'Qué son los renglones',
    ayudaDeLosRenglones:
      'Cada gasto que se paga todos los meses. El monto del compromiso es la suma: cuando cambia un renglón, cambia el monto desde el próximo cobro.',
    renglonDe: (numero: number, nombre: string) => `Renglón ${String(numero)} de ${nombre}`,
    sacarElRenglon: (nombre: string) => `Sacar el renglón ${nombre}`,
    sacarElRenglonNumero: (numero: number) => `Sacar el renglón ${String(numero)}`,
    montoDe: (nombre: string) => `Monto de ${nombre}`,
    montoDelRenglon: (numero: number) => `Monto de el renglón ${String(numero)}`,
    venceElDia: (dia: number) => `· vence el ${String(dia)}`,
    sumarUnRenglon: 'Sumar un renglón',
    montoLaSuma: 'Monto, la suma',
    rigeDesdeElProximoCobro: 'Rige desde el próximo cobro',
    rigeDesde: (mes: string, anio: string) => `Rige desde ${mes} de ${anio}`,
    monto: 'Monto',
    comoSeLlenaDe: (tipo: TipoDelPaso, nombre: string) => `${fila.tituloDelModo[tipo]} ${nombre}`,
    sueldoPorMes: 'El sueldo del Hogar va siempre por mes: el Hogar gasta su saldo todo el mes.',
    hastaLaMeta: 'Hasta la meta',
    juntaHastaLaMeta: 'Junta hasta llegar a su meta.',
    juntaSinFin: 'Junta sin fin.',
    llegoASuMeta: 'Llegó a su meta',
    leFaltan: (falta: string) => `Le faltan ${falta}`,
    deTotal: (parte: string, total: string) => `${parte} de ${total}`,
    recibio: 'Recibió',
    recibeEnCadaCobro: (monto: string) => `Recibe ${monto} en cada cobro, sin mirar el mes.`,
    loApartado: 'Lo apartado',
    nivelApartado: (nombre: string) => `${nombre}, lo apartado`,
    nivelDelMes: (nombre: string, mes: string) => `${nombre} en ${mes}`,
    sinMontoTodavia: 'Sin monto todavía',
    poneElMonto: 'Poné el monto',
    completo: 'Completo',
    faltan: (falta: string) => `Faltan ${falta}`,
    cubrirDesdeOtroTesoro: 'Cubrir desde otro tesoro',
    pagado: 'Pagado',
    queEs: 'Qué es',
    queEsDe: (nombre: string) => `Qué es ${nombre}`,
    tipoDelSueldo: (tipo: string) => `${tipo} · el sueldo del Hogar`,
    sacarDeLaFila: 'Sacar de la fila',
    seRepartePorPorcentaje: 'Se reparte por porcentaje',
    reparto: 'Reparto',
    sacarDelReparto: (nombre: string) => `Sacar a ${nombre} del reparto`,
    hastaLaMetaDe: (nombre: string) => `${nombre} hasta la meta`,
    elResto: (nombre: string) => `${nombre}, el resto`,
    repartoEnCien: (nombre: string) =>
      `El reparto llega al 100%: ${nombre} se queda solo con los centavos del redondeo.`,
    repartoConLibre: (suma: string, libre: string, nombre: string) =>
      `Los porcentajes suman ${suma}. El ${libre} que falta va a ${nombre}, que recibe lo que sobra.`,
    superavitRecibe: (libre: string) =>
      `Recibe lo que sobra después de todo: el ${libre} de lo que se reparte y los centavos del redondeo.`,
    dondeCaeLoQueSobra: 'Dónde cae lo que sobra',
    caeEn: (Negrita: Envoltorio, nombre: string) => (
      <>
        Cae en <Negrita>{nombre}</Negrita>.
      </>
    ),
    tiene: 'Tiene',
    deLaMeta: (porcentaje: string, meta: string) => `${porcentaje}% de la meta de ${meta}`,
    sumarloALaFila: 'Sumarlo a la fila',
    noRecibeYSeEdita:
      'Ahora no recibe plata de los cobros. Elegí dónde va: la fila pasa a editarse y nada viaja hasta que la guardes.',
    noRecibe: 'Ahora no recibe plata de los cobros. Elegí dónde va.',
    noRecibeConFlechas:
      'Ahora no recibe plata de los cobros. Uní una flecha hasta su ficha o elegí dónde va.',
    deLosTrabajosEnCurso: 'De los trabajos en curso',
    sinTrabajos: 'No hay trabajos en curso con plata.',
    enTrabajos: (cuantos: number) =>
      cuantos === 1
        ? 'En 1 trabajo en curso. Está en Maun hasta que el trabajo se cobra.'
        : `En ${String(cuantos)} trabajos en curso. Está en Maun hasta que el trabajo se cobra.`,
    porTrabajo: 'Por trabajo',
    unTrabajo: 'Un trabajo',
    entroYGastado: (entro: string, gastado: string) => `entró ${entro} · gastado ${gastado}`,
    lugarDeLaObligacion: (porcentaje: string, base: BaseDeLaObligacion) =>
      `${porcentaje} ${fila.base[base]}`,
    lugarDelSueldo: (modo: ModoDePaso) => `sueldo, ${fila.modo.compromiso[modo]}`,
    lugarConElResto: (tipo: TipoDelPaso, modo: ModoDePaso) =>
      `${fila.modo[tipo][modo]}, y el resto`,
    lugarDeLaParte: (porcentaje: string) => `${porcentaje} de lo que sobra`,
    lugarDeLaParteHastaLaMeta: (porcentaje: string) =>
      `${porcentaje} de lo que sobra, hasta la meta`,
    lugarDelResto: 'el resto',
    lugarDelEstante: 'estante',
    deMas: (monto: string) => `${monto} de más`,
    estante: 'Estante',
    listaDeTesoros: 'Lista de tesoros',
    queEsLaLista: 'Qué es la lista de tesoros',
    ayudaDeLaLista:
      'Todos los tesoros con lo que tienen hoy, en el orden de la fila. Tocá uno para verlo en el plano.',
    numeroEnLaFila: (numero: number) => `el ${String(numero)} de la fila, `,
    entreTodos: 'Entre todos',
    tocaUnaFicha:
      'Tocá una ficha para ver sus reglas, o probá un cobro y mirá por dónde baja la plata.',
    probarUnCobro: 'Probar un cobro',
    ingresoEnCobros: (cobros: number) =>
      cobros === 1 ? 'Ingreso en 1 cobro' : `Ingreso en ${String(cobros)} cobros`,
    obligacionesApartadas: 'Obligaciones apartadas',
    losCompromisos: 'Los compromisos',
    faltaParaLosCompromisos: 'Falta para los compromisos',
    llenos: 'llenos',
    ahorrado: 'Ahorrado',
    superavit: 'Superávit',
  },
} as const;
