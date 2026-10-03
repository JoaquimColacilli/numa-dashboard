import type { ReactNode } from 'react';

import type { Envoltorio } from '@/shared/lib';

function trabajos(cantidad: number): string {
  return cantidad === 1 ? '1 trabajo' : `${String(cantidad)} trabajos`;
}

function consultas(cantidad: number): string {
  return cantidad === 1 ? '1 consulta' : `${String(cantidad)} consultas`;
}

function fechaNumerica(dia: string): string {
  const [anio = '', mes = '', numero = ''] = dia.split('-');
  return `${numero}/${mes}/${anio}`;
}

const DIAS_DE_LA_SEMANA = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
] as const;

function elDia(fecha: string): string {
  const dia = new Date(`${fecha}T00:00:00Z`);
  const semana = (dia.getUTCDay() + 6) % 7;
  return `${DIAS_DE_LA_SEMANA[semana] ?? ''} ${String(dia.getUTCDate())}`;
}

export type FaltanParaLosTiempos = 'ambos' | 'mandarlos' | 'contesten';

const LO_QUE_FALTA_PARA_LOS_TIEMPOS: Readonly<Record<FaltanParaLosTiempos, string>> = {
  ambos: 'cuánto tardás en mandarlos y en que te contesten',
  mandarlos: 'cuánto tardás en mandarlos',
  contesten: 'cuánto tardan en contestarte',
};

function casosDeLosTiempos(cual: FaltanParaLosTiempos, cantidad: number): string {
  return cual === 'contesten'
    ? `${String(cantidad)} respuestas`
    : `${String(cantidad)} presupuestos`;
}

