export const fila = {
  laFilaRepartePesos: 'La fila reparte pesos: un tesoro en dólares queda en el estante.',
  grupos: {
    obligaciones: 'Obligaciones',
    compromisos: 'Compromisos',
    ahorros: 'Ahorros',
    superavit: 'Superávit',
  },
  queEs: {
    caja: 'Caja',
    'deuda-destinada': 'Deuda destinada',
    'deuda-obligatoria': 'Deuda obligatoria',
    meta: 'Meta',
  },
  ayudasDeLoQueEs: {
    caja: {
      que: 'Qué es una caja',
      texto: 'Junta sin tope. No vence ni vuelve a cero sola. Maun es la caja general del taller.',
    },
    'deuda-destinada': {
      que: 'Qué es una deuda destinada',
      texto:
        'Se lleva una parte de cada cobro, en porcentaje o un monto fijo. Queda para entregar hasta que registrás el pago.',
    },
    'deuda-obligatoria': {
      que: 'Qué es una deuda obligatoria',
      texto:
        'Junta hasta su tope entre un vencimiento y el siguiente. El día de pago se paga y arranca de cero. Si no llegó al tope, lo que falta lo pone Maun.',
    },
    meta: {
      que: 'Qué es una meta',
      texto:
        'Junta hasta llegar al objetivo. Cuando llega, deja de recibir y lo que le tocaba sigue hacia abajo.',
    },
    pagaSola: {
      que: 'Qué quiere decir que se paga sola',
      texto:
        'El día de pago, NUMA anota el pago. Si no juntó el tope, lo pone Maun y queda anotado como deuda interna.',
    },
    adelanto: {
      que: 'Qué es un adelanto',
      texto: 'Si sacás una parte antes del día de pago, anotala acá: ese día se descuenta.',
    },
    deudaInterna: {
      que: 'Qué es la deuda interna',
      texto: 'Lo que Maun puso para cubrir un pago que no llegó a su tope.',
    },
  },
  paraCuando: (mes: string, anio: string) => `para ${mes} de ${anio}`,
  descripcionDelTipo: {
    obligacion: 'obligación',
    compromiso: 'compromiso',
    'ahorro-fijo': 'ahorro',
    'ahorro-por-porcentaje': 'ahorro',
    superavit: 'superávit',
  },
  descripcionDeLosInsumos: 'insumos',
  tituloDelModo: {
    compromiso: 'Cómo se llena',
    'ahorro-fijo': 'Cómo se aparta',
  },
  modo: {
    compromiso: { mes: 'por mes', saldo: 'se renueva al pagar', trabajo: 'por trabajo' },
    'ahorro-fijo': { mes: 'por mes', saldo: 'se repone al usarlo', trabajo: 'por trabajo' },
  },
  opcionDelModo: {
    compromiso: { mes: 'Por mes', saldo: 'Se renueva al pagar', trabajo: 'Por trabajo' },
    'ahorro-fijo': { mes: 'Por mes', saldo: 'Se repone al usarlo', trabajo: 'Por trabajo' },
  },
  base: {
    cobrado: 'sobre lo que cobrás',
    ingreso: 'sobre el ingreso',
  },
  etiquetaDeLaBase: {
    cobrado: 'Lo que cobrás',
    ingreso: 'El ingreso',
  },
  lugares: {
    obligacion: 'Como obligación',
    compromiso: 'Como compromiso',
    'ahorro-fijo': 'Como ahorro fijo',
    reparto: 'En el reparto',
    superavit: 'Que reciba lo que sobra',
  },
  ayudas: {
    fila: {
      que: 'Cómo se lee la fila',
      entraArriba: 'Cada ingreso entra arriba y baja por la fila.',
      primeroLasObligaciones:
        'Primero salen las obligaciones. Después se llenan los compromisos y los ahorros fijos, en el orden de los números.',
      loQueSobra: 'Lo que sobra se reparte por porcentaje, y lo que queda es el superávit.',
      bordeDeTrazos: 'Una ficha con borde de trazos no recibe nada en la prueba.',
    },
    mapa: {
      que: 'Qué muestra el ingreso',
      texto:
        'Es el mapa de cómo se reparte cada cobro. Los montos son de una prueba o de lo que entró en el mes. Cuando cobrás un trabajo, el cobro te muestra cómo se repartió.',
    },
    monto: {
      que: 'Qué es el monto',
      texto: (monto: string) =>
        `Recibe hasta ${monto}, según cómo se llena. Lo que pasa de eso sigue abajo, al paso que viene.`,
    },
    lugar: {
      que: 'Cómo funciona el orden',
      texto:
        'La plata pasa por el 1, después por el 2, y así: primero las obligaciones, después los compromisos y los ahorros fijos. Lo que llega abajo de todo se reparte.',
    },
    reparto: {
      que: 'Cómo se reparte lo que sobra',
      texto:
        'Divide lo que sobra después de los ahorros fijos. Lo que no se reparte va al superávit.',
      conEjemplo: (porcentaje: string, sobrante: string, parte: string) =>
        `Divide lo que sobra después de los ahorros fijos. El ${porcentaje}% de ${sobrante} son ${parte}. Lo que no se reparte va al superávit.`,
    },
    loDeHoy: {
      que: 'Con qué se prueba',
      texto:
        'Cada paso arranca con lo que ya tiene: lo del mes o su saldo, según cómo se llena. Todo en cero es como si todos estuvieran vacíos.',
    },
    prueba: {
      que: 'Cómo se prueba un cobro',
      texto: 'Escribí lo que te dejaría un trabajo y la fila muestra por dónde baja cada peso.',
    },
    grupos: {
      obligaciones: {
        que: 'Qué son las obligaciones',
        texto:
          'Reúnen siempre una parte de cada ingreso, como el diezmo o Ingresos Brutos. Quedan como deuda hasta que registrás el pago, y ahí vuelven a cero.',
      },
      compromisos: {
        que: 'Qué son los compromisos',
        texto:
          'Juntan hasta el monto de lo que tenés que pagar: sueldos, alquiler, cuotas o la luz. Quedan como deuda hasta que registrás el pago. Si les ponés el día de pago, aparecen en la agenda y te avisan.',
      },
      ahorros: {
        que: 'Qué son los ahorros',
        texto:
          'Apartan una parte de la ganancia: un monto fijo por mes o por trabajo, o un porcentaje de lo que sobra. Pueden juntar sin fin o hasta llegar a su meta.',
      },
      superavit: {
        que: 'Qué es el superávit',
        texto: 'Lo que sobra después de todo. De acá salen los gastos extra y los imprevistos.',
      },
    },
    insumos: {
      que: 'Qué son los insumos',
      texto:
        'Lo que queda de la seña de cada trabajo en curso: lo que te pagaron menos lo que ya gastaste en ese trabajo. Está en Maun hasta que el trabajo se cobra.',
    },
    ingreso: {
      que: 'Qué es el ingreso',
      texto: 'Lo que deja cada trabajo: lo cobrado menos los gastos.',
    },
    ingresoLibre: {
      que: 'Qué es el ingreso libre',
      texto: 'El ingreso menos las obligaciones.',
    },
    ganancia: {
      que: 'Qué es la ganancia',
      texto: 'Lo que queda después de las obligaciones y los compromisos.',
    },
    base: {
      que: 'Sobre qué se calcula',
      cobrado: {
        rotulo: 'Sobre lo que cobrás:',
        texto: 'todo lo que entró del trabajo, como Ingresos Brutos.',
      },
      ingreso: {
        rotulo: 'Sobre el ingreso:',
        texto: 'lo que queda después de las obligaciones de arriba.',
      },
      cuotaFija:
        'Si pagás Ingresos Brutos como una cuota fija por mes (por ejemplo, adentro del monotributo), cargalo como un compromiso.',
    },
    modo: {
      compromiso: {
        mes: { rotulo: 'Por mes:', texto: 'recibe hasta el monto en cada mes.' },
        saldo: {
          rotulo: 'Se renueva al pagar:',
          texto: 'junta hasta tener el monto, y cuando registrás el pago vuelve a juntar.',
        },
      },
      ahorroFijo: {
        mes: { rotulo: 'Por mes:', texto: 'hasta el monto en cada mes.' },
        saldo: {
          rotulo: 'Se repone al usarlo:',
          texto: 'junta hasta tener el monto, y cuando gastás de ahí vuelve a juntar.',
        },
        trabajo: { rotulo: 'Por trabajo:', texto: 'el monto en cada cobro.' },
      },
    },
    meta: {
      que: 'Qué es hasta la meta',
      texto:
        'Cuando el tesoro llega a su meta deja de recibir, y lo que le tocaba sigue hacia abajo hasta el superávit.',
    },
    superavit: {
      que: 'Dónde cae lo que sobra',
      texto: 'Elegí qué tesoro recibe lo que sobra. Si es Maun, queda en la caja del taller.',
    },
  },
} as const;
