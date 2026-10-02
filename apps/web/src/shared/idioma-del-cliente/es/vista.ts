import type { MotivoDeLaEntrega, TextosDeLaVista } from '@maun/domain';

const CUALES: readonly string[] = [
  '',
  'la única',
  'las dos',
  'las tres',
  'las cuatro',
  'las cinco',
  'las seis',
];

const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

export const vista = {
  delDominio: {
    hitos: {
      estimativo: {
        etiqueta: 'Te pasamos un número estimado',
        futuro: 'Te pasamos un número estimado',
      },
      presupuesto: {
        etiqueta: 'Presupuesto enviado',
        futuro: 'Te vamos a pasar el presupuesto',
      },
      aprobado: {
        etiqueta: 'Aprobado, seña cobrada',
        futuro: 'Cuando lo apruebes y dejes la seña',
      },
      fabricacion: { etiqueta: 'En fabricación', futuro: 'Vamos a empezar a fabricarlo' },
      entregado: { etiqueta: 'Entregado', futuro: 'Lo llevamos y lo instalamos' },
      pagado: { etiqueta: 'Pagado', futuro: 'Cuando esté saldado' },
    },
    aprobadoSinLaSena: 'Aprobado',
    cuandoLoApruebes: 'Cuando lo apruebes',
    cuandoDejesLaSena: 'Cuando dejes la seña',
    yaEstaPagado: 'Ya está pagado',
    enCurso: {
      estimativo: 'Te pasamos un número estimado',
      presupuesto: 'Estamos preparando tu presupuesto',
      aprobado: 'Recibimos la seña y ya estás en la cola del taller',
      fabricacion: 'Lo estamos fabricando',
      entregado: 'Ya está instalado en tu casa',
      pagado: 'Listo, está saldado',
    },
    presupuestoMandado: 'Te pasamos el presupuesto',
    titularDelAprobado: {
      cubierta: 'Recibimos la seña y ya estás en la cola del taller',
      falta: 'Lo aprobaste y falta la seña para entrar en la cola del taller',
      'sin-presupuesto': 'Lo aprobaste y ya estás en la cola del taller',
    },
    sigue: {
      estimativo: 'Si seguimos adelante, lo próximo que vas a ver acá es el presupuesto.',
      presupuesto: 'Lo próximo que vas a ver acá es el presupuesto.',
      aprobado: 'Lo próximo que vas a ver acá es el arranque de la fabricación.',
      fabricacion: 'Lo próximo que vas a ver acá es la entrega.',
      entregado: 'Lo próximo que vas a ver acá es el pago del saldo.',
    },
    titularListo: 'Tu mueble está listo',
    listoParaEntregar: 'Listo para entregar',
    sigueListo: {
      'sin-pedido': 'Lo próximo es acordar el día de la entrega.',
      'un-dia': 'Lo próximo es que nos digas si te queda bien ese día.',
      'sus-dias': 'Lo próximo es que nos pases los días que te quedan bien.',
      mandados: 'Lo próximo es que te confirmemos el día.',
    },
    sigueConLaComprometida: 'Lo próximo que vas a ver acá es la entrega.',
    sigueConElPresupuestoMandado: 'Lo próximo es que lo apruebes y dejes la seña.',
    sigueConLaSenaCubierta: 'Lo próximo es que lo apruebes.',
    sigueConElPresupuestoVencido: 'Lo próximo es que le escribas al taller para actualizarlo.',
    sigueFaltaLaSena: 'Lo próximo es que dejes la seña.',
    sigueFaltaMedir: {
      estimativo: 'Si seguimos adelante, lo próximo es ir a medir para pasarte el presupuesto.',
      presupuesto: 'Lo próximo es ir a medir, para poder pasarte el presupuesto.',
    },
    relevamientoTecnico: 'Relevamiento técnico',
    queEsElRelevamiento: [
      'El siguiente paso es el relevamiento técnico en obra. Es una visita donde relevamos medidas exactas, revisamos instalaciones y definimos detalles constructivos para poder proyectar tu mueble al milímetro.',
      'A partir de ese relevamiento te entregamos el diseño 3D y el presupuesto final y definitivo.',
    ],
    eventos: {
      estimativo: 'Te pasamos un número estimado',
      relevamiento: 'Fuimos a medir',
      presupuesto: 'Te pasamos el presupuesto',
      pago: 'Recibimos tu pago',
      pagoQueSalda: 'Recibimos el pago y quedó saldado',
      saldoQueSalda: 'Recibimos el saldo y quedó saldado',
      aprobado: 'Aprobaste el presupuesto',
      inicio: 'Empezamos a fabricarlo en el taller',
      listo: 'Terminamos tu mueble',
      entregado: 'Lo llevamos y lo instalamos',
    },
    comoPagar: {
      titulo: 'Cómo pagar',
      etiquetaDelImporte: { sena: 'Ahora, la seña', saldo: 'Ahora, el saldo' },
      nombre: { sena: 'la seña', saldo: 'el saldo' },
      porTransferenciaOEnEfectivo: 'por transferencia o en efectivo',
      porTransferencia: 'por transferencia',
      enEfectivo: 'en efectivo',
      pasosParaTransferir:
        'Copiá el alias, pegalo en Transferir en la app de tu banco o de tu billetera, escribí el monto y confirmá.',
      soloEfectivo: {
        sena: 'La seña es en efectivo, en mano. Lo coordinás con el taller.',
        saldo: 'El saldo es en efectivo, en mano. Lo coordinás con el taller.',
      },
      tambienEfectivo: {
        sena: 'La seña también la podés dejar en efectivo, en mano, coordinándolo con el taller.',
        saldo: 'El saldo también lo podés pagar en efectivo, en mano, coordinándolo con el taller.',
      },
    },
    proyeccion: {
      coordinamosLaEntrega: 'Cuando lo apruebes y dejes la seña, coordinamos la fecha de entrega.',
      coordinamosLaEntregaAlAprobar: 'Cuando lo apruebes, coordinamos la fecha de entrega.',
      vencio: (fecha) =>
        `Este presupuesto venció el ${fecha}. Hablá con el taller para actualizarlo.`,
      siLoAprobasAntesDel: (antesDe, listoPara) =>
        `Si lo aprobás antes del ${antesDe}, podríamos tenerlo listo para el ${listoPara}.`,
      siDejasLaSenaAntesDel: (antesDe, listoPara) =>
        `Si dejás la seña antes del ${antesDe}, podríamos tenerlo listo para el ${listoPara}.`,
      vamosTomandoLosTrabajos: 'Vamos tomando los trabajos a medida que entran las señas.',
    },
    nota: {
      pendiente: {
        etiqueta: 'Por qué el número todavía puede cambiar',
        titulo: 'El número todavía puede cambiar',
      },
      hecho: {
        etiqueta: 'De dónde sale este número',
        titulo: 'El número ya está tomado de las medidas reales',
      },
      yaFuimosAMedir: 'Ya fuimos a medir.',
      fuimosAMedirEl: (fecha) => `Fuimos a medir el ${fecha}.`,
      armamosElPresupuesto: 'Con esas medidas armamos el presupuesto final.',
      cerrandoElPresupuesto: 'Con esas medidas estamos cerrando el presupuesto final.',
      resumenYaFuimos: 'Ya fuimos a medir',
      medidoEl: (fecha) => `Medido el ${fecha}`,
      faltaMedirDelEstimado: [
        'Lo que te pasamos es un estimado, sacado de lo que hablamos.',
        'Para cerrarlo tenemos que ir a tu casa a tomar las medidas.',
      ],
      sinFechaParaLaVisita: 'Todavía no tenemos fecha para la visita.',
      quedamosEnIrEl: (fecha) => `Quedamos en ir el ${fecha}.`,
      resumenFaltaMedir: 'Número estimado, falta ir a medir',
    },
  } as const satisfies TextosDeLaVista,
  pantalla: {
    abriendo: 'Abriendo tu mueble',
    sinSenal: {
      titulo: 'Sin conexión',
      texto: 'Necesitás señal para ver el trabajo. Probá de nuevo cuando vuelva.',
    },
    error: {
      titulo: 'No pudimos cargar tu mueble',
      texto: 'Se cortó la conexión antes de que llegaran los datos. El enlace sigue siendo válido.',
      reintentar: 'Probar de nuevo',
    },
    muerto: {
      enlace: {
        titulo: 'Este enlace ya no funciona',
        texto:
          'Los enlaces que comparte el taller se dan de baja cuando hace falta. Pedile uno nuevo a quien te lo pasó y vas a poder ver todo de nuevo.',
      },
      trabajo: {
        titulo: 'Ese trabajo no está',
        texto: 'Puede que lo hayas borrado, o que el enlace apunte a un trabajo de otro taller.',
      },
    },
  },
  comoPagar: {
    oPorMercadoPago:
      'O pagá desde Mercado Pago, sin copiar nada: tocá el botón, escribí el monto de arriba y confirmá.',
    pedileLosDatos:
      'Para transferir, pedile los datos de la cuenta al taller: todavía no los cargó.',
    pagarConMercadoPago: 'Pagar con Mercado Pago',
    despues: (nombre: string, comoSePaga: string) => `Después, ${nombre}, ${comoSePaga}.`,
    despuesConElImporte: (nombre: string, importe: string, comoSePaga: string) =>
      `Después, ${nombre}: ${importe}, ${comoSePaga}.`,
    vencio: (fecha: string) =>
      `Este presupuesto venció el ${fecha}. Escribile al taller para actualizarlo antes de pagar.`,
    copiarElMonto: 'Copiar el monto',
    alias: 'Alias',
    copiarElAlias: 'Copiar el alias',
    cbu: 'CBU',
    copiarElCbu: 'Copiar el CBU',
    cvu: 'CVU',
    copiarElCvu: 'Copiar el CVU',
    titular: 'Titular de la cuenta',
    copiarElTitular: 'Copiar el titular',
    cuit: 'CUIT del titular',
    copiarElCuit: 'Copiar el CUIT',
    fijateQueSeaEsta:
      'Antes de confirmar, tu banco te muestra a nombre de quién está la cuenta: fijate que sea esta.',
    enMoneda: { ARS: 'En pesos', USD: 'En dólares' },
    hoySon: (pesos: string, dolar: string) => `Hoy son ${pesos}, con el dólar a ${dolar} de hoy.`,
    hoyEnPesos: 'Hoy, en pesos',
    copiarElMontoEnPesos: 'Copiar el monto en pesos',
    teLoPasaElTaller: 'El importe en pesos te lo pasa el taller el día que pagás.',
    loAcordasConElTaller: 'El importe en dólares lo acordás con el taller el día que pagás.',
    oPorMercadoPagoEnPesos:
      'O pagá desde Mercado Pago, sin copiar nada: tocá el botón, escribí el monto en pesos de arriba y confirmá.',
    oPorMercadoPagoSinElMonto:
      'O pagá desde Mercado Pago: tocá el botón, escribí el monto en pesos que te pase el taller y confirmá.',
  },
  pagina: {
    tuMueble: 'Tu mueble',
    enQueAnda: 'En qué anda',
    elCaminoDeTuMueble: 'El camino de tu mueble',
    loQueFuePasando: 'Lo que fue pasando',
    loQuePagaste: 'Lo que pagaste',
    fotosYPlanos: 'Fotos y planos',
    archivos: (cantidad: number) => (cantidad === 1 ? '1 archivo' : `${String(cantidad)} archivos`),
    todaviaNoHayFotos: 'Todavía no hay fotos',
    acaVanAAparecer:
      'Acá van a aparecer los planos, los renders y las fotos que el taller comparta, del diseño a la entrega.',
    ver: (nombre: string) => `Ver ${nombre}`,
    tipos: {
      imagen: 'Imagen',
      pdf: 'PDF',
      otro: 'Archivo',
    },
    pago: 'Pago',
    pagasteConElDolar: (pagado: string, dolar: string) =>
      `Pagaste ${pagado} con el dólar a ${dolar}`,
    precioEnPesos: {
      deHoy: (pesos: string, dolar: string) => `Hoy son ${pesos}, con el dólar a ${dolar} de hoy.`,
      delDia: (pesos: string, dolar: string, fecha: string) =>
        `Son ${pesos}, con el dólar a ${dolar} del ${fecha}.`,
    },
    finDeLaVista:
      'Esta página la arma el taller para vos y se actualiza sola a medida que avanza el trabajo. Si algo no coincide, escribile al taller.',
    buenasNoticias: (cuando: string) => `¡Buenas noticias! Lo estamos entregando el ${cuando}.`,
    cifras: {
      presupuesto: 'Presupuesto',
      senaParaArrancar: 'Seña para arrancar',
      pagaste: 'Pagaste',
      vale: 'Vale',
    },
    opciones: (cantidad: number) => (cantidad === 1 ? '1 opción' : `${String(cantidad)} opciones`),
    miraLasOpciones: (cantidad: number) =>
      `Mirá ${CUALES[cantidad] ?? 'todas'} en el presupuesto y avisale al taller cuál preferís.`,
    presupuestoVencido: (fecha: string) =>
      `El presupuesto venció el ${fecha}: escribile al taller para actualizarlo.`,
    valorDelRelevamiento: (valor: string) =>
      `El valor del relevamiento es de ${valor} y, si decidís avanzar, se toma a cuenta como parte de la seña del proyecto.`,
    quedaACuenta: 'Lo que pagaste queda a cuenta de la seña.',
    teQuedanParaLaSena: (falta: string) =>
      `Lo que pagaste queda a cuenta de la seña: te quedan ${falta} para completarla.`,
    laSenaYaEstaCubierta: 'Con lo que pagaste ya está cubierta la seña.',
    aCuentaDeLaSena: 'A cuenta de la seña',
    saldo: {
      faltaElPresupuesto: 'Falta el presupuesto',
      estaSaldado: 'Está saldado',
      teFaltaPagar: 'Te falta pagar',
    },
    datos: {
      titulo: 'Datos del trabajo',
      direccion: 'Dirección',
      empezamos: 'Empezamos',
      todaviaNo: 'Todavía no',
      sena: 'Seña',
      total: 'Total',
      aConfirmar: 'A confirmar',
      senaPagada: (sena: string) => `${sena} · pagada`,
      senaQueFalta: (sena: string, falta: string) => `${sena} · te faltan ${falta}`,
      totalPagado: (total: string) => `${total} · pagado`,
    },
    entrega: {
      estimada: 'Entrega estimada',
      confirmada: 'Entrega confirmada',
      entregado: 'Entregado',
      entrega: 'Entrega',
      aCoordinar: 'A coordinar',
      fechaEstimada: (fecha: string) => `Fecha estimada de entrega: ${fecha}`,
      entregadoEl: (fecha: string) => `Entregado el ${fecha}`,
      siNecesitasCambiarElDia: 'Si necesitás cambiar el día, escribile al taller.',
      podemosEntregarlo: 'Podemos entregarlo.',
    },
    paraCuando: 'Para cuándo',
    pagos: {
      sinPagosAprobado:
        'Todavía no hay ningún pago registrado. Lo primero es la seña: apenas el taller la anote, la vas a ver acá.',
      losAnotaElTaller:
        'Los pagos aparecen acá cuando el taller los anota, no en el momento en que transferís.',
      elPagoSeCoordina: 'Para pagar, escribile al taller y lo coordinan entre ustedes.',
      noQuedaNada: 'Gracias. No queda nada pendiente.',
    },
  },
  coordinar: {
    titulo: 'Coordinemos la entrega',
    teProponemos: 'Te proponemos este día:',
    meQuedaBien: 'Me queda bien',
    mandando: 'Mandando…',
    noPuedoEseDia: 'No puedo ese día',
    marcaLosDias: {
      'un-dia':
        'Marcá los días que te quedan bien y si es a la mañana, a la tarde o las dos. Entregamos de lunes a sábado.',
      'sus-dias':
        'Para coordinar la entrega, marcá los días que te quedan bien y si es a la mañana, a la tarde o las dos. Entregamos de lunes a sábado.',
    },
    llegasteAlMaximo: 'Llegaste a diez días, que es lo máximo.',
    tusDias: 'Tus días',
    horarioDel: (dia: string) => `Horario del ${dia}`,
    franjas: {
      manana: 'A la mañana',
      tarde: 'A la tarde',
    },
    sacar: (dia: string) => `Sacar el ${dia}`,
    sacarEsteDia: 'Sacar este día',
    algoQueTengamosQueSaber: '¿Algo que tengamos que saber?',
    porEjemplo:
      'Por ejemplo, si hay portero, el piso o un horario que no podés. Si no marcás días, contanos acá cuándo te queda bien.',
    mandarMisDias: 'Mandar mis días',
    volverAlDiaQueTePropusimos: 'Volver al día que te propusimos',
    dejarlosComoEstaban: 'Dejarlos como estaban',
    cambiarMisDias: 'Cambiar mis días',
    quedoConfirmada: 'Nos dijiste que te queda bien ese día: la entrega quedó confirmada.',
    losDiasMandados:
      'Nos pasaste estos días. Vamos a elegir uno y te lo confirmamos en esta página.',
    laNotaMandada:
      'Nos dejaste una nota. Vamos a elegir el día y te lo confirmamos en esta página.',
    conFranja: {
      manana: (dia: string) => `${dia}, a la mañana`,
      tarde: (dia: string) => `${dia}, a la tarde`,
    },
    conLasDosFranjas: (dia: string) => `${dia}, a la mañana o a la tarde`,
    listoTusDias: 'Listo: le pasamos tus días al taller. Te va a confirmar uno.',
    listoElDia: 'Listo: quedó confirmado el día de la entrega.',
    listoTeEsperamos: (cuando: string) => `Listo: te esperamos el ${cuando}.`,
    yaEstabaConfirmada: 'El taller ya confirmó el día de la entrega: lo ves arriba.',
    cambioElPedido:
      'Mientras elegías, el taller cambió lo que te pidió. Ya está al día: fijate lo nuevo.',
    motivos: {
      forma: 'La página mandó algo que no esperábamos. Recargala y probá de nuevo.',
      propuesta: 'Ese día ya no se puede aceptar: el taller te pidió tus días. Recargá la página.',
      vacia: 'Marcá al menos un día, o escribinos cuándo te queda bien.',
      demasiados: 'Son más de diez días: sacá alguno.',
      repetido: 'Vino dos veces el mismo día. Recargá la página y probá de nuevo.',
      fuera: 'Un día quedó fuera de los que se pueden elegir. Recargá la página y elegí de nuevo.',
      domingo: 'Los domingos no entregamos. Sacá ese día.',
      franja: 'A un día le falta la mañana o la tarde.',
      largo: 'La nota pasa de los 500 caracteres.',
      tope: 'Ya nos contestaste muchas veces. Escribile al taller.',
      'sin-senal':
        'No se pudo mandar: se cortó la conexión. Lo que marcaste sigue acá; probá de nuevo cuando vuelva la señal.',
      'no-se-pudo': 'No pudimos mandarlo. Probá de nuevo en un rato.',
    } satisfies Readonly<Record<MotivoDeLaEntrega | 'sin-senal' | 'no-se-pudo', string>>,
    calendario: {
      iniciales: ['l', 'm', 'm', 'j', 'v', 's', 'd'],
      meses: MESES,
      dia: (diaDeLaSemana: number, dia: number, mes: number) =>
        `${DIAS[diaDeLaSemana] ?? ''} ${String(dia)} de ${(MESES[mes] ?? '').toLowerCase()}`,
    },
  },
  notaDelRelevamiento: {
    entendido: 'Entendido',
  },
  vidriera: {
    masTrabajos: 'Más trabajos del taller',
    enLasRedes: 'El taller en las redes',
    fotosDeOtrosTrabajos: 'Fotos de otros trabajos del taller',
    foto: (numero: number, total: number) => `Foto ${String(numero)} de ${String(total)}`,
    fotosAnteriores: 'Fotos anteriores',
    fotosSiguientes: 'Fotos siguientes',
    enInstagram: (usuario: string) => `${usuario} en Instagram`,
    facebook: 'Facebook del taller',
    tiktok: 'TikTok del taller',
    compartir: 'Compartir',
    copiado: 'Copiado',
    paraCompartir: 'Para compartir, este enlace',
    copiarElEnlace: 'Copiar el enlace',
  },
} as const;