export const paginaEstadisticas = {
  titulo: 'Estadísticas',
  bajada: 'Cómo viene el taller, con lo que anotás en NUMA.',
  queEs: (que: string) => `Qué es: ${que}`,
  vacio: {
    titulo: 'Todavía no hay nada para contar',
    detalle: 'Cuando cobres tu primer trabajo, acá vas a ver cómo viene el taller.',
  },
  periodo: {
    leyenda: 'Período',
    largos: { tres: '3 meses', seis: '6 meses', doce: '12 meses', todo: 'Todo' },
    anteriores: (meses: number) => `Los ${String(meses)} meses anteriores`,
    siguientes: (meses: number) => `Los ${String(meses)} meses siguientes`,
    entre: (desde: string, hasta: string) => `${desde} – ${hasta}`,
    mesYAnio: (mes: string, anio: string) => `${mes} ${anio}`,
    mesDeOtroAnio: (mes: string, anio: string) => `${mes} de ${anio}`,
    desde: (cuando: string) => `Desde ${cuando}`,
    contra: (rango: string) => `contra ${rango}`,
    contraHastaElMismoDia: (rango: string) => `contra ${rango}, hasta el mismo día`,
    enLaFrase: (desde: string, hasta: string) => `entre ${desde} y ${hasta}`,
    desdeEnLaFrase: (cuando: string) => `desde ${cuando}`,
    trimestre: (numero: number) => `T${String(numero)}`,
  },
  meses: {
    m01: 'ene',
    m02: 'feb',
    m03: 'mar',
    m04: 'abr',
    m05: 'may',
    m06: 'jun',
    m07: 'jul',
    m08: 'ago',
    m09: 'sept',
    m10: 'oct',
    m11: 'nov',
    m12: 'dic',
  },
  probaCon: {
    tres: 'Probá con 6 o 12 meses.',
    seis: 'Probá con 12 meses.',
    doce: 'Probá con «Todo».',
  },
  ayudas: {
    dejaron: (hasta: string) =>
      `Lo que cobraste de cada trabajo menos lo que gastaste en él, de los trabajos que terminaste de cobrar en estos meses. Es el ingreso de la fila, el mismo que ves mes a mes en Inicio, e incluye la seña que te quedó de un trabajo perdido. Para comparar meses, los lleva a pesos de hoy con la inflación del INDEC, que llega hasta ${hasta}.`,
    dejaronConElIndiceViejo: (hasta: string) =>
      `Lo que cobraste de cada trabajo menos lo que gastaste en él, de los trabajos que terminaste de cobrar en estos meses. Es el ingreso de la fila, el mismo que ves mes a mes en Inicio, e incluye la seña que te quedó de un trabajo perdido. La inflación del INDEC que trae esta versión llega hasta ${hasta} y falta la de los últimos meses, así que los meses van en pesos de cada mes.`,
    gastos:
      'Todo lo que salió de Maun como gasto: lo de los trabajos, por la categoría que elegiste, y lo del taller, por la categoría del movimiento. Lo que pagás desde otros tesoros, como los compromisos de la fila, lo ves en Finanzas.',
    loQueMasUsas:
      'En cuántos trabajos anotaste cada cosa en «Lo que hace falta». Cuenta veces, no plata ni cantidades, y junta los nombres que solo cambian en mayúsculas o acentos.',
    entregas:
      'Días corridos desde que arrancaste hasta que lo entregaste. La mitad de los trabajos tardó menos que eso y la otra mitad más, así que un trabajo que se estiró no lo mueve. A tiempo es el día de la entrega comprometida o antes. Los trabajos del sistema viejo no tienen el día de la entrega.',
    consultas: (desde: string) =>
      `Las consultas que entraron en estos meses y dónde están hoy. Cuenta como presupuesto también lo que aprobaste directo. NUMA anota las etapas desde el ${fechaNumerica(desde)}.`,
    opiniones:
      'Las encuestas que mandaste en estos meses y lo que contestaron. La encuesta lleva tu nombre y el del cliente: no es anónima, así que suele dar alto.',
    viene:
      'Los trabajos en curso, con los días desde que arrancaste, y lo que te deben de lo que ya entregaste (Inicio suma además lo que está en curso). Lo que tardás normalmente sale de tus entregas de los últimos 12 meses.',
    pesosDeHoy:
      'Los montos de otros meses llevados a precios de hoy con la inflación del INDEC, para poder compararlos. Los dos últimos meses van como se cobraron, porque el INDEC todavía no publicó su inflación.',
  },
  resumen: {
    loQueTeDejaron: 'Lo que te dejaron los trabajos',
    mas: (porcentaje: string, rango: string) => `${porcentaje} % más que en ${rango}`,
    menos: (porcentaje: string, rango: string) => `${porcentaje} % menos que en ${rango}`,
    igual: (rango: string) => `Igual que en ${rango}`,
    contandoLaInflacion: 'ya contando la inflación',
    enPesosDeCadaMes: 'en pesos de cada mes',
    teDejaron: (rango: string, monto: string, cantidad: number) =>
      `En ${rango} te dejaron ${monto}, de ${trabajos(cantidad)}`,
    conCasosVas: (cantidad: number) =>
      `Con ${trabajos(cantidad)} en cada período vas a ver cuánto cambió`,
    sinCobrarAntes: (rango: string) => `En ${rango} no cobraste trabajos`,
    deCada100: (Fuerte: Envoltorio, cien: string, quedaron: string): ReactNode => (
      <>
        De cada <Fuerte>{cien}</Fuerte> que cobraste, te quedaron <Fuerte>{quedaron}</Fuerte>.
      </>
    ),
    seComieron: 'Los gastos se comieron lo que cobraste en estos meses.',
    elPeriodo: 'el período',
    base: (cobrados: number, perdidos: number, enDolares: number) => {
      const lasSenas =
        perdidos === 0
          ? null
          : perdidos === 1
            ? 'la seña de 1 perdido'
            : `la seña de ${String(perdidos)} perdidos`;
      const dolares = enDolares === 0 ? '' : `, ${String(enDolares)} en dólares por sus pesos`;
      if (cobrados === 0) {
        return lasSenas === null
          ? ''
          : `${lasSenas.charAt(0).toUpperCase()}${lasSenas.slice(1)}${dolares}`;
      }
      const cobradosTexto =
        cobrados === 1 ? '1 trabajo cobrado' : `${String(cobrados)} trabajos cobrados`;
      return `${cobradosTexto}${lasSenas === null ? '' : ` y ${lasSenas}`}${dolares}`;
    },
  },
  tarjetas: {
    nombre: 'Las cifras del período',
    sinDato: '—',
    kDeN: (Chico: Envoltorio, cuantos: number, deCuantos: number): ReactNode => (
      <>
        {String(cuantos)} <Chico>de {String(deCuantos)}</Chico>
      </>
    ),
    porcentaje: (porcentaje: string) => `${porcentaje} %`,
    gastaste: {
      etiqueta: 'Gastaste',
      debajo: 'en los trabajos y el taller',
      vacio: 'Sin gastos en estos meses',
    },
    entrega: {
      etiqueta: 'Tiempo de entrega',
      dias: (Chico: Envoltorio, numero: string, cantidad: number): ReactNode => (
        <>
          {numero} <Chico>{cantidad === 1 ? 'día' : 'días'}</Chico>
        </>
      ),
      entre: (Chico: Envoltorio, desde: string, hasta: string): ReactNode => (
        <>
          {desde} a {hasta} <Chico>días</Chico>
        </>
      ),
      aTiempo: (aTiempo: number, total: number) =>
        `${String(aTiempo)} de ${String(total)}, a tiempo`,
      aTiempoConPorcentaje: (porcentaje: string, aTiempo: number, total: number) =>
        `${porcentaje} % a tiempo (${String(aTiempo)} de ${String(total)})`,
      deAUna: (entregas: number) =>
        entregas === 1 ? '1 entrega' : `${String(entregas)} entregas, de a una`,
      sinPromesas: 'sin fecha prometida',
      vacio: 'Sin entregas en estos meses',
    },
    aprobaron: {
      etiqueta: 'Te aprobaron',
      debajo: (esperan: number) =>
        esperan === 0
          ? 'presupuestos'
          : esperan === 1
            ? 'presupuestos · 1 espera'
            : `presupuestos · ${String(esperan)} esperan`,
      debajoConCuenta: (cuantos: number, deCuantos: number, esperan: number) =>
        esperan === 0
          ? `${String(cuantos)} de ${String(deCuantos)} presupuestos`
          : `${String(cuantos)} de ${String(deCuantos)} presupuestos · ${String(esperan)} ${
              esperan === 1 ? 'espera' : 'esperan'
            }`,
      vacio: 'Sin presupuestos en estos meses',
    },
    conformes: {
      etiqueta: 'Conformes',
      debajo: 'clientes que contestaron',
      debajoConCuenta: (cuantos: number, deCuantos: number) =>
        `${String(cuantos)} de ${String(deCuantos)} clientes que contestaron`,
      vacio: 'Sin respuestas en estos meses',
    },
  },
  secciones: {
    dejaron: '¿Cuánto me dejaron los trabajos?',
    gastos: '¿En qué se me va la plata?',
    entregas: '¿Llego a tiempo?',
    consultas: '¿Cuántos presupuestos me aprueban?',
    opiniones: '¿Qué opinan mis clientes?',
    viene: '¿Qué viene?',
  },
  dejaron: {
    frase: (Fuerte: Envoltorio, cobrados: number, total: string): ReactNode => (
      <>
        Cobraste <Fuerte>{trabajos(cobrados)}</Fuerte> y te dejaron <Fuerte>{total}</Fuerte>.
      </>
    ),
    fraseSoloSenas: (Fuerte: Envoltorio, perdidos: number, total: string): ReactNode => (
      <>
        No cobraste trabajos, y te quedó <Fuerte>{total}</Fuerte> de la seña de{' '}
        {perdidos === 1 ? '1 trabajo perdido' : `${String(perdidos)} trabajos perdidos`}.
      </>
    ),
    mejorMes: (Fuerte: Envoltorio, mes: string, monto: string, cantidad: number): ReactNode => (
      <>
        {mes} fue tu mejor mes: <Fuerte>{monto}</Fuerte> de {trabajos(cantidad)}.
      </>
    ),
    mejorTrimestre: (
      Fuerte: Envoltorio,
      trimestre: string,
      monto: string,
      cantidad: number,
    ): ReactNode => (
      <>
        Tu mejor trimestre fue {trimestre}: <Fuerte>{monto}</Fuerte> de {trabajos(cantidad)}.
      </>
    ),
    mejorAnio: (Fuerte: Envoltorio, anio: string, monto: string, cantidad: number): ReactNode => (
      <>
        {anio} fue tu mejor año: <Fuerte>{monto}</Fuerte> de {trabajos(cantidad)}.
      </>
    ),
    subtitulo:
      'Por el mes en que terminaste de cobrar cada trabajo. Los meses de antes, llevados a pesos de hoy.',
    subtituloEnPesosDeCadaMes:
      'Por el mes en que terminaste de cobrar cada trabajo, en pesos de cada mes.',
    figura: 'Lo que te dejaron los trabajos, mes por mes',
    tocaUnMes: 'Tocá un mes para ver cuánto te dejó y qué trabajos fueron.',
    tocaUnaColumna: 'Tocá una columna para ver cuánto te dejó y qué trabajos fueron.',
    lectura: (Fuerte: Envoltorio, monto: string, cuando: string, cantidad: number): ReactNode => (
      <>
        <Fuerte>{monto}</Fuerte> en {cuando} · {trabajos(cantidad)}
      </>
    ),
    lecturaConHoy: (
      Fuerte: Envoltorio,
      deHoy: string,
      cuando: string,
      comoSeCobro: string,
      cantidad: number,
    ): ReactNode => (
      <>
        <Fuerte>{deHoy}</Fuerte> en {cuando}, en pesos de hoy · {comoSeCobro} como se cobró ·{' '}
        {trabajos(cantidad)}
      </>
    ),
    lecturaSinTrabajos: (cuando: string) => `En ${cuando} no cobraste trabajos.`,
    verLosDe: (cantidad: number, cuando: string) =>
      cantidad === 1
        ? `Ver el trabajo de ${cuando}`
        : `Ver los ${String(cantidad)} trabajos de ${cuando}`,
    columna: (cuando: string, monto: string, cantidad: number) =>
      `${cuando}: ${monto} en pesos de hoy, ${trabajos(cantidad)}`,
    columnaEnPesosDeCadaMes: (cuando: string, monto: string, cantidad: number) =>
      `${cuando}: ${monto}, ${trabajos(cantidad)}`,
    columnaVacia: (cuando: string) => `${cuando}: sin trabajos cobrados`,
    sinRegistro: 'sin registro',
    hastaHoy: (cuando: string) => `* ${cuando}, hasta hoy.`,
    trabajosDe: (cuando: string) => `Los trabajos de ${cuando}`,
    trabajosDelPeriodo: 'Los trabajos del período',
    cobradoEl: (dia: string) => `cobrado el ${dia}`,
    senaDeUnPerdido: 'seña de un trabajo perdido',
    cuenta: (cobrado: string, gastos: string) => `${cobrado} − ${gastos}`,
    totalDe: (cuando: string) => `Total de ${cuando}`,
    totalDelPeriodo: 'Total del período',
    verLosDelPeriodo: (cantidad: number) =>
      cantidad === 1 ? 'Ver el trabajo' : `Ver los ${String(cantidad)} trabajos`,
    esconderLaLista: 'Esconder la lista',
    vacio: (rango: string) => `En ${rango} no cobraste ningún trabajo.`,
    vacioDeTodo: 'Todavía no cobraste ningún trabajo.',
    estimado: {
      titulo: 'Lo que estimaste y lo que te quedó',
      deCadaCien: (cien: string) => `de cada ${cien} de cada trabajo`,
      loQueEstimaste: 'lo que estimaste',
      loQueTeQuedo: 'lo que te quedó',
      descripcion: (titulo: string, estimado: string, real: string, cien: string) =>
        `${titulo}: estimaste ${estimado} de cada ${cien} y te quedaron ${real}`,
      verTodos: (cantidad: number) => `Ver los ${String(cantidad)} trabajos`,
      verMenos: 'Ver menos',
      sinCostos:
        'Cuando cargues los costos estimados de un trabajo, acá vas a ver cuánto te quedó contra lo que estimaste.',
    },
    tabla: {
      titulo: {
        mes: 'Lo que te dejaron los trabajos, por mes.',
        trimestre: 'Lo que te dejaron los trabajos, por trimestre.',
        anio: 'Lo que te dejaron los trabajos, por año.',
      },
      enNegrita: 'En negrita, el período elegido.',
      cuando: { mes: 'Mes', trimestre: 'Trimestre', anio: 'Año' },
      trabajos: 'Trabajos',
      comoSeCobro: 'Como se cobró',
      enPesosDeHoy: 'En pesos de hoy',
      hastaHoy: (cuando: string) => `${cuando} (hasta hoy)`,
    },
  },
  gastos: {
    frase: (
      Fuerte: Envoltorio,
      cuando: string,
      total: string,
      enLosTrabajos: string,
      enElTaller: string,
    ): ReactNode => (
      <>
        {cuando} gastaste <Fuerte>{total}</Fuerte>: <Fuerte>{enLosTrabajos}</Fuerte> en los trabajos
        y <Fuerte>{enElTaller}</Fuerte> en el taller.
      </>
    ),
    fraseSoloTrabajos: (Fuerte: Envoltorio, cuando: string, total: string): ReactNode => (
      <>
        {cuando} gastaste <Fuerte>{total}</Fuerte>, todo en los trabajos.
      </>
    ),
    fraseSoloTaller: (Fuerte: Envoltorio, cuando: string, total: string): ReactNode => (
      <>
        {cuando} gastaste <Fuerte>{total}</Fuerte>, todo en el taller.
      </>
    ),
    subtitulo:
      'Por el día de cada gasto. Los de los trabajos van por la categoría que elegiste al cargarlos.',
    figura: 'Lo que gastaste, por categoría',
    enLosTrabajos: 'En los trabajos',
    enElTaller: 'En el taller',
    sinCategoria: 'Sin categoría',
    falta: (monto: string) =>
      `${monto} son gastos sin categoría. Desde ahora, al cargar un gasto en el trabajo elegís si fue madera, herrajes, flete, ayudante u otro.`,
    loQueMasUsas: 'Lo que más usás',
    enCuantosTrabajos: 'en cuántos trabajos lo anotaste en «Lo que hace falta»',
    materiales: 'Materiales',
    herrajes: 'Herrajes',
    enTrabajos: (Chico: Envoltorio, cantidad: number): ReactNode => (
      <>
        {String(cantidad)} <Chico>{cantidad === 1 ? 'trabajo' : 'trabajos'}</Chico>
      </>
    ),
    yMas: (cantidad: number) => `y ${String(cantidad)} más`,
    sinMateriales: 'Sin materiales en estos meses.',
    sinHerrajes: 'Sin herrajes en estos meses.',
    sinNadaAnotado:
      'Cuando anotes materiales y herrajes en «Lo que hace falta» de tus trabajos, acá vas a ver cuáles usás más.',
    tabla: {
      titulo: 'Lo que gastaste, por categoría',
      categoria: 'Categoría',
      monto: 'Monto',
      deCadaCien: (cien: string) => `De cada ${cien} de lo gastado`,
      enLosTrabajos: (categoria: string) => `${categoria}, en los trabajos`,
      enElTaller: (categoria: string) => `${categoria}, en el taller`,
    },
    irAFinanzas: 'Ver los gastos en Finanzas',
    vacio: (rango: string) => `En ${rango} no anotaste gastos.`,
    vacioDeTodo: 'Todavía no anotaste gastos.',
  },
  entregas: {
    frase: (Fuerte: Envoltorio, aTiempo: number, conFecha: number, tardas: string): ReactNode => (
      <>
        Entregaste{' '}
        <Fuerte>
          {String(aTiempo)} de {String(conFecha)}
        </Fuerte>{' '}
        trabajos el día que prometiste o antes. Tardás <Fuerte>{tardas}</Fuerte>: la mitad de los
        trabajos tarda menos.
      </>
    ),
    fraseConPorcentaje: (
      Fuerte: Envoltorio,
      aTiempo: number,
      conFecha: number,
      porcentaje: string,
      tardas: string,
    ): ReactNode => (
      <>
        Entregaste{' '}
        <Fuerte>
          {String(aTiempo)} de {String(conFecha)}
        </Fuerte>{' '}
        trabajos ({porcentaje} %) el día que prometiste o antes. Tardás <Fuerte>{tardas}</Fuerte>:
        la mitad de los trabajos tarda menos.
      </>
    ),
    fraseSinPromesas: (Fuerte: Envoltorio, tardas: string): ReactNode => (
      <>
        Tardás <Fuerte>{tardas}</Fuerte>: la mitad de los trabajos tarda menos.
      </>
    ),
    fraseConPocos: (
      Fuerte: Envoltorio,
      cantidad: number,
      tardaste: string,
      faltan: number,
    ): ReactNode => (
      <>
        Entregaste <Fuerte>{trabajos(cantidad)}</Fuerte>: tardaste {tardaste}. Con{' '}
        {faltan === 1 ? '1 entrega más' : `${String(faltan)} entregas más`} vas a ver cuánto tardás
        normalmente.
      </>
    ),
    subtitulo: (cantidad: number, cuando: string) =>
      cantidad === 1
        ? `El trabajo que entregaste ${cuando}, desde que arrancaste hasta que lo entregaste, en días corridos.`
        : `Los ${String(cantidad)} trabajos que entregaste ${cuando}, desde que arrancaste hasta que lo entregaste, en días corridos.`,
    subtituloSinEntregas: 'Desde que arrancaste hasta que lo entregaste, en días corridos.',
    aTiempo: 'a tiempo',
    tarde: 'tarde',
    sinFecha: 'sin fecha prometida',
    figura: 'Cuántos días tardó cada trabajo',
    mediana: (dias: string) => `la mitad, en menos de ${dias}`,
    cota: (desde: string, hasta: string) => `de ${desde} a ${hasta} días`,
    diasCortos: (dias: string) => `${dias} d`,
    atraso: (dias: number) => `+${String(dias)}`,
    tardeDias: (dias: number) => (dias === 1 ? '1 día tarde' : `${String(dias)} días tarde`),
    punto: (titulo: string, dias: string, como: string) => `${titulo}: ${dias}, ${como}`,
    lectura: (Fuerte: Envoltorio, titulo: ReactNode, dias: string, como: string): ReactNode => (
      <>
        <Fuerte>{titulo}</Fuerte> · {dias} · {como}
      </>
    ),
    tocaUnPunto: 'Tocá un punto para ver de qué trabajo es.',
    verElTrabajo: 'Ver el trabajo',
    porTipo: 'Por tipo de trabajo',
    medianaDesde: (cantidad: number) => `mediana desde ${String(cantidad)} trabajos de un tipo`,
    deAUno: 'De a uno:',
    tabla: {
      titulo: 'Las entregas del período, una por una',
      trabajo: 'Trabajo',
      arranco: 'Arrancó',
      entrego: 'Entregó',
      dias: 'Días',
      prometida: 'Fecha prometida',
      comoLlego: 'Cómo llegó',
      aTiempo: 'A tiempo',
      tarde: (dias: number) => (dias === 1 ? '1 día tarde' : `${String(dias)} días tarde`),
      sinFecha: 'Sin fecha prometida',
    },
    irAlAnalitico: 'Ver el analítico de entregas',
    vacio: (rango: string) => `En ${rango} no entregaste trabajos con su día de entrega.`,
    vacioDeTodo: 'Todavía no entregaste trabajos con su día de entrega.',
  },
  consultas: {
    frase: (
      Fuerte: Envoltorio,
      cuantas: number,
      presupuestos: number,
      trabajosHechos: number,
      esperan: number,
      desde: string | null,
    ): ReactNode => (
      <>
        De <Fuerte>{consultas(cuantas)}</Fuerte> que te {cuantas === 1 ? 'entró' : 'entraron'}
        {desde === null ? '' : ` desde el ${desde}`},{' '}
        {presupuestos === 0 ? (
          'no mandaste presupuestos'
        ) : (
          <>
            a <Fuerte>{String(presupuestos)}</Fuerte> {presupuestos === 1 ? 'le' : 'les'} mandaste
            presupuesto
          </>
        )}{' '}
        y{' '}
        {trabajosHechos === 0 ? (
          'ninguna se volvió trabajo.'
        ) : (
          <>
            <Fuerte>{String(trabajosHechos)}</Fuerte>{' '}
            {trabajosHechos === 1 ? 'se volvió trabajo.' : 'se volvieron trabajo.'}
          </>
        )}
        {esperan === 0
          ? ''
          : esperan === 1
            ? ' 1 presupuesto espera respuesta.'
            : ` ${String(esperan)} presupuestos esperan respuesta.`}
      </>
    ),
    subtitulo: (cuando: string) => `Las consultas que entraron ${cuando}, y dónde están hoy.`,
    antesDelRegistro: (desde: string) =>
      `NUMA anota las etapas desde el ${fechaNumerica(desde)}: lo de antes no tiene fecha.`,
    figura: 'De las consultas a los trabajos',
    pasos: {
      consultas: 'Consultas',
      presupuestos: 'Presupuestos mandados',
      trabajos: 'Se volvieron trabajo',
    },
    cuenta: (Fuerte: Envoltorio, cuantas: number, deCuantas: number): ReactNode => (
      <>
        <Fuerte>{String(cuantas)}</Fuerte> de {String(deCuantas)}
      </>
    ),
    primera: (Fuerte: Envoltorio, cuantas: number): ReactNode => <Fuerte>{String(cuantas)}</Fuerte>,
    perdiste: (perdidas: number, despues: number, antes: number) =>
      perdidas === 0
        ? 'No perdiste ninguna.'
        : `Perdiste ${String(perdidas)}: ${String(despues)} después del presupuesto y ${String(antes)} antes.`,
    siguenAbiertas: (abiertas: number) =>
      abiertas === 0
        ? ''
        : abiertas === 1
          ? ' Sigue abierta 1.'
          : ` Siguen abiertas ${String(abiertas)}.`,
    presupuestosQueMandaste: 'Los presupuestos que mandaste',
    unoPorPresupuesto: 'uno por presupuesto',
    aprobados: (Fuerte: Envoltorio, cuantos: number): ReactNode => (
      <>
        <Fuerte>{String(cuantos)}</Fuerte> {cuantos === 1 ? 'aprobado' : 'aprobados'}
      </>
    ),
    perdidos: (Fuerte: Envoltorio, cuantos: number): ReactNode => (
      <>
        <Fuerte>{String(cuantos)}</Fuerte> {cuantos === 1 ? 'perdido' : 'perdidos'}
      </>
    ),
    esperan: (Fuerte: Envoltorio, cuantos: number): ReactNode => (
      <>
        <Fuerte>{String(cuantos)}</Fuerte>{' '}
        {cuantos === 1 ? 'espera respuesta' : 'esperan respuesta'}
      </>
    ),
    sinCasos: '—',
    alPresupuesto: 'de la consulta al presupuesto',
    aLaRespuesta: 'del presupuesto a la respuesta',
    medianaDe: (cuantos: number) => `mediana de ${String(cuantos)}`,
    faltan: (embudo: number | null, tiempos: FaltanParaLosTiempos | null, casos: number) => {
      const paraElEmbudo =
        embudo === null
          ? null
          : `Con ${consultas(embudo)} vas a ver el camino de la consulta al trabajo`;
      if (tiempos === null) return `${paraElEmbudo ?? ''}.`;
      const queVas = LO_QUE_FALTA_PARA_LOS_TIEMPOS[tiempos];
      const conCuantos = casosDeLosTiempos(tiempos, casos);
      return paraElEmbudo === null
        ? `Con ${conCuantos} vas a ver ${queVas}.`
        : `${paraElEmbudo}, y con ${conCuantos}, ${queVas}.`;
    },
    tabla: {
      titulo: 'De las consultas a los trabajos',
      paso: 'Paso',
      cuantas: 'Cuántas',
      deCuantas: 'De cuántas',
      tiempos: 'Cuánto tarda cada paso',
      tiempo: 'Tiempo',
      mediana: 'La mitad, en menos de',
      sobreCuantos: 'Sobre cuántos',
      sinDato: '—',
    },
    verLas: (cuantas: number) =>
      cuantas === 1 ? 'Ver la consulta' : `Ver las ${String(cuantas)} consultas`,
    esconderLaLista: 'Esconder la lista',
    lasConsultas: 'Las consultas del período',
    entro: (dia: string) => `entró el ${dia}`,
    donde: {
      trabajo: 'Se volvió trabajo',
      perdida: 'Perdida',
      abierta: 'Sigue abierta',
    },
    vacio: (rango: string) => `En ${rango} no te entraron consultas.`,
    vacioDeTodo: 'Todavía no te entraron consultas desde que NUMA anota las etapas.',
  },
  opiniones: {
    frase: (Fuerte: Envoltorio, conformes: number, contestaron: number): ReactNode => (
      <>
        <Fuerte>
          {String(conformes)} de {String(contestaron)}
        </Fuerte>{' '}
        clientes quedaron conformes o muy conformes con el mueble.
      </>
    ),
    fraseConPorcentaje: (
      Fuerte: Envoltorio,
      conformes: number,
      contestaron: number,
      porcentaje: string,
    ): ReactNode => (
      <>
        <Fuerte>
          {String(conformes)} de {String(contestaron)}
        </Fuerte>{' '}
        clientes ({porcentaje} %) quedaron conformes o muy conformes con el mueble.
      </>
    ),
    fraseConPocos: (
      Fuerte: Envoltorio,
      contestaron: number,
      conformes: number,
      todosMuyConformes: boolean,
    ): ReactNode => {
      const como = todosMuyConformes ? 'muy conforme' : 'conforme o muy conforme';
      if (contestaron === 1) {
        return conformes === 1 ? (
          <>
            Te contestó <Fuerte>1 cliente</Fuerte>, y quedó {como} con el mueble.
          </>
        ) : (
          <>
            Te contestó <Fuerte>1 cliente</Fuerte>.
          </>
        );
      }
      const quienes =
        conformes === contestaron
          ? `los ${String(contestaron)} quedaron ${todosMuyConformes ? 'muy conformes' : 'conformes o muy conformes'}`
          : conformes === 0
            ? 'ninguno quedó conforme o muy conforme'
            : `${String(conformes)} quedaron conformes o muy conformes`;
      return (
        <>
          Te contestaron <Fuerte>{`${String(contestaron)} clientes`}</Fuerte>, y {quienes} con el
          mueble.
        </>
      );
    },
    fraseSinEscala: (Fuerte: Envoltorio, contestaron: number): ReactNode => (
      <>
        Te {contestaron === 1 ? 'contestó' : 'contestaron'}{' '}
        <Fuerte>{contestaron === 1 ? '1 cliente' : `${String(contestaron)} clientes`}</Fuerte>.
      </>
    ),
    sinRespuestas: (enviadas: number) =>
      enviadas === 1
        ? 'Mandaste 1 encuesta y todavía no te contestaron.'
        : `Mandaste ${String(enviadas)} encuestas y todavía no te contestaron.`,
    subtitulo: (enviadas: number, cuando: string, contestaron: number) =>
      enviadas === 1
        ? `De la encuesta que mandaste ${cuando}, ${contestaron === 1 ? 'te contestaron' : 'todavía no te contestaron'}.`
        : `De las ${String(enviadas)} encuestas que mandaste ${cuando}, contestaron ${String(contestaron)}.`,
    subtituloSinEncuestas: (cuando: string) =>
      `Las encuestas que mandaste ${cuando} y lo que contestaron.`,
    unPuntoPorPersona: 'un punto por persona',
    losDosDeArriba: 'los dos de arriba de la escala',
    elResto: 'el resto',
    tiempos: 'Los tiempos',
    trato: 'El trato',
    kDeN: (cuantos: number, deCuantos: number) => `${String(cuantos)} de ${String(deCuantos)}`,
    kDeNConPorcentaje: (cuantos: number, deCuantos: number, porcentaje: string) =>
      `${String(cuantos)} de ${String(deCuantos)} (${porcentaje} %)`,
    irAOpiniones: 'Ver las respuestas en Opiniones',
    vacio: (rango: string) => `En ${rango} no mandaste encuestas.`,
    vacioDeTodo: 'Todavía no mandaste encuestas.',
  },
  viene: {
    frase: (
      Fuerte: Envoltorio,
      enCurso: number,
      listos: number,
      teDeben: string | null,
      entregados: number,
    ): ReactNode => (
      <>
        {enCurso === 0 ? (
          'No tenés trabajos en curso.'
        ) : (
          <>
            Tenés{' '}
            <Fuerte>
              {enCurso === 1 ? '1 trabajo en curso' : `${String(enCurso)} trabajos en curso`}
            </Fuerte>
            {listos === 0
              ? '.'
              : enCurso === 1
                ? ' y ya está listo.'
                : listos === 1
                  ? ' y 1 ya está listo.'
                  : ` y ${String(listos)} ya están listos.`}
          </>
        )}
        {teDeben === null ? null : (
          <>
            {' '}
            Te deben <Fuerte>{teDeben}</Fuerte> de{' '}
            {entregados === 1 ? '1 trabajo entregado' : `${String(entregados)} trabajos entregados`}
            .
          </>
        )}
      </>
    ),
    nada: 'No tenés trabajos en curso ni nada por cobrar.',
    yEnDolares: (pesos: string, dolares: string) => `${pesos} y ${dolares}`,
    subtitulo: (hoy: string) => `Hoy, ${hoy}. Esto no cambia con el período.`,
    enCurso: 'En curso',
    diasContraLoNormal: 'días desde que arrancaste, contra lo que tardás normalmente',
    diasDesdeQueArrancaste: 'días desde que arrancaste',
    loNormal: (dias: string) => `${dias}, lo que tardás normalmente`,
    hastaLaPromesa: 'hasta la fecha prometida',
    detalle: (dias: string, cuando: string) => `${dias} · ${cuando}`,
    prometidoParaHoy: 'Prometido para hoy',
    prometidoParaElDia: (fecha: string) => `Prometido para el ${elDia(fecha)}`,
    prometidoPara: (dia: string) => `Prometido para el ${dia}`,
    estimadoParaHoy: 'Estimado para hoy',
    estimadoParaElDia: (fecha: string) => `Estimado para el ${elDia(fecha)}`,
    estimadoPara: (dia: string) => `Estimado para el ${dia}`,
    sinFechaPrometida: 'Sin fecha prometida',
    sinArranque: 'Sin fecha de inicio',
    listo: 'Listo',
    atrasado: (dias: number) => (dias === 1 ? 'Atrasado 1 día' : `Atrasado ${String(dias)} días`),
    paso: (dias: string) => `Pasó los ${dias}`,
    porCobrar: 'Por cobrar',
    delMasViejo: 'de lo que ya entregaste, del más viejo al más nuevo',
    entregado: (cuando: string) => `entregado ${cuando}`,
    sinDiaDeEntrega: 'sin día de entrega',
    teDeben: 'Te deben',
    irAActivos: 'Ver los activos',
  },
} as const;
